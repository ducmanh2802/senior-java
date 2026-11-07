/*
 * English translation of js/data/lessons-core.js — task T688. Format: js/core/i18n.js (content overlay).
 * ids: lesson-core-007
 */
App.i18n.content({
  'lesson-core-007': {
    title: `Handling exceptions in a service: wrapping that keeps the cause, conditional retry and Result`,
    goals: [
      'Choose checked or unchecked by asking who is actually able to fix the error',
      'Convert an exception at a layer boundary without losing the cause and without swallowing the failure',
      'Design retry for transient errors only, and gather every failed attempt into one single exception',
      'Know when to return a Result instead of throwing an exception'
    ],
    body: `**Summary:** An exception inside a service is a message sent to someone in another layer, so the design question is not "throw or not" but "**who can fix this error**". A checked exception forces the caller to handle it on the spot; an unchecked one travels straight up to the boundary so that a centralised handler decides. When you convert an error at a layer boundary always keep the {{cause}}, never catch-and-drop, and retry only genuinely transient errors, because retrying a write without an idempotency key can create a duplicate transaction.

### Checked or unchecked: look at whoever can rescue the situation
A checked exception is a subclass of {{Exception}} that is not a {{RuntimeException}}; the compiler forces you to declare {{throws}} or to catch it. Use one only when the caller really has a recovery option: read a different file, ask the user to re-enter, try another node from the list. Otherwise it merely spreads the {{throws}} signature through controller → service → repository and muddies the API.
**Spring trap**: {{@Transactional}} rolls back only for {{RuntimeException}} and {{Error}} by default. Wrapping a database error into a checked exception and "handling" it in a higher layer can make the transaction **commit** with a half-finished write. You must declare {{rollbackFor}} if you deliberately use checked exceptions.

| Type | Who decides | Example | Note |
|---|---|---|---|
| Checked | The caller right at the call site | File not found, must pick another | Leaks into the API signature; Spring does not roll back by default |
| {{IllegalArgumentException}} | Whoever wrote code that breaks the contract | Null input, wrong format | It is the caller's fault, not the system's |
| {{IllegalStateException}} | The system state is wrong | Writing after close | Check whether it is a race condition |
| {{RuntimeException}} from infrastructure | Middleware, boundary | DB timeout, 503 from upstream | Retry or circuit breaker at exactly that layer |
| {{Error}} | Nobody | {{OutOfMemoryError}} | Do not catch it; let the process die and restart |

### Wrap, but keep the cause
At a layer boundary the reader needs business context (the order id), not the driver's class name. Rewriting the message is correct, but you must pass the original error into the {{cause}} parameter:

~~~java
try {
    return jdbc.query(sql, rowMapper, orderId);
} catch (DataAccessException e) {
    throw new OrderRepositoryException("Could not load order " + orderId, e);
}
~~~

The constructor that takes a cause makes the JVM print the whole chain: the first line is the new message, then {{Caused by:}} with the original stack trace. Drop the cause and you lose the most valuable information — whether the real fault was a timeout, a unique constraint or a wrong connection string. Seen from above, everything just reads "it broke".
Log the full stack trace **once**, at the boundary (a filter, {{@ControllerAdvice}}, or where the job finishes). Logging at every layer makes the same error appear five times in Kibana, hides the other errors and costs money on log indexing.

### Do not swallow exceptions
All three forms below destroy your ability to investigate:

~~~java
catch (Exception e) { }                       // everything lost: nothing left to trace
catch (Exception e) { log.warn("something failed"); }   // the error type and the stack trace are lost
catch (DataAccessException e) { return List.of(); }  // the caller cannot tell "empty" from "broken"
~~~

{{catch (Exception e)}} also swallows {{RuntimeException}}s caused by plain bugs (NPE, {{ClassCastException}}), turning a code defect into baffling silent behaviour. {{catch (Throwable t)}} is worse because it catches {{OutOfMemoryError}} as well. The right direction: catch exactly the error types this layer can handle, or wrap and rethrow. If a loop processes many elements and each one is caught, logged and then continued, count the errors and report the count at the end of the job — never let a job report "success" while 500 units failed.

### try-with-resources is still an easy place to lose information
Resources close in the reverse order they were opened; if the body of the block already threw error A and {{close()}} throws B, the caller receives A while B sits in {{A.getSuppressed()}}. Diagnose cleanup failures by walking {{getSuppressed()}}, because {{close()}} of a {{BufferedWriter}} is exactly where the flush happens — ignoring it means accepting data loss that nobody knows about.
A detail few people notice: if the system reuses **one and the same exception instance** (a static exception kept to save allocation cost), then {{e.addSuppressed(e)}} throws {{IllegalStateException}}, because Java forbids an exception from attaching itself as its own suppressed exception.

### Result: when failure is part of the flow
{{Result<T>}} is an object holding either a value or an error; the caller is forced to go through {{isSuccess()}} or {{value()}}. It fits at boundaries: parsing a payload that came from outside, calling an API that returns a business outcome, or a retry helper whose callers do not want to write {{try/catch}}.

~~~java
Result<Quote> r = Result.of(() -> parser.parse(payload));
if (!r.isSuccess()) return ResponseEntity.badRequest().body(describe(r.error()));
~~~

| Approach | Pros | Cons |
|---|---|---|
| Exception | Travels through many layers without changing signatures; keeps the stack trace | Expensive to throw because of {{fillInStackTrace}}; easy to swallow; a poor fit for an expected flow |
| {{Result}} | Explicit, easy to test, no "forgot to handle it" path | Keeps no stack trace unless you store the {{Throwable}} yourself; you must write the plumbing yourself when it nests |

Do not use {{Result}} to replace exceptions throughout the whole system: infrastructure errors should still be thrown so that your transactions, circuit breakers and alerts keep working as before. {{Result}} should only be a "capsule" at the boundary.

### Retry: transient only, capped, with idempotency
{{retryOn}} is a {{Predicate<Throwable>}} that says which error kinds are worth trying again — instead of {{catch (Exception)}} and then retrying everything.

~~~java
Predicate<Throwable> netTransient = t -> t instanceof SocketTimeoutException;
String body = Attempts.retry(() -> client.fetch(orderId), 3, netTransient);
~~~

- **Do not retry**: validation errors, 400/401/403/404, business rejections (insufficient balance). Rerunning the identical input gives the identical result; retrying only burns resources and pollutes your metrics with a fake error rate.
- **A write's timeout**: the server may already have received it and already committed it. You need an idempotency key (a unique key generated by the client, which the server lets through only the first time) before you even think about retrying a POST.
- **Retry storm**: every instance retrying at the same moment when the DB slows down pushes the load straight back into the DB. Use exponential backoff with jitter, cap both the number of attempts and the total time (a deadline), and combine it with a circuit breaker.
- **Deterministic tests**: never verify retry with {{Thread.sleep}} or with the clock. Count how many times {{action}} was called and check the list of errors — 200 runs still give the same result.
- **Collect the error history**: throw the exception of the last attempt (its message describes the failure the reader actually cares about) and attach the earlier exceptions to {{getSuppressed()}} in chronological order, so that one single log line shows all three attempts.

### Mapping domain errors to the outside world
| Error | HTTP | Note |
|---|---|---|
| {{NotFoundException}} | 404 | the resource does not exist |
| Validation, {{IllegalArgumentException}} | 400 | the caller's fault, include the list of fields |
| Business rejection (limit, balance) | 422 | the request is syntactically fine but cannot be processed |
| {{ConflictException}}, optimistic lock | 409 | the data version has already changed |
| Dependency temporarily unavailable | 503 | include {{Retry-After}} so well-behaved clients back off |
| Everything else | 500 | return a correlation id, NEVER a stack trace or SQL |

### Production pitfalls
- {{e.getMessage().contains("timeout")}} used to classify errors: fragile as soon as the driver or the upstream rewords its text. Classify by type or by a stable error code.
- Returning a default value (0, empty, {{null}}) when something fails: wrong data that nobody notices, and a reconciliation report surfaces it a month later.
- Wrapping the error but passing only the message, losing the cause (losing {{Caused by:}}).
- Wrapping an exception inside a {{for}} loop and throwing only the last one without collecting the suppressed ones: the reader sees a single attempt.
- Log messages containing a PAN, a token, a password or personal data: the boundary must mask them before logging.
- Swallowing {{InterruptedException}} without calling {{Thread.currentThread().interrupt()}}: the application cannot shut down in time when the platform kills the pod.
- Enabling retry at the HTTP client layer AND the service layer AND the job layer: the three multiply into 27 calls for one error, and the upstream side starts treating you as an attack.

### Interview notes
Tell about a production error that was swallowed in a middle layer and how you found it; explain why a checked exception changes rollback behaviour in Spring; state the criteria for choosing which errors may be retried, together with the idempotency key for writes; and say when you deliberately return a {{Result}} instead of throwing an exception.`,
    exercises: [{
      title: `conditional retry, Result and suppressed exceptions`,
      prompt: `Write {{Result<T>}} and {{Attempts}}.
- {{Result.success(v)}} holds a value; {{Result.failure(e)}} holds an error and rejects a {{null}} error with {{IllegalArgumentException}}; {{Result.of(action)}} runs {{action}} and captures both {{RuntimeException}} and {{Error}} into a failed {{Result}}. {{isSuccess()}} reports success; {{value()}} returns the value or throws exactly the stored error instance (when it is unchecked); {{error()}} returns the error or {{null}}.
- {{Attempts.retry(action, maxAttempts, retryOn)}}: if {{maxAttempts < 1}} throw {{IllegalArgumentException}} BEFORE calling {{action}}. Call {{action}} at most {{maxAttempts}} times. If an error is not accepted by {{retryOn}}, stop right there and throw that very error, without wrapping it. If the errors are still of the allowed kind but the attempts run out, throw the error of the LAST attempt and attach the errors of the earlier attempts to {{getSuppressed()}} in chronological order.
- {{Attempts.attempt(...)}} uses {{retry}} internally but returns a {{Result}} instead of throwing.
Never use {{Thread.sleep}}, the date and time, or any nondeterministic ordering: every test must give the same result when rerun.`,
      hints: [
        'A for loop from 1 up to maxAttempts; if retryOn returns false, throw immediately, before you even get around to collecting the history.',
        'Keep a List of the errors you have seen; only when you reach the last attempt do you attach them to that final error with addSuppressed in chronological order, then throw the final error.',
        'maxAttempts must be checked at the top of the method, before action is called even once — the test counts the number of calls to catch this mistake.',
        'attempt should call retry and catch RuntimeException so it can return Result.failure(error), keeping the exact error instance so error() is still usable.'
      ],
      explain: `The rule "throw the error of the last attempt" keeps the message describing the most recent failure, while {{getSuppressed()}} reveals the {{attempt-1}}, {{attempt-2}} chain in one pass through the log — exactly the mechanism the JVM uses for {{close()}} in try-with-resources. {{retryOn}} is a {{Predicate}} rather than {{catch (Exception)}}, because retrying a validation error is both useless and damaging to your metrics. Checking {{maxAttempts}} before calling {{action}} turns a wrong configuration into a clear error instead of silently running once and stopping. Finally, {{Result}} keeps the exact error instance, so the caller can still read the stack trace and the original cause; if you store only the message you throw away the whole {{Caused by:}} part.`
    }],
    check: [{
      q: 'A repository catches DataAccessException and throws new RuntimeException("It broke") without passing the cause. What is the most serious consequence?',
      options: [
        'The original information is lost: the log at the boundary no longer tells whether it was a timeout, a unique constraint or a broken connection, every error looks the same',
        'The compiler reports an error because throws was not declared',
        'The program always crashes because RuntimeException cannot be caught',
        'There is no consequence, because the stack trace of the new throw site is enough'
      ],
      explain: 'Wrapping the error is right, in order to separate business code from the driver, but the constructor must accept the cause so that the JVM prints the extra Caused by line. Lose the cause and the investigation restarts from zero, while different infrastructure failures become indistinguishable.'
    },{
      q: 'A Spring @Transactional method throws a checked exception. By default, what happens to the transaction?',
      options: [
        'A full rollback, because every exception causes a rollback',
        'A partial rollback',
        'No rollback: by default only RuntimeException and Error roll back, so rolling back a checked exception requires declaring rollbackFor',
        'Spring itself throws an IllegalTransactionStateException'
      ],
      explain: "Spring's default rule is to roll back on RuntimeException and Error. A checked exception passes through and the transaction still commits, so if you wrap a database error into a checked exception and handle it in a higher layer, the system can commit a half-finished write."
    },{
      q: 'A debit service calls an upstream over the network. Which kind of error should be retried?',
      options: [
        'Insufficient balance (a business rejection)',
        'A connect timeout, together with an idempotency key for the write',
        'A 404 response because the path is misconfigured',
        'An IllegalArgumentException from the input validation step'
      ],
      explain: 'Only transient infrastructure errors are worth trying again, and for a write a timeout does not tell you whether the server already committed, so an idempotency key is mandatory. The other three options produce exactly the same result when rerun; they only add latency and load.'
    },{
      q: 'In a retry, why throw the exception of the LAST attempt with the earlier attempts inside getSuppressed, instead of throwing only the last one or only logging?',
      options: [
        'Because getSuppressed is the only way to change the exception type',
        'Because only the last exception has a message',
        'Because Java does not allow throwing an exception that was caught in an earlier loop iteration',
        'Because the reader sees one primary error, which is the newest one, and still has every earlier failure in the same log line'
      ],
      explain: 'This is exactly the mechanism try-with-resources uses for close errors. Keeping the whole history inside one exception lets you compare the messages across attempts (transient, or repeating identically) without walking back through many log lines of the same request.'
    }]
  }
});
