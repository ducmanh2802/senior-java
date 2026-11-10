/*
 * English translation of js/data/lessons-microservices.js — task T1116. Format: js/core/i18n.js (content overlay).
 * ids: lesson-microservices-008
 */
App.i18n.content({
  'lesson-microservices-008': {
    title: 'General saga engine: reverse-order compensation, idempotency and state log',
    goals: [
      'Write a saga engine that runs any list of steps (action + compensate), and when step k fails, compensate backward over k-1..0',
      'Explain why compensate can be called twice and how to block it in both the engine and the receiving side',
      'Choose where to store saga state (durable table, event log, workflow engine) so that a crash does not lose progress',
    ],
    body: `**Summary:** A saga is a sequence of steps, each with an action and a compensation. When the action of step k fails, the engine runs compensation for the steps that already succeeded in REVERSE order from k-1 down to 0; each compensation is called at most once for a given saga, even after retry or restart. The saga state must be stored durably so that a process that dies can continue where it left off. The previous lesson walked through a fixed four-step flow; this lesson generalizes it into an engine that can run any list of steps — exactly what you will implement in the exercise — and answers the two hardest questions: why compensate can be called twice and where saga state should live.

### Back to the root: no rollback across services
In a monolith, a method annotated with {{@Transactional}} (a unit of work managed by the database: every operation inside either all succeeds or all rolls back) writes the order, the inventory, and the payment into the SAME database; if the third line fails, the database undoes the first two by itself. When each microservice has its own database, no single rollback command can reach all three places at once. So "cancel" does not mean delete: you must create a NEW ACTION that makes up for the old one — a refund, a stock release, a delivery cancellation. The cancellation invoice still sits in the log, money may come back slowly, and fees may not be refunded. Compensation is a business action, not a delete button. (Everyday example: returning a shipped package is not the same as never buying it — the store issues a return slip, takes the parcel back and refunds the money, each as its own step.)

### Standard four-step flow: place order → reserve stock → charge payment → schedule delivery
~~~seq
title: Order saga: delivery fails, compensate in reverse order
actors: Order | Inventory | Payment | Shipping
Order -> Inventory: reserve(SKU-42)
Inventory --> Order: OK reserved
Order -> Payment: authorize(250000)
Payment --> Order: OK funds held
Order -> Shipping: schedulePickup(o42)
Shipping --> Order: FAIL no truck
Order -> Payment: refund(250000) same key
Order -> Inventory: release(SKU-42)
note Order: saga finishes when both compensations complete
~~~

### Why compensation must run in reverse order
A later step is built on the result of an earlier one: the delivery order exists because inventory was reserved and money was collected. If you compensated in forward order — releasing inventory before cancelling the delivery — the delivery team would receive an instruction to pick up goods while that stock had already been sold to another customer; if you refunded before cancelling the order, the order would still be alive with the money gone. The engine therefore behaves like an undo stack: a failing step stops the queue, and then compensation runs from the step right before it back to the first step. The rule you will implement: when step k fails, compensate only steps 0..k-1 in the order k-1, k-2, ..., 0.

### Which steps get compensated — and why timeout is the hard case
Only a step that definitely succeeded may be compensated; the step that just failed must not be treated as successful, so there is nothing to undo. The hard case is TIMEOUT: the service you called did not reply in time, and you do NOT know whether the charge actually ran. A timeout is not a failure — refunding immediately might refund a charge that never happened (giving the customer free money), while doing nothing might leave the customer charged for nothing. The right move: mark the step as UNKNOWN, look up the result by sagaId or send the SAME idempotency key (a client-chosen key that makes a repeated call return the old result, see lesson-microservices-006) so the other side returns the original result, and only then decide whether to move forward or to compensate.

### Why compensate can be called twice
The orchestrator sends a refund and receives a timeout; not knowing whether the refund ran, it retries; if the payment side does not deduplicate, the customer receives the money twice. The reverse also happens: the engine crashes after the refund succeeds but BEFORE it records "refund done" in the state — on restart it sees that the step is not yet compensated and calls compensate a second time. Defence must exist at two layers: (1) the engine stores compensation state per sagaId + step so it never calls a compensate that already succeeded again; (2) the receiving side keeps the idempotency key so a duplicate command returns the old result instead of refunding more money. The exercise below implements layer (1): calling retryCompensations() twice must never make compensate run twice.

### Where to store saga state
The principle: record the saga transition BEFORE or in the same transaction as publishing the command for the next step (combine this with the outbox from lesson 001), so that a restart knows exactly where it stands. A minimal table shape:
~~~sql
CREATE TABLE saga_state (
  saga_id      varchar PRIMARY KEY,
  saga_type    varchar NOT NULL,           -- 'order_v1'
  status       varchar NOT NULL,           -- RUNNING | COMPENSATING | DONE | FAILED
  step_states  jsonb NOT NULL,             -- {"reserve":"DONE","pay":"DONE","ship":"FAILED"}
  updated_at   timestamptz NOT NULL
);
-- Recovery scanner: sagas stuck (need to continue after a restart)
SELECT * FROM saga_state
 WHERE status IN ('RUNNING','COMPENSATING')
   AND updated_at < now() - interval '5 minutes';
~~~
| Approach | Good when | Trade-off |
|---|---|---|
| Hand-written saga_state table | A few steps, the team is comfortable with SQL | You build retry, timers, a dashboard and a saga viewer yourself |
| Event log / event sourcing | You already follow CQRS, you need an audit trail per transition | More complex when the saga branches |
| Workflow engine (Temporal, AWS Step Functions, Camunda) | Long sagas, many branches, durable timers needed | Extra infrastructure to run, vendor lock-in |

### General engine skeleton
~~~java
// Run steps by sagaId so each command can carry its idempotency key
record Step(String name, SagaAction action, SagaAction compensate) {}
interface SagaAction { void run(String sagaId) throws Exception; }

void advance(Saga saga) {
    while (saga.step() < saga.steps().size()) {
        Step s = saga.steps().get(saga.step());
        try {
            s.action().run(saga.id());
            saga.markDone(s.name());        // write saga_state before or with publishing the next command
            saga.step(saga.step() + 1);
        } catch (TimeoutException e) {
            saga.markUnknown(s.name());     // UNKNOWN: look up the result, do not guess failure
            return;
        } catch (Exception e) {
            saga.markFailed(s.name());
            compensateFrom(saga, saga.step() - 1);   // compensate backward to the first step
            return;
        }
    }
    saga.markCompleted();
}
~~~

### Production mistakes
- Compensating in forward order: a later business command still references a resource that was already released.
- Compensating a step that never succeeded: refunding a charge that never happened.
- A compensation of its own fails and you only log ERROR: the saga gets stuck silently; you need a COMPENSATION_PENDING state + a retry queue + an alert on saga age.
- State lives only in RAM: a restart loses orders in flight; two pods can both try to "take over" the same saga without a lease.
- Treating a timeout as a definite failure: the root cause of double refunds and stock released for nothing.

### Interview notes
Draw the state machine: RUNNING → each step DONE/FAILED/UNKNOWN → COMPENSATING (reverse order) → COMPLETED/ROLLED_BACK/COMPENSATION_PENDING. Answer three things crisply: why reverse order (a later step builds on an earlier one), how compensate can be called twice (timeout + crash-before-writing-state) and where to block it (the engine by sagaId + the key on the receiving side), where state lives (a saga table or a workflow engine, written before/with publishing the command). Add that compensation does not undo everything: money comes back slowly, fees may not be refunded, and a stock reservation may have expired.

> Senior tip: the most expensive saga bug is "silent half-compensation" — a compensation fails, nobody notices, and the customer is left with money held between two states. Track stuck sagas by age and by step, alert when the number of COMPENSATION_PENDING sagas grows while the reconciler does not shrink it; every saga needs an owner and a runbook for manual intervention.
`,
    exercises: [{
      title: 'SagaRunner: run N steps, compensate backward from the failure, never run compensate twice',
      prompt: `Implement {{SagaRunner}} in memory, taking a list of steps ({{Step}} with {{name()}}, {{doWork()}}, {{compensate()}} as declared in the starter).

- {{SagaStatus run()}}: run {{doWork}} of each step in order, writing the log entries {{START <name>}}, {{DONE <name>}}, {{FAIL <name>}}. If every step succeeds, return {{COMMITTED}}. If a step throws an exception, write {{FAIL}}, do NOT run the following steps, then compensate exactly the steps that already succeeded in REVERSE order (from the step right before the failing one back to the first): write {{COMPENSATE <name>}} before calling it, {{COMPENSATED <name>}} when the undo succeeds, {{COMPENSATE_FAILED <name>}} when the undo itself throws — and still keep compensating the remaining steps instead of stopping.
- Final state of run(): if every compensation succeeded (or no step needed compensation) return {{ROLLED_BACK}}; if any compensation failed return {{COMPENSATION_PENDING}}.
- {{SagaStatus retryCompensations()}}: run ONLY the steps that are still {{COMPENSATION_PENDING}}, in reverse order; if nothing is pending return {{ROLLED_BACK}}. If the current status is not {{COMPENSATION_PENDING}}, return the current status immediately and do NOT call any {{compensate}} — guaranteeing that a compensation which already succeeded is never run again even if retry is called repeatedly.
- {{SagaStatus status()}} returns the current status; {{List<String> stateLog()}} returns a copy of the state log.
- There is no ordering constraint between the START and DONE entries of the business log; the tests rely only on the per-step status, the number of compensate calls, and the COMPENSATE log entries.
`,
      hints: [
        'Keep two maps: which steps are {{applied}} and which steps are {{compensated}}. When step k fails, walk i = k-1 down to 0 and only compensate the steps that are applied but not compensated.',
        'Wrap each {{compensate}} in try/catch: if an undo throws, record {{COMPENSATE_FAILED}} and move on to the other steps; do not let the exception escape the unwind loop and drop the compensation of earlier steps.',
        'The saga status is a consequence of the steps: at least one applied step not compensated → {{COMPENSATION_PENDING}}, none left → {{ROLLED_BACK}}. retryCompensations only runs while pending, so a compensate that already succeeded is never called again.',
      ],
      explain: `The SagaRunner engine is split into two parts: the apply loop records each successful step, and the unwind loop walks BACKWARD from the step right before the failure to the first step. The {{applied}} condition excludes the step that just failed (it never committed anything) and the steps after it (they never ran); the {{!compensated}} condition is the idempotency guard at the orchestrator layer: a compensation that already succeeded is marked, so no matter how many more times retryCompensations() is called, no service receives the undo command a second time. In production this guard must live in {{saga_state}} (each transition recorded before publishing the next command) so that a restart can recover; an in-RAM map only simulates a single continuously running process.

The second easy-to-miss detail: an exception from {{compensate}} must not escape the unwind loop. A refund that fails (the provider temporarily rejects it, the refund window expired) is no reason to skip releasing inventory — every remaining step still deserves a best-effort undo, and the failing step falls back to a pending state for a reconciler or an operator to handle later. The final status therefore follows from the set of steps instead of being hard-coded: any step still pending → COMPENSATION_PENDING.

The classic mistake this exercise exposes: treating a timeout as a definite failure. Here doWork throwing means a CLEAR FAILURE; a timeout means unknown — a real engine must look up the result by sagaId or send the same idempotency key again before deciding to compensate, otherwise it will refund a charge that never happened.`,
    }],
    check: [
      { q: 'Which statement about sagas below is FALSE?', options: ['Compensation should run in reverse order over the steps that succeeded', 'A step timeout should be treated as an unknown outcome, not a definite failure', 'Because each step already committed its own local transaction, compensation only needs to run once and the receiving side does not need to know about duplicates', 'A saga that keeps order correct needs idempotency keys: a timeout plus a retry can always produce a duplicate command'], answer: 2, explain: `The engine-layer idempotency guard (per sagaId + step) is not enough when the compensate command is sent, times out and is retried. Two refund sends are two calls to the payment side, so the receiver must still deduplicate by idempotency key. The other three statements are standard properties of a saga.` },
      { q: 'The pay step fails and the refund also fails (the provider rejects it) while the inventory release has already run. What must a correct SagaRunner do?', options: ['Stop and mark the saga as failed', 'Keep compensating the remaining steps and leave the saga in a pending state for reconciliation', 'Delete the order from the database', 'Call refund again in an unbounded loop until it succeeds'], answer: 1, explain: `One failing compensation does not cancel the others. The saga falls back to a pending state (needs reconciliation/alert), not a final state, and it must not retry forever without a bound.` },
      { q: 'Why must the saga_state table be written BEFORE (or in the same transaction as) publishing the command for the next step?', options: ['To make responses faster', 'Because if you write AFTER sending, the process can die between the two and a restart will not know whether the command was sent, so it publishes a duplicate', 'Because Kafka requires it', 'To avoid deadlocks'], answer: 1, explain: `The write-state-then-send-command order is what makes recovery possible. Writing after the send leaves a window that loses progress; thanks to idempotency keys, re-sending the same step is safe, while forgetting a step entirely cannot be recovered.` },
    ],
  },
});
