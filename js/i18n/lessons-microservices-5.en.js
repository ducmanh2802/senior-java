/*
 * English translation of js/data/lessons-microservices.js — task T453. Format: js/core/i18n.js (content overlay).
 * ids: lesson-microservices-005 lesson-microservices-006
 */
App.i18n.content({
  'lesson-microservices-005': {
    title: 'Trace context across a thread pool: keeping traceId and spanId correct at each boundary',
    goals: [
      'Tell traceId and spanId apart',
      'Propagate context explicitly through services and executors',
      'Recognise the ThreadLocal traps that come with thread pools',
    ],
    body: `**Summary:** Trace context links the spans that belong to the same request so you can follow its path across many services. ThreadLocal only binds data to the current thread; once work moves to a thread pool the context does not follow by itself, and it can leak into the next task if it is not cleared.

### Traces and spans
A trace shares one traceId; each operation gets its own spanId and usually carries a parentSpanId. HTTP services pass the context in the standard W3C Trace Context header (traceparent), create a child span and then end it. Do not mint a new traceId at every service if you want the pieces to join the same trace.

### ThreadLocal is not propagation
MDC is usually backed by ThreadLocal so that the log pattern can print the traceId. A thread pool reuses its workers: request A sets a context and then submits a task, but a worker does not inherit ThreadLocals by default. If the worker still carries an old context, task B can log under A's traceId. The safe fix is to capture the context when submitting, set it on the worker, and then restore or clear it in a finally block.

~~~java
Context captured = local.get(); // capture on the submitting thread
executor.submit(() -> {
    Context previous = local.get();
    try { local.set(captured); work.run(); }
    finally { local.set(previous); } // or remove when there was no previous context
});
~~~

Even better, pass the context explicitly in the API where that fits. OpenTelemetry Java ships Context plus instrumentation and propagators; use a wrapper (for example {{Context.current().wrap(runnable)}} or {{Context.taskWrapping(executor)}}) or a configured Java agent so the context crosses the executor. Do not assume every async library is instrumented out of the box.

### Production and security
W3C traceparent carries a version, the trace-id (16 bytes), the parent-id (8 bytes) and trace-flags (for example the sampled bit); baggage is optional metadata that travels in its own header. Never put PII, tokens or untrusted data into baggage. Sampling can drop some traces, so logs and metrics still need their own correlation and a trace must never be treated as an audit log. Keep cardinality bounded on span names and metric labels: an orderId can be a span attribute, but it must not become a span name or a metric label. The OpenTelemetry SDK and exporters use batch processors; configure the queue, the timeout and a flush on shutdown so you do not lose data when the process stops.

### Pitfalls
Setting MDC without removing or restoring it in a finally block. Creating a new span without attaching the parent context, which snaps one trace into several disconnected traces. Logging the whole baggage. When crossing a message broker, inject the context into the message headers and extract it in the consumer; a redelivered message may continue the old trace or start a new processing span depending on the instrumentation policy.

### Interview notes
Explain traceparent over HTTP, context across an executor, and how you would prove that no context leaks between two tasks that share a worker. Mention instrumentation choices instead of hand-rolling ThreadLocals across the application.

> Senior tip: check the rejected/cancelled task paths and the exception paths; context cleanup must live in a finally block, even when the business code throws.
`,
    exercises: [{
      title: 'Pass context explicitly and clean up ThreadLocal in the worker',
      prompt: `Implement {{ContextRunner}} on top of a single-thread {{ExecutorService}} (the worker is always reused). {{submit(traceId, fail)}} passes the traceId into the task; inside the task, set the ThreadLocal {{local}} to the traceId (an empty one means no context), record the observable value of {{local.get()}} into {{seen}}, and then throw an exception if {{fail}} is true. After every task always clear the context, even on failure, so that a task with an empty traceId observes {{null}} instead of inheriting the previous trace. {{observed()}} returns a copy of the results in completion order. {{await()}} is already implemented: it shuts the pool down and waits for the tasks.`,
      hints: [
        'Capture the traceId at submit time and pass it into the lambda; the caller ThreadLocal does not travel on its own.',
        'Set or remove the context at the very start of the task, then record the observed value.',
        'Wrap the task body in try/finally and remove; awaitTermination with a timeout keeps the test deterministic.',
      ],
      explain: `A single-thread executor deliberately reuses the same worker so that a ThreadLocal leak shows up. The task receives the traceId as explicit data, sets or removes it on the worker, and then records the context it can see. The finally block always removes, even when the task throws. awaitTermination guarantees that observation happens after the tasks finish, with no guessed sleeps.

In production, the OpenTelemetry Context is usually the propagation abstraction; instrumentation can wrap the executor for you. MDC has to stay in sync with the context and be cleared after the task. If you restore a previous context instead of removing it, keep the previous value and put it back exactly, especially with nested execution.

Common mistakes: reading the ThreadLocal on the caller thread and expecting the worker to see the value; clearing only on the success path; or using the traceId as the spanId for every operation. The traceId identifies the whole trace, the spanId identifies one specific operation.`,
    }],
    check: [
      { q: 'A thread pool reuses its workers; task A sets the MDC but does not clear it. What is the main risk?', options: ['Task B can log under context A', 'The traceId silently turns into a spanId', 'The executor will create a new thread for B', 'The Kafka offset will roll back'], answer: 0, explain: `A ThreadLocal belongs to the worker, and the worker is reused. Without cleanup the context can leak from one task to the next.` },
      { q: 'In W3C Trace Context, what roles do trace-id and parent-id play?', options: ['Both are database IDs', 'trace-id ties the whole trace together; parent-id identifies the parent span being passed along', 'parent-id is PII baggage', 'trace-id is only used as a metric label'], answer: 1, explain: `The trace-id keeps spans in the same trace; the parent-id points at the current span on the sending side so the receiver can create the child relationship. Baggage is separate metadata and must not hold secrets.` },
    ],
  },
  'lesson-microservices-006': {
    title: 'Idempotency key store: in-flight dedup, TTL phantoms and payload hashes',
    goals: [
      'Design the BEGIN/REPLAY/DUPLICATE/PHANTOM state machine for an idempotency key',
      'Transition states atomically with ConcurrentHashMap without a global lock',
      'Explain why keys must be scoped per tenant, why the body is hashed, and why PENDING needs a TTL',
    ],
    body: `**Summary:** An idempotency store ties a client-generated key to a processing state so that a retry does not create a second effect. The key is scoped by tenant + endpoint + body hash; the PENDING → COMPLETED/FAILED transition must be atomic. A request that sees PENDING is blocked, one that sees COMPLETED gets the exact same result back, and a PENDING entry older than the TTL is promoted for a new run.

### Why retries always happen
A POST that creates an order can commit to the database successfully while the response is lost on the way back. The client times out and sends it again; if the server cannot tell the two sends apart, it creates two orders or charges the card twice. You cannot fix this by promising that the network never drops a packet; you have to make the repeated operation safe.

The idempotency key is usually generated once by the client per logical operation (a UUID). The server stores the key together with the tenant, the endpoint and a hash of the body. Scoping by tenant is mandatory: with a global key space, tenant A sending a key that collides with tenant B could receive B's data. The body hash blocks the case where a client reuses a key for a different payload; return 409 instead of replaying the old result.

### State machine
| Stored state | New request with the same key + hash | What to do |
|---|---|---|
| none | BEGIN | run the business logic, then complete or fail |
| PENDING, still inside its TTL | DUPLICATE_INFLIGHT | return 409/202, do not run the business logic |
| PENDING, past its TTL | PHANTOM_PROMOTE | assume the previous owner died and take over the run |
| COMPLETED | REPLAY | return the exact stored result |
| FAILED | BEGIN | allow a retry |
| different hash | CONFLICT | 409, never reuse the result |

### Atomic state transitions
Use {{ConcurrentHashMap.compute}} so that only one thread can modify a given key at a time. compute locks per bin/key rather than globally, so other keys keep running in parallel. Inside the lambda: read the entry, compare the hash, compare the state, then return either the old entry or a new one. Do not add a distributed lock here, because the key table itself is the serialization point.

~~~java
Begin b = store.begin(key, tenant, endpoint, hash);
switch (b.decision()) {
    case BEGIN, PHANTOM_PROMOTE -> {
        String result = business();                 // only one request wins
        store.complete(key, tenant, endpoint, hash, result);
    }
    case REPLAY -> respond(b.result());              // do not run the business logic again
    case DUPLICATE_INFLIGHT -> respond(409);
    case CONFLICT -> respond(409);
}
~~~

The write order matters: assign the result first, then set the COMPLETED state. Done the other way round, another request can see COMPLETED and read a null result. Inside one JVM, compute gives you a happens-before relationship between successive computes on the same key; in a real store use a conditional UPDATE or a transaction.

### TTL and phantoms
A process that dies after setting PENDING but before completing leaves the key stuck. The TTL turns an old PENDING into a phantom: a request arriving after the TTL is promoted and runs again. The TTL must be larger than the p99 duration of the business logic, otherwise two requests may run at once. For long jobs, use a lease with a heartbeat or renewal instead of a fixed TTL. The clock is injected so the code stays testable; in production use the database or Redis clock, not each machine's own clock, because clocks drift.

### Production pitfalls
- Keeping keys in RAM only: two instances cannot see each other and deduplication fails. Use Redis or a database with a unique index on {{(tenant, endpoint, key)}} and a TTL.
- Forgetting the body hash: the client changes the payload but the old key returns the result of the previous payload.
- Holding a lock across the network call: it throttles throughput and hangs easily when the downstream is slow. Hold state, not a distributed mutex, while the call is in flight.
- Returning REPLAY when the previous attempt FAILED but the side effect partially happened: the business logic must be transactional or verify first; only mark FAILED once the rollback is certain.
- Storing a huge result or one that contains PII: cap the size, encrypt it, and set a retention window (24 hours, say).

### Interview notes
Draw the state machine and answer: with two concurrent requests on the same key, what does the second one do; why the payload hash is needed; how the TTL handles crashes; and why an in-memory map is not enough when you run several pods.

> Senior tip: track the REPLAY and DUPLICATE_INFLIGHT rates and the number of PENDING keys past their TTL. A sudden rise in PENDING usually means the business logic got slow or an instance died mid-flight; alert on key age, not just on key count.
`,
    exercises: [{
      title: 'An idempotency store with in-flight dedup and phantom promotion',
      prompt: `Implement an in-memory {{IdempotencyStore}} with the following API (the shared types are already in the starter):

- {{IdempotencyStore(long ttlMillis, LongSupplier clock)}}.
- {{Begin begin(String key, String tenant, String endpoint, String payloadHash)}} returns {{Begin(Decision decision, String result)}}, where {{Decision}} is one of {{BEGIN}}, {{DUPLICATE_INFLIGHT}}, {{PHANTOM_PROMOTE}}, {{REPLAY}}, {{CONFLICT}}.
- {{void complete(String key, String tenant, String endpoint, String payloadHash, String result)}}.
- {{void fail(String key, String tenant, String endpoint, String payloadHash)}}.
- {{String result(String key, String tenant, String endpoint)}} and {{int size()}}.

Rules: an unknown key is BEGIN. The same key with a different payloadHash is CONFLICT and leaves the state untouched. COMPLETED is REPLAY with the stored result. FAILED is BEGIN for a new attempt. PENDING still inside its TTL is DUPLICATE_INFLIGHT; PENDING whose age is at least the TTL is PHANTOM_PROMOTE and the caller becomes the new owner. Scope the key by both tenant and endpoint. Only complete or fail when the entry is PENDING and the payloadHash matches.`,
      hints: [
        'Use {{ConcurrentHashMap.compute}} for all three operations; each lambda run is one atomic state transition per key.',
        'The check order: null entry, payload hash, then the COMPLETED/FAILED/PENDING state. For a PENDING entry past its TTL, return a new entry instead of the old one.',
        'Assign the result before flipping the status to COMPLETED so a REPLAY request can never read a null result.',
      ],
      explain: `The exercise reproduces the hardest part of idempotency: two requests arriving at the same moment and one process dying halfway. compute is the per-key serialization point, so exactly one thread sees a null entry and gets BEGIN; the rest see PENDING and get DUPLICATE_INFLIGHT. No global lock and no distributed lock is needed, because the key table itself is the referee.

The terminal state is written after the result. With COMPLETED, the result is in place before the status changes, so REPLAY always reads complete data. With FAILED, the next begin creates a fresh PENDING entry, which allows a retry without reusing the old result. If a complete or fail call comes from a request that has been promoted away (wrong payloadHash, or the entry is no longer PENDING), it is ignored: the old owner must not overwrite the new one.

The TTL solves the phantom: a process that holds PENDING and then dies leaves no signal behind. After the TTL, another request is promoted. The usual mistake is a TTL far shorter than the p99 of the business logic, or no lease renewal for long jobs, which ends with two owners running at once. In production the state must live in a shared store (Redis or a database) with a unique index on tenant, endpoint and key plus a TTL; an in-RAM map is only correct for a single JVM and evaporates on restart.`,
    }],
    check: [
      { q: 'Two requests with the same tenant, endpoint, key and payload arrive at the same time; the first is still PENDING. What should the second one receive?', options: ['BEGIN and run the business logic in parallel', 'DUPLICATE_INFLIGHT and do not run the business logic', 'REPLAY with a null result', 'CONFLICT because the key already exists'], answer: 1, explain: `PENDING means someone holds the key; the follow-up request must be blocked to avoid two effects. BEGIN is only for a new key or after FAILED/phantom; REPLAY only when COMPLETED with a result in place; CONFLICT only when the payloadHash differs.` },
      { q: 'Why store and compare a hash of the body alongside the idempotency key?', options: ['To compress the payload before storing it', 'To detect a client reusing the key with a different payload and return 409 instead of replaying the wrong result', 'To speed up primary key computation', 'To replace the TTL'], answer: 1, explain: `The client generates the key, so it can be reused wrongly. Same key but a different body, still answered with REPLAY, would return the result of the old operation, which is a serious data error. The hash does not compress the payload, has nothing to do with primary key speed, and does not replace the TTL for PENDING.` },
      { q: 'A PENDING entry is past its TTL. What is the correct behaviour?', options: ['Delete the entry and return a 500', 'Promote the entry so the current request becomes the new owner and runs the business logic', 'Replay a null result', 'Wait forever until the old owner completes'], answer: 1, explain: `A PENDING entry past its TTL usually means the process died; promoting lets the system recover on its own. Deleting and returning 500 does not complete the operation; replaying null is wrong because no result exists yet; waiting forever leaves the key stuck permanently, exactly the failure the TTL exists to avoid.` },
    ],
  },
});
