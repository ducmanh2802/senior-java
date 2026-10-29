/*
 * English translation of js/data/lessons-microservices.js — task T454. Format: js/core/i18n.js (content overlay).
 * ids: lesson-microservices-007
 */
App.i18n.content({
  'lesson-microservices-007': {
    title: 'Partial success on delete: 207 Multi-Status and a compensation ledger',
    goals: [
      'Design a delete saga across the DB, an object store and downstream systems',
      'Return 207 with per-id detail instead of a fake success',
      'Use progress tracking and a compensation ledger so retries and reconciliation never delete twice',
    ],
    body: `**Summary:** Deleting a batch of data that lives in the DB, an object store and downstream systems cannot be a single transaction. The orchestrator runs each id in the order DB → blob → notify, returning 200 when everything succeeds and 207 with per-id detail when something fails. Every step that has already succeeded is written to a compensation ledger; retries rely on per-id progress so nothing is deleted or notified twice.

### Why all-or-nothing is impossible
The three systems have their own transactions and no shared commit protocol. Delete the DB row and then fail to delete the blob and the row is gone while the file remains; roll back the DB and you may not be able to restore a blob that was already deleted. 2PC does not fit because object stores and downstream systems usually do not support it, hold locks for a long time, and network failures leave it hanging. The practical approach is a saga: accept the intermediate state, record what has been done, and have a way to finish or compensate.

### Order and status codes
- DB first: if the row does not exist, treat it as already deleted (idempotent) and skip the remaining steps.
- Blob after the DB: this avoids leaving an orphan blob when the row deletion fails.
- Notify last: tell downstream only once the data is really gone.

Return 200 when every id is 200. A single failing id is enough to return 207 Multi-Status, where each id in {{detail}} carries its own code and msg. The client must read line by line and must not treat 207 as success.

### Progress and compensation
Each id has a set of steps that are already done. A retry skips the finished steps, so the DB delete is not called a second time. When a step fails, the steps that succeeded before it are written to the ledger:

~~~text
id=ord-7: db=OK, blob=FAIL
ledger: compensation.delete.row(ord-7)
~~~

That token is not an instant rollback; it marks work that needs to be reconciled. reconcile reads the ledger, retries the missing step (blob, then notify) and removes the entry when it is done. The client gets 207 straight away, while the system still has a path to completion that does not delete the row again.

### Production
The ledger and progress must be durable (a saga/outbox table), not held in RAM as in the exercise. Every step needs idempotency on the partner side: deleting a missing row returns success, deleting a missing blob returns success, notify uses an idempotency key. The orchestrator can resume after a crash thanks to the stored state. Do not call downstream systems inside a long DB transaction; persist the state first, call outside the transaction, then update.

### Pitfalls
- Returning 200 even though some ids failed: the user believes everything was deleted.
- No ledger: orphan blobs, and nobody knows they need cleaning up.
- Retries without progress: deletes and notifies repeat, which is especially dangerous for notify sending email.
- A ledger that lives only in RAM: a restart loses it and the data is stuck half-way.
- Hard deletion right away: hard to recover when a later step fails; many systems use soft delete plus a cleanup job once they are certain.

### Interview notes
State clearly why you chose 207 over 500, the order of the three steps, what the ledger records, what retries rely on, and which cases reconcile handles. Then describe how to make each tier idempotent so retries are safe.

> Senior tip: set metrics on ids stuck for more than N minutes and on ledger entry age; alert when the ledger grows while reconcile does not shrink it. For large batches, work in small chunks and return 202 with a job id instead of holding the request too long.
`,
    exercises: [{
      title: 'Delete orchestrator: 207, per-id progress and reconcile',
      prompt: `Implement {{DeleteOrchestrator}} with the three tiers (already declared in the starter): {{DbTier.deleteRows(id)}} returns {{true}} if it deleted the row, {{false}} if the row does not exist, and may throw an exception; {{ObjectTier.deleteBlob(id)}} and {{DownstreamTier.notify(id)}} may throw an exception.

{{deleteBatch(List<String> ids)}} processes each id in the order DB → blob → notify and returns {{Response(int status, List<Detail> detail)}}. Status is 200 when every id succeeds, 207 when a single id fails; an empty list returns 200 with an empty detail. A missing row counts as already deleted: return a detail with code 200 and skip blob and notify. A failing detail uses code 500 and a message containing the exception type.

Each id keeps the progress of the steps it has finished. When a step fails, write the ledger for each step that already succeeded, in exactly the form {{compensation.delete.row(id)}} and {{compensation.delete.blob(id)}}; an id that was fully deleted returns 200 right away on the next call, without touching the tiers again. {{reconcile()}} continues the missing steps of the ids in the ledger, removes them from the ledger when done and returns the number of ids still stuck.`,
      hints: [
        'Each id has an {{EnumSet}} of finished steps; at the start of each attempt only run the steps that are not in that set.',
        'When you catch an exception, write the ledger for the steps that succeeded, not for the step that just failed. When the DB returns false, treat it as already deleted and skip blob/notify.',
        'reconcile only continues from the missing step based on the State, then clears the id ledger once notify has gone through.',
      ],
      explain: `The exercise shows that a delete saga does not need an instant rollback. Each id goes through three steps; progress is kept, so a retry resumes where it left off. If blob fails after the DB row is gone, the ledger records {{compensation.delete.row(id)}} so the reconciler knows this id is still in flight and will keep trying blob/notify. When downstream fails after both the DB and the blob are done, the ledger holds both row and blob.

reconcile does not call the DB again because the State already marks DB as done; it only runs blob and then notify. That is why the later retry does not delete the row twice, and a finished id is added to completed so subsequent calls return 200 immediately. A row that does not exist returns 200 rather than 404: for a delete, the desired state has been reached, while an orphan blob should be handled by a separate cleanup job instead of failing the whole batch.

In production, the State and the ledger must be stored durably and updated atomically with each other; otherwise a crash after deleting the DB row but before writing the ledger leaves data that nobody will reconcile. Every tier needs to be idempotent (a missing delete returns success, notify carries an idempotency key), and the client must present 207 per id instead of a blanket success.`,
    }],
    check: [
      { q: 'A batch has 10 ids: 9 were deleted and 1 failed at the object store. What should the API return?', options: ['200 because most of them succeeded', '207 with per-id detail so the client knows which id failed', '500 and roll the whole batch back', '202 and skip the failing id'], answer: 1, explain: `207 Multi-Status is right for a partial result: 9 ids succeeded and 1 failed is still reported separately. 200 hides the failure; 500 loses the information about which ids are done and cannot roll back the object store; 202 only makes sense if background processing is acceptable, and even then you must expose per-id status.` },
      { q: 'Why does the orchestrator keep per-id progress of the steps that are finished?', options: ['To make the response larger', 'So a retry resumes from the missing step and does not delete in the DB or notify twice', 'To replace the DB transaction', 'To automatically roll back the blob'], answer: 1, explain: `Progress makes retries idempotent at the orchestration level: finished steps are skipped. It does not make the response bigger (it is internal only), does not replace the DB transaction, and does not roll back a blob that was already deleted.` },
      { q: 'After the DB delete succeeded but the blob failed, what should the compensation ledger record?', options: ['Nothing, because the operation is not complete', 'compensation.delete.row(id) for the DB step that succeeded', 'compensation.delete.blob(id) for the step that just failed', 'A copy of the blob data so it can be restored'], answer: 1, explain: `The ledger records the steps that succeeded so the reconciler knows the id is still in flight; in this example that is the row. The step that just failed has not succeeded, so blob is not recorded; recording nothing would lose track of the id that needs handling; backing up the blob is a job for backups, not for the compensation ledger.` },
    ],
  },
});
