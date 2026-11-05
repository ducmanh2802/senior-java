/*
 * English translation of js/data/lessons-spring.js — task T756. Format: js/core/i18n.js (content overlay).
 * ids: lesson-spring-009
 */
App.i18n.content({
  'lesson-spring-009': {
    title: 'Spring Events and @TransactionalEventListener: when is the right time to send an email',
    goals: [
      'Describe when @EventListener runs relative to a transaction',
      'Explain the phases of @TransactionalEventListener and fallbackExecution',
      'State why AFTER_COMMIT can still lose an event and when an outbox is mandatory',
      'Simulate a transactional event bus in pure Java'
    ],
    body: `**Summary:** {{ApplicationEventPublisher}} + {{@EventListener}} is an **in-process, synchronous** pub/sub mechanism: calling publish invokes the handler right on the calling thread. Because the listener runs **at publish time**, it runs **inside** the currently open transaction — emails, SMS, API calls go out to the world before commit, and rollback does not pull them back. {{@TransactionalEventListener}} is different: on an event, Spring does not call the handler but **registers a callback** (the {{TransactionSynchronization}} interface) with the active transaction; the transaction manager invokes the callback at the right phase, default {{AFTER_COMMIT}}, and **skips it entirely** if the transaction rolls back. Both are still **not durable**: if the process dies after commit but before delivery, the event is lost forever — side effects touching money require a **transactional outbox**.

### What an event, publisher, and listener are
The typical scenario: after creating an order, the system must send a confirmation email, award loyalty points, and update the search index. Written directly, {{OrderService}} would need three dependencies, and every new side effect would force editing {{OrderService}}. The pub/sub pattern flips that: the service only announces "**order created**", and whoever cares registers to listen.

Three concepts: **event object** = a plain object carrying data ({{new OrderCreatedEvent(orderId, total)}}; since Spring 4.2 it need not extend {{ApplicationEvent}}); **publisher** = a bean injecting {{ApplicationEventPublisher}} and calling {{publishEvent(event)}} ({{ApplicationContext}} itself is also a publisher); **listener** = a method marked {{@EventListener}}, matched by **parameter type** — a listener declaring a parameter of type {{OrderEvent}} receives subclasses of {{OrderEvent}}, and {{@Order}} orders multiple listeners receiving the same event.

The most misunderstood point: **by default the listener runs synchronously, on the publisher's thread, right inside publish**. Moving it elsewhere requires {{@Async}} + {{@EnableAsync}} — and then the listener no longer has the publisher's transaction, changing the meaning of everything below.

### Sending email inside a transaction: what happens
~~~seq
title: @EventListener runs right inside the open transaction
actors: API | OrderService | DB | MailListener | SMTP
API -> OrderService: POST /orders
OrderService -> DB: insert order (not yet committed)
OrderService -> MailListener: publishEvent(OrderCreatedEvent)
MailListener -> SMTP: send confirmation email (2 sec)
MailListener --> OrderService: return; transaction still open
OrderService -> DB: rollback because stock deduction failed
DB --> API: error 500
note API..SMTP: email was sent, but the order does not exist
~~~

All four consequences are very real:

1. **"Ghost" side effects**: the customer receives "your order succeeded" for an order that does not exist. There is no way to roll back an SMTP command or a message already in Kafka.
2. **Holding connections and locks longer than needed**: the transaction holds one connection from the pool ({{HikariCP}} defaults to max 10) and locks the rows it modified. A listener calling SMTP for 1-2 seconds or another service timing out after 5 seconds keeps that connection held the whole time. Under traffic spikes the pool drains and the whole app waits on {{connection-timeout}}, not just the email thread.
3. **A minor failure breaks the main business flow**: a listener throwing means the exception propagates up through {{publishEvent}}, which sits inside the transaction, so the transaction rolls back. "Could not send email" becomes "could not create the order".
4. **Retries duplicate side effects**: the client sees 500 and clicks again, but the previous email was already sent.

### How @TransactionalEventListener works
{{@TransactionalEventListener}} is not "async event". It is {{@EventListener}} plus a registration step: the listener adapter checks the annotation, then calls {{TransactionSynchronizationManager.registerSynchronization}} — that is, **writing its own name into the callback list of the current transaction**. When the transaction ends, {{AbstractPlatformTransactionManager}} invokes each callback at the right moment:

- {{BEFORE_COMMIT}}: right before commit (still inside the transaction, so DB writes here are part of that transaction).
- {{AFTER_COMMIT}} — **default**: after a successful commit. On rollback this callback **never runs**.
- {{AFTER_ROLLBACK}}: only on rollback.
- {{AFTER_COMPLETION}}: always runs after the transaction ends, regardless of commit or rollback (cleanup, metrics).

Four details to remember for interviews:

- {{fallbackExecution}} defaults to **false**: if there is **no open transaction** at publish time, Spring drops the event and writes only a debug-level log line. A listener that "just doesn't run" is usually explained by this — the classic example is publishing from a method whose {{@Transactional}} is on a different (caller) class, or publishing in a unit test with no transaction.
- The callback runs **after** commit, so the old transaction is done. If the listener **writes** to the DB it must open a new transaction: {{@Transactional(propagation = Propagation.REQUIRES_NEW)}}; nothing guarantees that write gets committed. Reads are fine, since the data is already committed and visible to every connection.
- **Do not put lazy entities into the event**: after commit the Hibernate session is closed; a listener touching {{order.getItems()}} gets {{LazyInitializationException}}. Send an {{id}} or a DTO with the needed fields copied.
- **A listener throwing in AFTER_COMMIT does not roll back** (commit already happened) but the exception propagates out of the commit call, so the API returns 500 while the data is already stored — a client retry can create a duplicate order. So such listeners must catch their own errors, log, and emit metrics; never let the exception escape.

### When AFTER_COMMIT is still not enough: the transactional outbox
The remaining problem is **atomically doing two things in two systems**: the DB change and the notification to the outside world live in two different systems, and no single transaction spans both ({{Two-Phase Commit}} between Postgres and Kafka is practically nonexistent). The outbox solves it by making delivery part of the transaction itself:

~~~seq
title: Outbox gets the event to Kafka without losing it
actors: App | DB | Poller | Kafka | Consumer
App -> DB: insert order (one transaction)
App -> DB: insert outbox_row (event id, payload)
DB --> App: committed
Poller -> DB: select outbox_row where sent = false
Poller -> Kafka: publish payload in order
Poller -> DB: mark sent = true
Kafka --> Consumer: email, points, search
note App..Kafka: if the process dies after commit, the row remains to be retried
~~~

Properties: **at-least-once** delivery (an event can be sent twice if the poller dies mid-flight), so the consumer must be **idempotent** — usually by storing {{event_id}} in a processed-events table with a unique constraint, or by using upstream topic compaction. Compared to plain {{@TransactionalEventListener}}, the outbox adds latency (poll every 100 ms - 1 s, or CDC such as Debezium reading the WAL for near-real-time) and one more component to monitor, but in return: no lost signals, retryable delivery, and an audit log.

| Approach | When it runs | On rollback | If process dies after commit | Use for |
|---|---|---|---|---|
| {{@EventListener}} | at publish time, inside the transaction | still ran | already ran | pure in-process computation, no side effects |
| {{@TransactionalEventListener}} AFTER_COMMIT | after commit | dropped | **signal lost** | internal notifications, cache eviction, "nice to have" email |
| Outbox + queue | after commit, with polling latency | row does not exist | **row remains, retried** | transactional email, crediting money, messages to other services |

### Common pitfalls
- **Tests wrapped in {{@Transactional}}**: TestContext rolls back after each test by default, so an {{AFTER_COMMIT}} listener never runs and you think the code is wrong. Drop the annotation, or use {{TransactionTemplate}} then assert after commit, or {{TestTransaction.setCommit(true)}}.
- **{{fallbackExecution = true}}** makes the listener run even without a transaction — i.e. back to "side effect before commit". Enable only when you are sure the listener has no dangerous side effects.
- **{{@Async}} + {{@TransactionalEventListener}}**: the callback is submitted to the executor after commit; the request returns fast but nobody receives the listener's errors — logging + metrics + alerts become mandatory.
- **Configuring a {{taskExecutor}} for the {{ApplicationEventMulticaster}}** silently turns *every* listener async — a seemingly harmless config change that breaks the consistency {{@EventListener}} relied on.
- **Multiple listeners in the same phase** run sequentially per {{@Order}}; they still share one connection/thread, so a slow first listener slows the second.
- **Outbox poller**: do not {{SELECT ... FOR UPDATE}} and then publish to Kafka inside the transaction (holding the lock and making the broker a dependency of the DB transaction); read the row, publish, then mark it done using a unique {{event_id}} so duplicate sends are harmless.

### Interview notes
Four-step answer framework: (1) Spring events are in-process and **synchronous**, the listener runs inside the publisher's transaction; (2) use {{@EventListener}} only for in-process computation, and defer side effects to the outside world until after commit; (3) {{@TransactionalEventListener(phase = AFTER_COMMIT)}} registers a callback with the transaction, gets dropped on rollback, but a listener that writes to the DB needs a new transaction and must catch its own exception; (4) still not enough when the requirement is "guaranteed delivery" → outbox + queue + idempotency, or CDC. Close with a real-world proof: "my listener was being dropped because the test wrapped everything in {{@Transactional}}; I later switched to {{TransactionTemplate}} to test the real commit phase."

> Senior tip: A short rule: side effect **acceptable to lose** → {{@TransactionalEventListener}}; side effect **touching money, contracts, or another system** → outbox. And always measure connection-hold time: a listener calling SMTP for 2 seconds inside a transaction is enough to take down a pool of 10 connections when traffic triples — the symptom shows up as "app hangs", not "email is slow".`,
    exercises: [{
      title: 'EventBus with a fake transaction: IMMEDIATE, AFTER_COMMIT, AFTER_COMPLETION',
      prompt: `Complete the {{EventBus}} — a miniature model of {{ApplicationEventPublisher}} + {{@TransactionalEventListener}}, with a fake transaction (no DB, no threads). The classes {{Handler}}, {{OrderEvent}}, {{PaidEvent}} (a subclass of {{OrderEvent}}), and {{RefundEvent}} are already provided.
- {{subscribe(eventType, phase, handler)}}: add a listener to the list **in registration order**. Accept only the three phase values {{"IMMEDIATE"}}, {{"AFTER_COMMIT"}}, {{"AFTER_COMPLETION"}}; any other value must throw {{IllegalArgumentException}}.
- {{publish(event)}}: iterate listeners in registration order, skipping any whose {{eventType}} is **not** a type of the event (note: a listener subscribed for {{OrderEvent}} must receive {{PaidEvent}}). An {{IMMEDIATE}} listener → invoke the handler **right away**, and if the handler throws, {{publish}} rethrows that exception. {{AFTER_COMMIT}}/{{AFTER_COMPLETION}} listeners: if a transaction is open, **queue the callback** (together with this publish's event object); if there is **no** transaction, skip — do not call and do not queue (this is Spring's default {{fallbackExecution = false}}).
- {{beginTx()}}: open a transaction. If one is already open, throw {{IllegalStateException}} (nested transactions are not simulated).
- {{commit()}}: if no transaction is open, throw {{IllegalStateException}}. Close the transaction first ({{inTransaction()}} must return false), then run the {{AFTER_COMMIT}} callbacks currently queued, in registration order, **then** {{AFTER_COMPLETION}}. Both queues must be **copied out and cleared** before invoking any callback. If an {{AFTER_COMMIT}} callback throws: the exception must escape {{commit()}}, the transaction is still considered committed, and the {{AFTER_COMPLETION}} callbacks **must still run** (as Spring does).
- {{rollback()}}: if no transaction is open, throw {{IllegalStateException}}. Close the transaction, **drop** all {{AFTER_COMMIT}} callbacks, still run {{AFTER_COMPLETION}} in registration order; an exception from an {{AFTER_COMPLETION}} callback escapes {{rollback()}}.
- {{inTransaction()}}: true from {{beginTx()}} until {{commit()}}/{{rollback()}} finishes. Tests do not check its value **inside** a callback, so you need not reproduce that Spring detail exactly.`,
      hints: ['Minimal structure: a list of listeners ({{eventType}}, {{phase}}, {{handler}}), a {{boolean tx}} flag, and two callback queues for {{AFTER_COMMIT}} and {{AFTER_COMPLETION}}. Each queue entry must store **both the listener and the event object**, because two publishes in the same transaction yield two callbacks with different events.', 'Type matching via {{eventType.isInstance(event)}} — exactly how Spring matches a listener to its parameter type, so a super-class listener receives subclasses.', 'Queue, do not call: in {{publish}}, for a non-IMMEDIATE phase with {{tx}} false, do **nothing** (do not throw, do not invoke the handler). That is {{fallbackExecution = false}} behavior.', 'In {{commit}}, copy then clear both queues **before** invoking callbacks, and put the {{AFTER_COMPLETION}} loop inside a {{finally}} around the {{AFTER_COMMIT}} loop, so completion callbacks still run when a commit callback throws — exactly like {{AbstractPlatformTransactionManager.processCommit}}.'],
      explain: `This exercise rebuilds three real Spring decisions.

**First**, the IMMEDIATE listener is invoked inside {{publish}}. In Spring, {{publishEvent}} goes through the {{ApplicationEventMulticaster}} and calls the listener **right on the current thread**, while the transaction is still open. That is why an email can be sent while the order can still roll back, and why a slow listener keeps the transaction holding its connection longer.

**Second**, phase listeners are not run but **queued**. Spring does this via {{TransactionSynchronizationManager.registerSynchronization}}, attaching the callback to the open transaction; the transaction's {{commit}}/{{rollback}} is where it decides which callbacks fire. Because the callback is attached to the transaction, if there is no transaction at publish time there is nothing to attach to — the event is dropped, which is {{fallbackExecution = false}}.

**Third**, {{AFTER_COMPLETION}} runs inside a {{finally}} after {{AFTER_COMMIT}}. Spring does almost exactly this in {{processCommit}}: an exception from an afterCommit callback **propagates out** to the caller, but the transaction is already truly committed; afterward afterCompletion is still triggered. The painful real-world consequence: the API returns 500 even though the data is saved, and a client retry creates a duplicate order — which is why an AFTER_COMMIT listener must catch its own errors, log, and emit metrics.

Common mistakes when solving:
- Queue stores only the listener and forgets the event: the "each queued callback receives the event it was queued with" test fails.
- Forgetting to clear the queue after running: callbacks fire again on the next transaction.
- Running {{AFTER_COMMIT}} and {{AFTER_COMPLETION}} interleaved by registration order instead of by phase: the "grouped by phase" test fails. Spring also runs them grouped by phase first/after as in this exercise.
- Invoking callbacks after opening a new transaction, or forgetting to set {{tx}} = false before running callbacks: the {{inTransaction()}} assertions fail.
- Letting {{rollback}} run {{AFTER_COMMIT}} callbacks: defeats the whole pattern.
To get closer to production: support {{propagation}} in {{beginTx}}/{{commit}} ({{REQUIRES_NEW}} suspending the outer transaction), or let an {{AFTER_COMMIT}} callback publish again — and you will see that event get **dropped** because no transaction is open anymore. That is exactly why people move to the outbox.`
    }],
    check: [
        { q: 'Your test is wrapped in {{@Transactional}} (Spring Test rolls back after each test) and the {{@TransactionalEventListener}} listener never runs. Why?', options: ['The listener only runs in production builds', 'Spring Test disables all application events', 'The test transaction is rolled back, so the AFTER_COMMIT phase never occurs', 'Because the listener is missing @Async'], answer: 2, explain: `{{@TransactionalEventListener}} registers a callback against the current transaction; when the transaction ends by rollback, the AFTER_COMMIT callback is dropped — and TestContext rolls back after every test by default. Fix: do not wrap the test in {{@Transactional}}, use {{TransactionTemplate}} and assert after commit, or {{TestTransaction.setCommit(true)}}. The annotation does not depend on the build environment, the test context still publishes events normally, and {{@Async}} is unrelated to the callback being dropped.` },
        { q: 'Code calls {{publishEvent(e)}} when **no** transaction is open, and the listener is a default {{@TransactionalEventListener}}. What happens?', options: ['The listener runs immediately like @EventListener', 'The listener is dropped and only logged; set fallbackExecution = true to make it run outside a transaction', 'Spring throws IllegalStateException', 'The listener runs after Spring opens a new transaction automatically'], answer: 1, explain: `By default {{fallbackExecution = false}}: with no transaction to attach the callback to, the event is dropped and Spring only writes a debug-level log. This is the source of many "why doesn't my listener run" bugs. It does not auto-open a transaction (the publisher does not decide business boundaries), it does not behave like a plain {{@EventListener}}, and it does not throw.` },
        { q: 'An {{AFTER_COMMIT}} listener throws a RuntimeException. Which statement is correct?', options: ['The transaction rolls back because the listener is part of it', 'Spring retries the listener three times', 'The error is swallowed completely and the caller sees nothing', 'The data is already committed; the exception propagates to the caller of commit, so the API may return 500 even though the order was created'], answer: 3, explain: `The callback runs **after** doCommit, so there is nothing left to roll back; the exception is propagated to the caller of the commit call — the consequence is a client receiving 500 and retrying, creating a duplicate order. Spring does not retry the listener. The error is also not swallowed (only afterCompletion callbacks are logged and then Spring moves on). That is why an AFTER_COMMIT listener should catch its own errors and emit metrics.` },
        { q: 'Why is {{@TransactionalEventListener}} alone not enough for "guaranteed email delivery", and what does the outbox add?', options: ['Because the process can die after commit but before delivery; the outbox writes the event into the DB within that same transaction so it can be retried later', 'Because the AFTER_COMMIT listener runs before commit', 'Because the outbox makes email faster', 'Because Spring events allow at most one listener'], answer: 0, explain: `Spring events exist only in the memory of one process: after commit, if the JVM dies before the callback sends the email (deploy, OOM, pod being drained), the signal is lost forever with no log indicating it. The outbox writes an event row **inside that same transaction**, so "committed" means "message stored"; a poller or CDC reads unsent rows and pushes them to the queue, and the consumer must be idempotent because retries can duplicate. AFTER_COMMIT runs after commit, not before; the outbox increases latency rather than reducing it; and the listener count is not limited to one.` }
    ],
  }
});
