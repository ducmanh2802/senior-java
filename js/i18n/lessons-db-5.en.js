/*
 * English translation of js/data/lessons-db.js — task T1022. Format: js/core/i18n.js (content overlay).
 * ids: lesson-db-009 lesson-db-010
 */
App.i18n.content({
  'lesson-db-009': {
    title: 'WAL, commit and crash recovery: why losing power does not lose committed data',
    goals: [
      'Explain why the database does not write data pages immediately on commit',
      'State the two rules of the write-ahead log',
      'Derive the outcome at each crash point around the commit record',
      'Explain checkpoint, full page write, and why pg_wal can fill the disk',
      'Write a redo log replayer in plain Java',
    ],
    body: `**Summary:** **WAL** (Write-Ahead Log — a log written before) is an append-only file holding a description of every change plus BEGIN/COMMIT/ABORT records. The core rule: the change description must be **durable on disk before** the transaction is reported as committed, while the real data page may be written later, when idle. So a power loss only loses what was never committed; what was committed is recovered by **redo replaying** the log.

### The problem: one transaction touches many pages scattered around

Imagine a business operation updating 40 rows across three tables. Data is organized into **pages** of 8 KB, so those 40 rows land in more than a dozen pages at different positions across several files. If the database required those pages to be on disk before returning "commit", each commit would need dozens of seeks plus dozens of **fsync** calls (a command asking the OS to flush everything it is buffering to the device, and only replying once the device confirms it received it all). On a hard disk one fsync costs a few ms to over a dozen ms: commits take 50–100 ms, the whole system does only a few dozen transactions per second. Worse, the same row being updated 100 times a day means rewriting the whole 8 KB page for a few changed bytes.

### A few terms to agree on first

| Term | Meaning, easy to picture |
|---|---|
| **page** (sometimes called a block) | an 8 KB chunk, the smallest unit the database reads/writes with the OS. Like a notebook page: you do not edit one letter, you copy the whole page into RAM, edit it, then write it back. |
| **shared buffers / buffer cache** | the database server's RAM area holding the pages being worked on. A freshly edited page is called **dirty** because its RAM content differs from what is on disk. |
| **fsync** | the command telling the OS "flush everything you are buffering to the real device, then reply". This is the boundary between "still in RAM" and "durable". |
| **log record** | one entry describing a change, shaped like "page 77 of this file, from byte 120, now holds these bytes". |
| **redo (replay)** | read the log from a known point and re-apply the changes onto pages, rebuilding the state RAM never got to write. |
| **checkpoint** | the moment the database proactively writes every dirty page to disk and records a marker; from then on older log is no longer needed for recovery. |
| **transaction abort / rollback** | a transaction ending without committing; its changes are discarded. |

### The two rules of the write-ahead log

1. Before reporting commit to the client, every log record describing that transaction's changes has been fsynced to disk.
2. A page is only written to the data file after the records describing its changes are durable.

Thanks to these two rules, writes become **sequential appends** to one log file (cheap on every disk type, very cheap on SSDs), while data pages are written late and batched: a page changed 50 times only has to be written to disk once.

In PostgreSQL the log lives in the **pg_wal** directory, made of 16 MB segment files. Each record has an **LSN** (Log Sequence Number) — essentially the byte offset from the start of the log stream — used as a "clock" to know which record came before which, and so a replica can say "I have received up to here".

### What commit really is

~~~seq
title: An UPDATE's path, from execution to being considered durable
actors: App | Backend | WAL | Data file
App -> Backend: UPDATE account SET balance = 12 WHERE id = 42
Backend -> Backend: modify tuple in shared buffers, page becomes dirty
Backend -> WAL: write change record, receive LSN 100
App -> Backend: COMMIT
Backend -> WAL: write COMMIT record then fsync the whole log
WAL --> App: OK, your transaction is durable
note Data file: the page with row 42 is still the old page, not written yet
Backend -> Data file: checkpoint writes that page later
~~~

The COMMIT record whose fsync completed is the **point of no return**. Everything else — writing pages, cleaning dead tuples, updating statistics — happens after that and failing also does not lose committed data. Because a transaction only waits for exactly one fsync, PostgreSQL batches many waiting transactions into one fsync (**group commit**); that is why commit throughput rises sharply under moderate load.

### What happens if we crash at each point

| Crash timing | Result on reopen |
|---|---|
| Before the COMMIT record is fsynced | the transaction disappears entirely; the client never received OK, so nobody was misled |
| After COMMIT fsync, before the data page is written | recovery replays the log and writes the change into the page — data returns to the correct state |
| Page written half-way (**torn page**: an 8 KB database page is larger than a disk sector, so it may be half written then die) | the full-page image written into WAL on the first change after a checkpoint is used to restore the whole page |
| Dying while writing the WAL record itself | the half record is discarded because its length/LSN/checksum do not match; if COMMIT was never fsynced it is treated as never having happened |

A nice observation: **no undo is needed for a dead transaction**. Its changes live in RAM and die with the process; if part of them was "stolen" and written down into a page (the database is allowed to flush dirty pages of an uncommitted transaction), then on recovery the replay from WAL overwrites and erases the trace. Atomicity and durability are both solved by one mechanism.

### Checkpoint: reclaiming log and bounding recovery time

If you always had to replay the whole log since the beginning of time, recovery would take hours. **Checkpoint** solves that: the database writes every dirty page to the data file, fsyncs, then writes a CHECKPOINT record. From that point older log is no longer needed for recovery and the pg_wal segments before it are reused. Two default parameters: {{checkpoint_timeout}} = 5 minutes, {{max_wal_size}} = 1 GB — whichever is hit first triggers the checkpoint. Its cost is an I/O storm, so PostgreSQL spreads the writes over {{checkpoint_completion_target}} = 0.9.

| Configuration | Consequence |
|---|---|
| Checkpoints too frequent (small max_wal_size) | write amplification, continuous I/O spikes, disk wears faster |
| Checkpoints too rare | slow recovery, pg_wal takes lots of disk, replication lags more |
| {{wal_level = logical}} | log carries extra information for CDC (Debezium), WAL volume rises clearly |

### Why pg_wal fills the disk

Log is only reused once nobody needs it any more. Three common log holders: a **replication slot** not yet consumed (the standby died but the slot stayed), {{archive_command}} failing repeatedly, and a long transaction pushing the point that must be kept (the xmin horizon) backwards — the topic of the previous lesson. This is a very real incident: a 400 GB pg_wal directory while data does not grow, and the culprit is usually a lonely slot, not the workload.

### Java: commit is a record, not data already written

~~~java
long lsn = 0;
Map<String, String> buffers = new HashMap<>();          // shared buffers: RAM, dies with the process
log.append(new Rec(++lsn, "t1", "SET", "a", "1"));      // nothing has reached the data file yet
buffers.put("a", "1");
log.append(new Rec(++lsn, "t1", "COMMIT", null, null));
fsync(log);                                             // THE POINT OF NO RETURN
// only later does the checkpoint flush the 8 KB page holding "a" to the data file
~~~

The exercise below is exactly the "reopen the machine" part: given a list of records, compute what state the database ends up with.

### Durability is bought with what

{{synchronous_commit = on}} (default): wait for fsync, costing about one fsync per commit but losing no transaction that was reported OK when the machine crashes. {{off}}: the OS flushes on its own, dozens of times faster, but if the **machine crashes** (power loss, kernel panic) a few transactions that were reported OK may be lost — still consistent, just losing what the database promised. {{remote_write}} / {{remote_apply}}: wait for a replica, used when not even the death of the whole server is acceptable. A mature answer: choose based on the cost of one lost record, and for money transactions do not turn off {{synchronous_commit}}.

### Common pitfalls

- Thinking commit means the data "is already in the table file"; to verify, kill the process mid-way and reopen — you will see WAL did the work.
- Turning off {{synchronous_commit}} for a fast job and not telling anyone, only remembering when data is lost.
- Not enabling {{archive_command}} / WAL-based backup: you can only recover to the oldest backup, losing a whole day of data.
- Forgetting that a replication slot holds WAL: a CDC connector stops over the weekend, Monday the disk is full.
- Benchmarking on a dev machine with an enterprise SSD that protects itself on power loss → beautiful fsync numbers; cloud disks or spinning disks are many times slower, and production numbers must be re-measured from scratch.

### Interview notes

Tell it as cause and effect, not memorised abbreviations: (1) writing pages immediately costs too much random I/O and fsync, (2) WAL records changes sequentially and the two write-ahead rules, (3) commit is a COMMIT record plus fsync while the page stays in RAM, (4) on crash replay redo from the nearest checkpoint, uncommitted transactions die with RAM so no undo is needed, (5) full page write guards against torn pages, (6) checkpoint balances recovery time against write amplification, (7) {{synchronous_commit}} and {{max_wal_size}}/pg_wal are two tuning questions often asked. End by verifying: committed records per second and fsync latency, WAL generated per hour, the oldest slot's age in {{pg_replication_slots}}.

> Senior tip: with a Java application, "committed" does not mean "message sent". To make the business operation and the database durable together, write an outbox table **in the same transaction** then let a relay read and send after commit, with an idempotency key — because after fsync there is still a small window before the client receives OK, and Kafka does not guarantee exactly-once delivery.`,
    exercises: [{
      title: 'WalLog: write log, commit, checkpoint and replay after crash',
      prompt: `Simulate the part of a database that decides durability: a log of records with increasing LSN, and a redo replayer that computes the state the database will have after reopening. Implement {{WalLog}} with nested static class {{WalLog.Rec}} ({{lsn}}, {{txn}}, {{op}}, {{key}}, {{value}}).

- {{set(txn, key, value)}}, {{del(txn, key)}}, {{commit(txn)}}, {{abort(txn)}}: each command adds **exactly one** record with {{op}} being {{"SET"}}, {{"DEL"}}, {{"COMMIT"}}, {{"ABORT"}} respectively; LSN is an increasing integer starting at 1 in insertion order; SET records keep key and value, DEL keeps key (value null), COMMIT/ABORT keep txn with null key/value.
- {{checkpoint()}}: adds a {{"CHECKPOINT"}} record and returns its LSN. Think of a checkpoint as only taken when no transaction is open (quiesced).
- {{records()}}: all records in insertion order.
- {{recover(log, fromLsn, base)}} (static): replay redo and return the new state.
  - Start from a copy of {{base}} (state already on the data file at the checkpoint; {{base}} **must not be mutated**).
  - Skip every record with {{lsn <= fromLsn}} — they were already durable before the checkpoint, replaying them is pointless and could corrupt the checkpoint state.
  - SET/DEL records of a transaction are **held pending** by txn, in log order; only when that txn's COMMIT is met are they applied to state (SET writes, DEL removes).
  - ABORT discards all pending work of the txn; reaching the end of the log without a COMMIT also discards — that is the transaction that "died with RAM".
  - Return a {{Map}} ({{LinkedHashMap}} is enough).

No threads, no sleep, no real I/O. Same input always gives same output.`,
      hints: ['Each business command only adds a Record with lsn = log.size() + 1; checkpoint returns the lsn just issued.', 'recover: use a Map<String, List<Rec>> to hold not-yet-committed operations by txn, applying them to state only when COMMIT is met.', 'The skip condition is r.lsn <= fromLsn and it must be checked BEFORE anything else.', 'Copy base with new LinkedHashMap<>(base) so the caller\'s object is not mutated.'],
      explain: `Three properties of redo recovery come through clearly in the exercise: **only COMMIT makes a change durable** (the literal definition of durability), **order within the log determines the result** (two SETs of the same key: the one applied last is the last one before COMMIT), and **checkpoint lets you skip the front** because it is already reflected in {{base}}. What the simplified model leaves out: PostgreSQL stores physical changes on pages, not "the new logical value", and an uncommitted transaction's dirty pages may still be flushed to disk; that is fine because redo from WAL overwrites its trace and full page write handles the half-written case. In production, three places hit the same idea: {{pg_wal}} filling up because a slot is not consumed, database open time proportional to the WAL that must be replayed after a checkpoint, and {{synchronous_commit = off}} only saving fsyncs without changing log order.`,
    }],
    check: [
      {q: 'What is the core rule of the write-ahead log?', options: ['All data pages must be written to disk before replying to the client', 'Every record describing a change must be durable in the log before the transaction is reported as committed', 'Every replica must acknowledge before commit', 'Shared buffers must be flushed after every statement'], answer: 1, explain: 'Sequential log write followed by fsync is the key: data pages can be written later because they can be rebuilt from the log.'},
      {q: 'Why does commit cost roughly one fsync even when the transaction changed hundreds of rows?', options: ['Because the database compresses the pages into one file', 'Because the pages sit next to each other on disk', 'Because the log stores only pointers to pages, not content', 'Because the changes are written consecutively into an append-only log and fsynced once, while data pages are written later'], answer: 3, explain: 'Sequential append is cheap; the database also batches several waiting transactions into one fsync (group commit).'},
      {q: 'A crash happens after the COMMIT record is fsynced but before the data page is written. On reopen:', options: ['The transaction is lost because the data never reached the table file', 'Recovery replays WAL from the nearest checkpoint and applies the change to the page', 'A restore from an old backup is mandatory', 'The data page is permanently corrupt'], answer: 1, explain: 'This is exactly the case WAL exists to solve: once the log is durable the data can be rebuilt.'},
      {q: 'What does a checkpoint do?', options: ['Ensures all changes are in WAL and lets log before it be reused, while bounding recovery time', 'Deletes all uncommitted transactions', 'Compresses pg_wal into a single file', 'Disables full page writes'], answer: 0, explain: 'After a checkpoint the dirty pages are already on the data file, so the older log no longer needs to be replayed and pg_wal can wrap around.'},
    ],
  },
  'lesson-db-010': {
    title: 'A mini B+ tree: leaf nodes, splitting nodes, and range scan along the leaf chain',
    goals: [
      'Explain why databases use a B+ tree instead of a binary tree for on-disk indexes',
      'Simulate insert, node split, and keeping keys ordered in a small-order tree',
      'Perform a range scan by going down to the leftmost leaf then following links between leaves',
      'Relate fan-out, tree height, and the number of page reads in PostgreSQL B-tree',
    ],
    body: `**Summary:** A B+ tree is a balanced tree (every leaf at the same depth) that databases use for key lookups and range queries. Unlike a binary tree, each node holds many keys (fan-out: the maximum number of children of an internal node) to keep the tree short; unlike a plain B-tree, all real records live in the leaves and the leaves are chained together, so a range scan (scanning by key range) only walks along the leaves.

### Why not a binary tree

An on-disk index (disk: persistent storage whose access is far slower than RAM) reads data in **pages** (a fixed-size I/O unit, usually 8 KB in PostgreSQL). If each node held only one key as in a balanced binary tree, one million keys would need about 20 levels (~20 page reads). A B+ tree puts dozens to hundreds of keys per page, so one million keys may need only 3–4 levels. Lower height means fewer I/O (input/output, disk reads/writes). The larger the fan-out, the shorter the tree; PostgreSQL B-tree uses 8 KB pages with a real fan-out often in the hundreds.

### The B+ tree structure (mini version)

We simulate a B+ tree of order {{m}} (a small order such as 4 so splits are easy to observe). Conventions:

- Each node holds at most {{m - 1}} = 3 keys.
- Internal node: separator keys and child pointers. Convention: go to the right child when {{key >= separator[i]}}.
- Leaf node: sorted (key, value) pairs. All leaves share the same depth.
- Leaves are linked by a {{next}} pointer to the right leaf: fast range scan.

~~~text
B+ tree of order 4 (max 3 keys per node), illustration:
                 [ 17 | 35 ]
                /     |     \\
          [5|9|12]  [17|26]  [35|40|48]   (leaves, holding values)
             |        |         |
             +--------+---------+          (next links between leaves)

Find 26: 26 >= 17 and < 35 -> down to middle leaf -> found 26.
Range [10, 36]: descend to the leaf holding 10, walk next until key > 36.
~~~

### Insert and split

When inserting a new key, always insert into the **leaf** at the right position:

1. Descend from the root following separator keys to find the target leaf.
2. Insert (key, value) into the leaf, keeping order. Key already present -> update (upsert: insert or update).
3. Leaf exceeds {{m - 1}} keys (overflow) -> **split**: divide in two. The first key of the new leaf is **copied up** to the parent (the leaf keeps its own copy because the data lives in leaves).
4. Internal node overflows -> split the internal node: the middle key is **promoted up**, not copied.
5. Split reaching the root -> create a new root, height grows by 1.

~~~java
// Splitting a leaf of order 4 (max 3 keys). Leaf [5,9,12], insert 7 -> [5,7,9,12] (overflow)
Leaf left  = [5, 7];       // keeps the left half
Leaf right = [9, 12];      // right half
right.next = left.next;    // keep the old chain
left.next = right;         // link left -> right
promoteKey = 9;            // COPY 9 up to the parent (leaf still keeps 9)
~~~

### Range scan

A query {{WHERE id >= 10 AND id <= 36}}: (1) find the leaf holding the lower bound (10); (2) walk entries in order, when the leaf ends follow {{next}}; (3) stop when the key exceeds the upper bound (36). It costs one descent of the tree plus the number of leaves needed, so B-trees support {{ORDER BY}} and range predicates well.

### In real PostgreSQL (different from the simulation)

PostgreSQL uses B-tree (a Lehman & Yao variant) as its default index, 8 KB pages:

- Each page is one node; split needs a latch (a lightweight in-memory lock) for concurrent reads/writes.
- Leaves point to heap tuples (ctid: the physical row address); index-only scan is only possible when the visibility map allows it.
- VACUUM cleans dead entries; {{fillfactor}} defaults to 90 for indexes, leaving room to reduce page splits (write amplification: write amplification).

| Property | Balanced binary tree | B+ tree (DB index) |
|---|---|---|
| Keys per node | 1 | dozens to hundreds (per page) |
| Height for large N | ~log2(N) | ~log_f(N), f = large fan-out |
| Range scan | complex tree traversal | descend to leaf + walk next |
| Optimised for | RAM, cheap pointers | disk/pages, less I/O |

### Common pitfalls

- Confusing copy-up (leaf split) with promote (internal split): the leaf must keep the key because the data lives in leaves.
- Forgetting to reconnect {{next}} when splitting a leaf: range scan breaks the chain.
- Thinking B+ trees rotate like AVL trees: they balance through split/merge and all leaves always share the same depth.

### Interview notes

(1) Large fan-out -> short tree -> fewer page reads. (2) Data in leaves plus chained leaves -> good range scan/ORDER BY. (3) Insert can cause splits and write amplification; random inserts (UUID v4) cause more splits than sequential inserts. Mention {{EXPLAIN (ANALYZE, BUFFERS)}} to see the real index scan.

> Senior tip: the column order in a composite index (multi-column index) matters because B+ trees support prefixes; {{(tenant_id, created_at)}} serves filtering by tenant then ranging over time, reordering it changes everything.`,
    exercises: [
      {
        title: 'B+ tree of order 4: insert, get, range and height',
        prompt: `Implement {{BPlusTree}} with fixed order 4 (each node holds at most 3 keys):
- {{put(key, value)}}: upsert (insert or update), keeping keys increasing. A node exceeding 3 keys splits: a leaf divides in two, the first key of the right half is **copied up** to the parent; an internal node divides in two, the middle key is **promoted up** to the parent. Leaves maintain {{next}}.
- {{get(key)}}: returns the {{Integer}} value or {{null}}.
- {{range(lo, hi)}}: returns a {{List<Integer>}} of values whose keys {{k}} satisfy {{lo <= k <= hi}}, in increasing order. Find the leaf holding {{lo}} then walk {{next}}, stopping when the key exceeds {{hi}}.
- {{height()}}: number of levels; an empty tree returns 0, a tree with only a leaf root returns 1.

Use only the standard JDK; do not use {{TreeMap}}/{{TreeSet}} in place of the tree structure.`,
        hints: ['A leaf split copies the first key of the right half up to the parent (the leaf keeps its own copy); an internal split promotes the middle key up (the parent no longer keeps it).', 'range: find the leaf holding lo with findLeaf(lo), then walk the next chain; stop as soon as a key exceeds hi.', 'height: walk down from the root through the first child of each internal node until reaching a leaf; count levels.'],
        explain: `The exercise surfaces three things worth saying in an interview: **fan-out is what makes the tree short** (a few hundred keys per page versus one in a binary tree), **leaf chaining makes range scan cheap** (one descent plus a linear walk of leaves, instead of re-descending for every key), and **split strategy differs between leaf and internal nodes** (copy-up versus promote). In real PostgreSQL the same idea is extended with latches for concurrency, dead-entry cleanup by VACUUM, and fillfactor to reduce splits under random inserts (UUID keys).`,
      },
    ],
    check: [
      {q: 'Why does a database prefer a B+ tree over a balanced binary tree for an on-disk index?', options: ['Because a binary tree cannot keep keys sorted', 'Because each B+ tree node holds many keys per page, lowering height and reducing I/O', 'Because a B+ tree needs no locks', 'Because a B+ tree stores data in RAM'], answer: 1, explain: 'Fan-out of dozens to hundreds per page versus one key per node in a binary tree means far fewer levels and fewer page reads.'},
      {q: 'Why must a leaf split copy the separator key up instead of moving it?', options: ['Because the leaf must keep the key, since real data lives in leaves', 'Because copying is faster than moving', 'Because internal nodes cannot store keys', 'Because the parent needs the key to sort children'], answer: 0, explain: 'In a B+ tree all records live in leaves, so the leaf keeps its own copy while the separator key is copied up to the parent.'},
      {q: 'How does a B+ tree perform a range scan?', options: ['By re-descending from the root for every key', 'By traversing the whole tree in order', 'By descending to the leaf holding the lower bound then walking the next links between leaves', 'By scanning the data file directly'], answer: 2, explain: 'After one descent to the leaf holding the lower bound, the scan walks the leaf chain and stops once the key exceeds the upper bound.'},
      {q: 'What happens when an internal node overflows during insert?', options: ['The tree is rebuilt from scratch', 'The middle key is promoted up to the parent and the node splits in two', 'The extra key is discarded', 'The height decreases'], answer: 1, explain: 'Internal split promotes the middle key up; if the split reaches the root, a new root is created and height grows by one.'},
    ],
  },
});
