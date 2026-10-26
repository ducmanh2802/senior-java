/*
 * English translation of js/data/lessons-microservices.js — task T277. Format: js/core/i18n.js (content overlay).
 * id: lesson-microservices-005
 */
App.i18n.content({
  'lesson-microservices-005': {
    title: 'Trace context across thread pools: keeping traceId and spanId correct across boundaries',
    goals: [
      'Distinguish traceId from spanId',
      'Propagate context explicitly across services and executors',
      'Recognize the ThreadLocal trap with thread pools'
    ],
    body: `**Summary:** Trace context links spans belonging to the same request so you can follow its path across multiple services. ThreadLocal only attaches data to the current thread; when moving to a thread pool, context does not travel automatically and can leak into the next task if not cleaned up.

### Trace and span
A trace has a common traceId; each operation creates its own spanId and usually a parentSpanId. An HTTP service passes context through the standard W3C Trace Context header (traceparent), creates a child span, then ends the span. Do not generate a new traceId in every service if you want to join the same trace.

### ThreadLocal is not propagation
MDC is usually based on ThreadLocal to put the traceId in log patterns. Thread pools reuse workers: request A sets context then submits a task, but the worker does not inherit ThreadLocal by default. If the worker still has old context, task B may log A's context by mistake. The safe solution is to capture context at submit time, set it on the worker, then restore/clear in finally.

~~~java
Context captured = local.get(); // capture on the thread calling submit
executor.submit(() -> {
    Context previous = local.get();
    try { local.set(captured); work.run(); }
    finally { local.set(previous); } // or remove if there was no previous context
});
~~~

Even better, pass context explicitly in the API when appropriate. OpenTelemetry Java provides Context and instrumentation/propagators; use a wrapper (for example {{Context.current().wrap(runnable)}} or {{Context.taskWrapping(executor)}}) or a configured Java agent so context travels through the executor. Do not assume every async library is instrumented.

### Production and security
W3C traceparent carries version, trace-id (16 bytes), parent-id (8 bytes), and trace-flags (for example the sampled bit); baggage is optional metadata traveling in a separate header. Do not put PII, tokens, or untrusted data in baggage. Sampling may drop some traces, so logs/metrics still need correlation and a trace must not be treated as an audit log. Cardinality must be bounded on span name and metric label: orderId can be a span attribute but must not be used as span name or metric label. The OpenTelemetry SDK/exporter has a batch processor; configure queue, timeout, and shutdown flush to avoid data loss on shutdown.

### Pitfalls
Not just setting MDC but forgetting finally remove/restore. Creating a new span without attaching parent context breaks the trace into many disconnected traces. Do not log all of baggage. When passing through a message broker, inject context into headers and extract it in the consumer; a message retry may continue the old trace or create a new processing span according to the instrumentation policy.

### Interview relevance
Explain traceparent over HTTP, context through the executor, and how to prove context does not leak between two tasks sharing a worker. Mention instrumentation choices rather than writing ThreadLocal everywhere by hand.

> Senior tip: check rejected/cancelled tasks and exception paths; context cleanup must be in finally, even when business code throws.`,
    exercises: [
      {
        title: 'Propagate context explicitly and clean ThreadLocal in the worker',
        prompt: `Implement {{ContextRunner}} using a single-thread {{ExecutorService}} (the worker is always reused). {{submit(traceId, fail)}} passes traceId into the task; inside the task, set the ThreadLocal {{local}} according to traceId (empty means no context), record the value {{local.get()}} observed into {{seen}}, then if {{fail}} throw an exception. After every task always clear the context even on error, so a task with an empty traceId observes {{null}} instead of inheriting the previous trace. {{observed()}} returns a copy of the results in completion order. {{await()}} is already implemented: shutdown then wait for all tasks to finish.`,
        hints: [
          'Capture traceId at submit and pass it into the lambda; the caller ThreadLocal does not propagate automatically.',
          'Set or remove context at the very start of the task, then record the observed value.',
          'Wrap the task body in try/finally and remove; awaitTermination with timeout keeps the test deterministic.'
        ],
        explain: `A single-thread executor deliberately reuses the same worker to expose ThreadLocal leakage. Each task receives traceId as explicit data, sets/removes it on the worker, then records the context it sees. finally always removes, even when the task throws. awaitTermination ensures observation happens after task completion without predicting sleep times.

In production, OpenTelemetry Context is usually the propagation abstraction; instrumentation may wrap the executor. MDC must be synchronized with context and cleaned up after the task. If you restore previous context instead of removing, you must store previous and restore exactly, especially with nested execution.

Common mistakes: reading ThreadLocal on the caller thread and expecting the worker to receive the value; only clearing on the success path; or using traceId as spanId for every operation. traceId identifies the whole trace, spanId identifies a specific operation.`
      }
    ],
    check: [
      {
        q: 'Thread pool reuses workers; task A sets MDC but never clears. Main risk?',
        options: ['Task B may log with A\u2019s context', 'TraceId automatically becomes spanId', 'Executor creates a new thread for B', 'Kafka offset will roll back'],
        answer: 0,
        explain: `ThreadLocal belongs to the worker and the worker is reused. Without cleanup, context can leak between tasks.`
      },
      {
        q: 'In W3C Trace Context, what are the roles of trace-id and parent-id?',
        options: ['Both are database IDs', 'trace-id links the whole trace; parent-id identifies the parent span being passed', 'parent-id is baggage PII', 'trace-id is only used as a metric label'],
        answer: 1,
        explain: `trace-id keeps spans in the same trace; parent-id is the span at the sender so the receiver can create a child relationship. Baggage is separate metadata and must not contain secrets.`
      }
    ]
  }
});
