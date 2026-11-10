/*
 * English translation of js/data/lessons-db.js — task T1103. Format: js/core/i18n.js (content overlay).
 * ids: lesson-db-008
 */
App.i18n.content({
  'lesson-db-008': {
    title: 'MVCC: which snapshot sees which row',
    goals: [
      'Read a row through the xmin/xmax pair',
      'Reason about which version is visible under a given snapshot',
      'Distinguish a statement-level snapshot from a transaction-level snapshot',
      'Explain why an UPDATE creates a new version and what VACUUM cleans up',
    ],
    body: `**Summary:** MVCC (Multi-Version Concurrency Control — controlling concurrency through multiple versions) keeps several versions of the same row around at once, and every transaction receives a **snapshot** (a picture of the database at a point in time) that decides which version it is allowed to see. A reader never has to wait for a writer, but in return every UPDATE leaves a "dead tuple" in the table and VACUUM can only remove it once no snapshot needs it any more.

### One "row" is really a chain of versions
A table in PostgreSQL is split into 8 KB **pages**. On every INSERT or UPDATE, the database does not modify in place but **appends a tuple** (one version of a row) to a page that still has space. Row id=42 can therefore have three tuples all carrying id=42 in the same page. Reading a row really means: pick, from that chain of tuples, the tuple that my transaction is **allowed to see**.

There are three schools for handling two transactions that touch the same row:

| School | What happens | Cost |
|---|---|---|
| Lock the row, readers must wait for writers (SQL Server default, PostgreSQL on UPDATE/SELECT FOR UPDATE) | exactly one copy on disk at all times | readers are blocked, a slow reader makes everyone else wait |
| Overwrite in place, keep the old copy in an **undo log** (Oracle, MySQL InnoDB) | a reader reconstructs the old copy from the undo when needed | long undo chains, every record carries a pointer to the previous one |
| Store multiple versions right in the table (PostgreSQL) | a reader simply picks a tuple by snapshot | the table bloats with dead tuples, VACUUM must run continuously |

### xmin and xmax: two stamps on every tuple
The header of every tuple contains the two most important transaction ids (plus a physical pointer to the next version):

- **xmin**: the transaction that **created** this version (by an INSERT or by an UPDATE that produced the new copy).
- **xmax**: the transaction that **deleted or replaced** this version; 0 when nobody has touched it yet.
- A **transaction id (xid)** is a 32-bit integer that increases over time, assigned to the first transaction that performs a write (a read-only transaction does not need its own xid — it only carries a snapshot). So "a larger xid" simply means "it started writing later".

~~~text
 id | balance | xmin | xmax
 42 |   10    | 100  | 201     <- old version: T201 has replaced it
 42 |   12    | 201  |  0      <- open version (not replaced yet)
~~~

Both lines still sit in the page. Only the snapshot decides which line you read.

### A snapshot is three numbers
PostgreSQL builds a snapshot at the start of every statement ({{READ COMMITTED}}) or at the start of the transaction ({{REPEATABLE READ}} / {{SERIALIZABLE}}), consisting of:

- **xmin**: the oldest xid the snapshot still has to care about — every xid smaller than this finished long ago.
- **xmax**: the next xid that will be assigned — every xid from xmax onward happened **after** the snapshot.
- **xip**: the list of xids that were **in progress** at the exact moment the snapshot was taken (the in-progress list).

~~~sql
SELECT txid_current_snapshot();          -- for example returns: 101:105:[103,104]
--                                              xmin  xmax  xip
-- From PG 13 there is a pg_snapshot type with the functions
-- pg_snapshot_xmin / pg_snapshot_xmax / pg_snapshot_xip
-- and pg_visible_in_snapshot(xid, snapshot) to test a single xid.
~~~

Reasoning out "transaction X has finished and committed **with respect to snapshot S**":

| Position of X | Conclusion for S |
|---|---|
| X is S's own transaction | always treated as committed — you must see your own changes, even when not committed yet |
| X is smaller than S's xmin | finished before the snapshot; visible if committed, invisible if aborted (rolled back) |
| between xmin and xmax, X is in xip | was running at the moment of the snapshot → not committed → **not visible** |
| between xmin and xmax, X is not in xip | finished before the snapshot → visible if committed |
| X is xmax or above | happened after the snapshot → **not visible** (even if X has committed since) |

Put together into the visibility rule — and also the {{visible(row, snapshot)}} function in the exercise:

> A tuple is visible **if and only if**: xmin is treated as committed with respect to the snapshot, **and** xmax is NOT treated as committed with respect to the snapshot (xmax = 0 always satisfies the second part).

The first part answers "has this version existed yet", the second answers "has it been replaced yet". A transaction that aborts makes every version it created permanently invisible to everyone.

### Same schedule, two outcomes
~~~seq
title: Two transactions on the same row id 42
actors: T1 | PostgreSQL | T2
T1 -> PostgreSQL: BEGIN then first SELECT of the balance
PostgreSQL --> T1: 10 (tuple with xmin 100)
T2 -> PostgreSQL: UPDATE balance to 12
PostgreSQL -> PostgreSQL: old tuple gets xmax 201, new tuple added with xmin 201
T2 -> PostgreSQL: COMMIT
note PostgreSQL: the old tuple still sits in the page, nobody has asked to remove it
T1 -> PostgreSQL: second SELECT of the balance
PostgreSQL --> T1: READ COMMITTED sees 12 because it takes a fresh snapshot
note T1: REPEATABLE READ still sees 10 because it keeps the old snapshot
~~~

This is the whole difference packed into one word: the **snapshot point**. {{READ COMMITTED}} takes a new snapshot for every SQL statement, so two SELECTs in the same transaction can return two different values (a non-repeatable read is allowed). {{REPEATABLE READ}} takes one snapshot, so the whole transaction works on one logical state of the database — but when it wants to modify a row that someone else modified and committed after the snapshot point, PostgreSQL does **not overwrite** but reports {{could not serialize access due to concurrent update}} (SQLSTATE {{40001}}), and the application must retry the whole transaction.

### Why an UPDATE creates a new version instead of overwriting
- **Readers never wait for writers, writers never wait for readers.** That is the entire benefit: a report that reads for 10 seconds does not stall the order API, and vice versa. Only writer-vs-writer on **the same tuple** must wait (and depending on the isolation level it either waits, errors with 40001, or re-reads the new version).
- **The cost is space and indexes.** An UPDATE that is not HOT (Heap-Only Tuple — an update that only touches columns not in any index and the page still has free space) must add an entry to **every index** on the table. With HOT the index stays untouched. That is why updating an indexed column bloats the table much faster than updating a plain column.
- **Indexes do not distinguish live from dead.** An index entry points to both live and dead tuples, so when fetching a row the database must check the visibility of every line. The "all-visible" bits in the **visibility map** let it skip that check and are a necessary condition for an index-only scan.

### Dead tuples and VACUUM
A tuple that no snapshot can possibly need any more is called a **dead tuple**. VACUUM does three things:

1. Removes dead tuples and marks the freed space inside the page for reuse (it only returns space to the operating system for empty pages at the **end** of the table).
2. **Freezes** the xid of rows that are too old. An xid is only 32 bits and wraps around; if data still carries an xid that the current database interprets as "larger", it will be treated as the future and become **invisible** — data loss in theory. PostgreSQL therefore forces a vacuum at {{autovacuum_freeze_max_age}} (200 million xids by default) and may refuse to accept writes when {{age(datfrozenxid)}} approaches 2 billion.
3. Updates statistics and the visibility map.

Condition 1 has a critical consequence: **VACUUM is not allowed to remove a tuple that an open snapshot still needs.** So a single long-running transaction is enough to start bloating the whole table:

~~~sql
-- Who is holding the "xmin horizon" (the first thing to check when a table bloats unexpectedly)?
SELECT pid, state, now() - xact_start AS open_for, left(query, 60) AS last_query
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
ORDER BY xact_start;
-- Also consider: a replication slot that is not being consumed, a forgotten PREPARED transaction.
~~~

**Autovacuum** runs when the estimated number of changes crosses a threshold: {{autovacuum_vacuum_threshold}} (50) plus {{autovacuum_vacuum_scale_factor}} (0.2) times the row count — meaning a 10 million row table needs roughly 2 million modifications before it cleans itself, which is why very large tables should lower the scale factor to 0.01 or schedule manual vacuum for the hot ones.

~~~sql
SELECT relname, n_live_tup, n_dead_tup, last_autovacuum, last_vacuum
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 10;

VACUUM (VERBOSE, ANALYZE) account;   -- read "removed N dead row versions"
~~~

### Java: modelling the visibility decision
~~~java
// Tuple: (value, xmin, xmax). Snapshot: (own, the xids committed at the moment the snapshot was taken).
boolean visible(int xmin, int xmax, int own, Set<Integer> committed) {
    boolean born = xmin == own || committed.contains(xmin);        // existed for me
    boolean gone = xmax != 0 && (xmax == own || committed.contains(xmax)); // has been replaced
    return born && !gone;
}
~~~

The exercise below uses exactly the two variables {{born}} and {{gone}}; the whole "which snapshot sees which row" behaviour of PostgreSQL is wrapped up in those four lines.

### Common mistakes
- **idle in transaction**: a connection borrowed from the pool opens a transaction and then never commits or rolls back (often because the code returns early or the app crashes while the session stays alive). Set {{idle_in_transaction_session_timeout}} so the database cuts it off itself.
- **A batch job as one giant transaction**: 5 million rows in a single BEGIN/COMMIT — it holds a snapshot and produces 5 million dead tuples at the same time.
- Thinking that "UPDATE returning 0 rows means the row does not exist" at {{REPEATABLE READ}}; at this level a write conflict shows up as exception 40001, while 0 rows is usually a predicate version that no longer matches (see the optimistic locking lesson).
- **VACUUM FULL** on a large table: it rebuilds the table and takes an **exclusive lock** — do not run it during peak hours; {{pg_repack}} does the same work online.
- Bloated indexes: a regular VACUUM usually does not shrink an index, only REINDEX or {{pg_repack}} does; from PostgreSQL 14 VACUUM can remove duplicate entries in a B-tree but cannot shrink the tree.

### Interview notes
Answer in a chain of cause and effect: every row is a chain of tuples carrying xmin/xmax; a snapshot consists of xmin/xmax/xip so you can tell which xid has committed, which is running, and which belongs to the future; a tuple is visible when xmin has committed with respect to the snapshot and xmax has not; {{READ COMMITTED}} takes a snapshot per statement so it sees new commits, {{REPEATABLE READ}} takes a snapshot per transaction so it stays stable but must retry on 40001; an UPDATE writes a new version so readers do not wait for writers; the consequence is dead tuples, and VACUUM can only remove them when no old snapshot remains — which is why a long-running transaction bloats the table. Then name how you would diagnose it: {{pg_stat_activity}} to find the oldest transaction, {{pg_stat_user_tables}} to look at {{n_dead_tup}} and {{last_autovacuum}}.

> Senior tip: when asked "my table bloated to 5 times the real data", the mature answer is not "run VACUUM FULL" but "find who is holding the xmin horizon" — 90% of the time it is a job, an {{idle in transaction}}, or a replication slot that has stopped consuming.
`,
    exercises: [{
      title: 'MvccTable: which version is visible under this snapshot?',
      prompt: `Model one PostgreSQL row by the xmin/xmax rules. Implement {{MvccTable}} (and the two static classes {{MvccTable.Version}}, {{MvccTable.Snapshot}}).

- {{insert(xid, value)}}: adds a new version with {{xmin = xid}}, {{xmax = 0}}.
- {{update(xid, value)}}: **replaces** — sets {{xmax = xid}} on every open version ({{xmax = 0}}), then adds a new version {{xmin = xid}}, {{xmax = 0}}. Do not remove any old version from the table.
- {{delete(xid)}}: sets {{xmax = xid}} on every open version, adds no new version. If there is no open version, do nothing.
- {{versions()}}: every version in the exact order it was added (old versions still remain).
- {{visible(v, s)}} (static): {{true}} if and only if v's xmin "has committed with respect to s" AND v's xmax has not "committed with respect to s". For any xid, "committed with respect to s" means the xid is not 0 and ({{xid == s.own}} or {{s.committed}} contains the xid). {{s.own}} is the reading transaction: it always sees its own changes even when not committed.
- {{visibleTo(s)}}: the visible versions, keeping the order of {{versions()}}.
- {{read(s)}}: the value of the **last** visible version in insertion order (the newest version the snapshot can see), or {{-1}} if the snapshot sees no version.

Do not use threads and do not use a real clock. Every result must be deterministic.`,
      hints: [
        'A Version is immutable, so "closing" a version means replacing it with a new Version that has the same xmin and value but xmax = xid.',
        'Write a helper: an xid other than 0 and (xid equals s.own or s.committed contains the xid) is treated as committed with respect to the snapshot.',
        'A version is visible when it has been created (the xmin side) and has not been replaced (the xmax side).',
        'read walks the versions in insertion order and keeps the value of the last visible one; return -1 if there is none.',
      ],
      explain: `Two variables decide everything: has that version **been created** (xmin committed with respect to the snapshot, or it is the transaction's own) and has it **been replaced** (xmax committed with respect to the snapshot). Because the old copy is never removed, the same table yields different data sets depending on the snapshot — that is the content of the word isolation in an interview answer. {{READ COMMITTED}} swaps the snapshot after every statement so it sees a newly committed xmax; {{REPEATABLE READ}} keeps the old snapshot so it sees the old value again, and that very inability is why PostgreSQL must report 40001 when the transaction tries to overwrite a version it cannot see. In this model, {{update}} closes **every** open version for simplicity; real PostgreSQL blocks the second transaction from writing the same row until the first one finishes, so there is almost never more than one open version. The model also treats "abort" as not committed: a version created by a rolled back transaction stays invisible forever, and VACUUM will remove it.`,
    }],
    check: [
      {
        q: 'Which condition is the visibility rule for a tuple under an MVCC snapshot?',
        options: [
          'xmin has committed with respect to the snapshot, regardless of xmax',
          'xmax equals 0',
          'xmin is smaller than the snapshot\'s xmax',
          'xmin is treated as committed with respect to the snapshot and xmax is not',
        ],
        answer: 3,
        explain: 'Both parts are required: the version must have existed for the reader, and it must not have been replaced with respect to that snapshot.',
      },
      {
        q: 'Why does an UPDATE write a new version instead of modifying in place?',
        options: [
          'Because an 8 KB page does not allow overwriting',
          'Because indexes do not support updates',
          'So that readers do not wait for writers and an old snapshot can still read the old value',
          'Because VACUUM needs the original copy to recover after a crash',
        ],
        answer: 2,
        explain: 'That is the whole purpose of MVCC: reads are not blocked by writes, and an old snapshot keeps its meaning.',
      },
      {
        q: 'A table is bloating and n_dead_tup keeps growing even though autovacuum runs. What do you check first?',
        options: [
          'Raise the index fillfactor',
          'Drop and rebuild every index',
          'Find the oldest open transaction, any idle in transaction session, and any unconsumed replication slot in pg_stat_activity',
          'Increase shared_buffers',
        ],
        answer: 2,
        explain: 'VACUUM cannot remove a tuple that an open snapshot still needs; an old snapshot also blocks freezing and WAL reclamation.',
      },
      {
        q: 'At REPEATABLE READ, you UPDATE a row that another transaction modified and committed after your snapshot. Then:',
        options: [
          'PostgreSQL overwrites it and returns 1 row',
          'PostgreSQL reports could not serialize access due to concurrent update (SQLSTATE 40001)',
          'the transaction silently drops down to READ COMMITTED',
          'the error is hidden because MVCC blocks every write conflict',
        ],
        answer: 1,
        explain: 'The old snapshot does not allow overwriting the new version; PostgreSQL aborts the transaction and the application must retry the whole thing.',
      },
    ],
  },
});
