/*
 * English translation of js/data/lessons-db.js — task T1023. Format: js/core/i18n.js (content overlay).
 * ids: lesson-db-011
 */
App.i18n.content({
  'lesson-db-011': {
    title: 'WAL and crash recovery: redo commits, discard uncommitted',
    goals: [
      'Explain the write-ahead rule: the log must be durable before reporting commit',
      'Simulate crashes at many points and see why only committed transactions are applied',
      'Implement recover() walking the log: checkpoint truncates, COMMIT means redo, no COMMIT means skip',
      'Relate PostgreSQL WAL, checkpoints, and recovery time'
    ],
    body: `**Summary:** WAL (Write-Ahead Log) is the database mechanism that writes a description of a change into a durable log **before** modifying the data page and before reporting the transaction (transaction: a group of operations treated as one unit) as committed. On a crash (power loss, process death), the database reads the log from the checkpoint and **redoes** changes of transactions that have a COMMIT, while **skipping** transactions that never committed. Committed data is not lost; uncommitted data does not leak out.

### Why WAL is needed
Writing directly to the data file on every UPDATE is expensive: the data file consists of scattered pages, and random I/O is slow; a crash in the middle can leave a half-written (torn) page. WAL turns changes into small records and **appends** them to a sequential log file. Sequential writes are fast, and a single {{fsync}} (forcing the buffer down to durable disk) can confirm a commit.

The core rule: **the log record must be durable on disk before the data page is written down, and before the client receives "commit succeeded".**

~~~text
Simplified flow (one transaction):
  BEGIN
  SET balance=80 WHERE id=A  -> log (LSN=1, T1, SET, A, 80)
  SET balance=120 WHERE id=B -> log (LSN=2, T1, SET, B, 120)
  COMMIT                     -> log (LSN=3, T1, COMMIT) then fsync
                               -> now report "commit OK"
  (data pages A,B may still be in buffer, flushed later - checkpoint)

LSN = Log Sequence Number: the monotonically increasing sequence number of records in the log.
~~~

### Where can a crash happen?
- Crash **before** the COMMIT fsync: the transaction is not confirmed -> recovery skips its SETs.
- Crash **after** the COMMIT has been fsynced: the client already got "OK" -> recovery must redo the SETs (even if the data page was never written).
- Interleaved transactions: each transaction is judged independently by whether its COMMIT became durable.

### Recover: redo committed transactions
Minimal algorithm (redo-only, in the spirit of PostgreSQL):
1. Start from the **checkpoint**. Only read log records from {{fromLsn}} onward.
2. Determine which transactions have a {{COMMIT}}. Apply (redo) SET/DEL of committed transactions in log order. Skip operations of transactions that never committed/aborted.
3. The final state is consistent after the crash.

Redo should be **idempotent** (re-running yields the same result) in real designs; setting the same value is naturally idempotent.

~~~seq
title: Crash after COMMIT T1, T2 uncommitted
actors: App | DB | WAL | Data
App -> DB: T1 SET A=80; SET B=120; COMMIT
DB -> WAL: append SET,SET,COMMIT; fsync
WAL --> DB: durable
DB --> App: commit OK (T1)
App -> DB: T2 SET A=999 (not yet COMMIT)
DB -> WAL: append SET(A,999)
note DB,Data: CRASH - buffer not flushed
DB -> WAL: recover() from checkpoint
WAL --> DB: T1 has COMMIT -> redo A=80,B=120; T2 skipped
DB -> Data: state: A=80, B=120
~~~

### Real PostgreSQL WAL (differs from the simulation)
- WAL is a binary segment file (usually 16 MB) in {{pg_wal}}; records are at page-change level, not key/value.
- Periodic checkpoints flush dirty pages to data files; {{checkpoint_timeout}}, {{max_wal_size}} affect frequency. More frequent checkpoints -> faster recovery but more background I/O.
- {{synchronous_commit}} controls when fsync happens: by default safe; disabling it may lose a few recent transactions on an OS crash, in exchange for higher throughput.
- Full page writes occur after a checkpoint to guard against torn pages. Streaming replicas receive WAL; PITR uses a base backup plus WAL archive.

### Common mistakes
- Applying every record during recovery: wrong, uncommitted transactions must be skipped.
- Writing the data page before the log: violates write-ahead.
- Thinking a checkpoint lets you delete all log: WAL must be kept long enough for recovery/replicas.
- Ignoring LSN order: redo must follow log order.

### Interview notes
Emphasize: (1) the commit reply to the client is sent only after the COMMIT record is fsynced; (2) crash recovery redoes transactions with a COMMIT from the checkpoint; (3) the trade-offs of {{synchronous_commit}}/checkpoint/IO. "Does a power outage lose an order already reported as successful?" -> no, if the COMMIT is durable.

> Senior tip: watch for abnormal growth of {{pg_wal}} (often caused by a replication slot holding it or archiving stuck), checkpoint timing, and {{pg_stat_bgwriter}}.`,
    exercises: [
      {
        title: 'WalStore: commit, simulated crash, recover()',
        prompt: `Implement {{WalStore}} simulating a key/value WAL (simplified):
- {{put(tx, key, value)}}: append a SET log record for transaction {{tx}}.
- {{del(tx, key)}}: append a DEL record.
- {{commit(tx)}}: append a COMMIT record. Only transactions with a COMMIT succeed.
- {{abort(tx)}}: append an ABORT record.
- {{recover(Map<String,Integer> base, int fromLsn)}}: return the {{Map<String,Integer>}} state after recovery. Start from a copy of {{base}} (null treated as empty). Only consider records with {{lsn >= fromLsn}} (checkpoint). Apply SET/DEL of transactions that **have a COMMIT** (not aborted) in log order. Transactions not committed/aborted -> skip entirely. When the same key is set multiple times by committed txns: the last value in log order wins.

Simplified: log kept in memory; "crash" is simulated by calling {{recover}}; LSN increases from 1; goal is correctness of the redo-commits, skip-uncommitted rule.`,
        hints: [
          'Each record needs an increasing lsn, tx id, op (SET/DEL/COMMIT/ABORT), key, value. put/del/commit/abort only append to the log.',
          'recover: determine the set of tx with a COMMIT (not aborted) among records with lsn >= fromLsn; then walk the log in lsn order and apply SET/DEL only of those tx onto a copy of base.',
          'A txn without a COMMIT -> skip all its operations. Applying in log order makes "later committed wins" fall out naturally.',
          'Do not mutate the caller\'s base; use new LinkedHashMap<>(base).'
        ],
        explain: `Simulates the WAL rule: (1) changes become log records; (2) COMMIT is the milestone deciding a transaction survives a crash; (3) recover redoes only committed transactions, in log order, from the checkpoint (base + fromLsn).

Simplified versus PostgreSQL/InnoDB: in-memory log (no real fsync), logical key/value records instead of pages; no separate undo log, torn-page handling, group commit, or full ARIES. Still teaches the core invariant: "once commit success is reported, a crash must not lose it" and "uncommitted means the crash erases it as if it never happened".`
      }
    ],
    check: [
      {
        q: 'What does the write-ahead rule require before reporting COMMIT success?',
        options: [
          'The data page must be fully written to disk',
          'The COMMIT record (and related log) must be durable on disk (fsync the log)',
          'All indexes must be updated',
          'The client must send an acknowledgement'
        ],
        answer: 1,
        explain: 'Commit is reported only after the log is durable; the data page can be flushed later because WAL can redo it.'
      },
      {
        q: 'After a crash, a transaction wrote a SET but never had a durable COMMIT. What happens?',
        options: ['Still redo because the SET was logged', 'Skip all changes of that transaction', 'Redo only half', 'Automatically convert to COMMIT'],
        answer: 1,
        explain: 'Without a durable commit the transaction is treated as never successful, so it must leave no effect.'
      },
      {
        q: 'What does a checkpoint help with in recovery?',
        options: [
          'Doubles transaction speed',
          'Allows replaying only from a mark, reducing recovery time',
          'Fully replaces the WAL',
          'Ignores all uncommitted transactions in the future'
        ],
        answer: 1,
        explain: 'A checkpoint marks how far data is safely flushed, so recovery does not need to read the whole log from the beginning.'
      }
    ]
  }
});
