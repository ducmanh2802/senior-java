/*
 * English translation of js/data/q-spring-data.js — task T377. Format: js/core/i18n.js (content overlay).
 * ids: db-039
 */
App.i18n.content({
  'db-039': {
    q: 'You need to export 5 million transaction rows from PostgreSQL every night for the reconciliation department. The current version uses {{LIMIT 1000 OFFSET n}}, which gets progressively slower towards the end, and sometimes it fails halfway, forcing a restart from the beginning. At the database and JDBC layer, how would you redesign it: keyset, streaming cursor, checkpoint/resume, read from replica?',
    a: `**Summary:** OFFSET forces the DB to read and **discard** n rows per page, so the total cost increases quadratically. Replace it with **keyset** ({{WHERE (created_at, id) > (?, ?) ORDER BY created_at, id LIMIT 5000}}): each page is a single index jump, the cost is nearly constant, and the last key of the page acts as a **checkpoint** to resume after a failure. Streaming cursor (fetchSize) performs a single query but keeps the transaction open throughout the entire process; reading from a replica avoids impacting the primary but requires handling recovery conflicts.

### Step 1: Why OFFSET gets slower
The DB cannot "jump" to the n-th row; it must traverse the first n rows in order and then discard them.
~~~text
page 1:     reads 1,000 rows
page 2:     reads 2,000 rows (discards 1,000)
page 5000:  reads 5,000,000 rows (discards 4,999,000)
total ≈ 5,000 pages x average 2.5 million = ~12.5 billion row reads for 5 million useful rows
~~~
Furthermore, if data is inserted/deleted between pages, OFFSET shifts: rows might be duplicated or skipped.

### Step 2: Keyset pagination
~~~sql
-- index (created_at, id); id breaks ties when created_at is the same
SELECT id, created_at, amount FROM txn
WHERE created_at >= :from AND created_at < :to
  AND (created_at, id) > (:lastCreatedAt, :lastId)   -- PostgreSQL row value comparison uses the index
ORDER BY created_at, id
LIMIT 5000;
~~~
Each page: one B-tree search to position {{(lastCreatedAt, lastId)}}, then read the next 5,000 entries. Page 1 and page 1,000 cost the same. For MySQL, write it as a split {{created_at > ? OR (created_at = ? AND id > ?)}} and check EXPLAIN to ensure the index is used.

### Step 3: Checkpoint and resume
~~~java
// per batch: read page -> write file -> save checkpoint; if crash, read checkpoint to resume
Cursor cur = jobRepo.loadCheckpoint(jobId).orElse(Cursor.start(from));
while (true) {
    List<Txn> page = txnDao.nextPage(cur, 5000);        // keyset query above, short transaction
    if (page.isEmpty()) break;
    writer.append(page);                                // write part file / multipart upload
    cur = Cursor.after(page.get(page.size() - 1));
    jobRepo.saveCheckpoint(jobId, cur, writer.partNo()); // save AFTER data is durably stored
}
~~~
Save the checkpoint only after the data has been durably stored (part file flushed/uploaded); otherwise, a crash might lose a batch. Retrying a batch might result in duplicates, so handle this via part numbering (overwrite the same part) or deduplicate by ID on the receiving end.

### Step 4: Streaming cursor, when to use
A single query where the driver fetches data in batches instead of loading everything into RAM:
| Environment | How to enable |
|---|---|
| PostgreSQL JDBC | {{setAutoCommit(false)}} + {{setFetchSize(5000)}}, ResultSet forward-only; without autoCommit=false, the driver still loads everything |
| MySQL Connector/J | {{setFetchSize(Integer.MIN_VALUE)}} (stream per row) or {{useCursorFetch=true}} + fetchSize |
| Hibernate 6 | {{query.setFetchSize(5000).scroll(ScrollMode.FORWARD_ONLY)}} or {{getResultStream()}}; use {{StatelessSession}} or periodic {{clear()}} so the persistence context doesn't keep 5 million entities |
| Spring Data JPA | method returning {{Stream}} must run in {{@Transactional(readOnly = true)}} and close the stream (try-with-resources) |

Trade-offs: the entire process is **one long transaction**: it holds a snapshot, preventing VACUUM from cleaning dead tuples of heavily updated tables, keeps the connection open for dozens of minutes, and if it fails halfway, you have to restart from the beginning (unless combined with the last processed key). Advantage: a single consistent snapshot.

| | Keyset batching | Streaming cursor |
|---|---|---|
| Transaction | many short transactions | one long transaction |
| Resume | naturally via checkpoint | difficult |
| Consistency | one snapshot per batch | one snapshot for entire export |
| VACUUM impact | low | high if it runs long |

For daily reconciliation, the data within {{[from, to)}} is "closed," making keyset batching both consistent and resumable; it is my default choice.

### Step 5: Read from replica
Redirect export to hot standby to avoid primary I/O contention. Trap: a long query on the standby can be cancelled with {{canceling statement due to conflict with recovery}} when the primary VACUUM cleans rows the query still needs. Options: short batches (keyset wins again), increase {{max_standby_streaming_delay}} (replica lags more), or {{hot_standby_feedback = on}} (query-safe but causes bloat on primary).

> Senior tip: I aim for "each batch < 1 second, checkpoint each batch" and measure each batch's duration. If batch duration increases over time, it's almost certain that OFFSET is still being used, or the index for the keyset key is missing somewhere.`,
    follow: [
      'If an export requires an absolutely consistent snapshot across multiple tables, how would you use REPEATABLE READ or pg_export_snapshot?',
      'How can 5 million rows be partitioned for 4 parallel workers using keyset?',
      'When should you use COPY TO STDOUT instead of reading through JDBC ResultSet?'
    ]
  }
});
