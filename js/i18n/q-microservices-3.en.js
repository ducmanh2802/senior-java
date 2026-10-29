/*
 * English translation of js/data/q-microservices.js — task T192, entries redone in T536. Format: js/core/i18n.js (content overlay).
 * ids: microservices-021 microservices-022 microservices-023 microservices-024 microservices-025 microservices-026 microservices-027 microservices-028 microservices-029
 */
App.i18n.content({
  'microservices-021': {
    q: `Your team uses JSON for Kafka events and hits errors when adding a new field that the old consumer cannot read. Explain Schema Registry (Avro/Protobuf), backward vs forward compatibility, and the rules for evolving a schema safely.`,
    a: `**Summary:** Plain JSON has no contract ⇒ the producer adds a field and an old consumer crashes (missing field), or the producer removes a field and an old consumer reads null with a different meaning. **Schema Registry** stores schemas by version and checks compatibility before registering. **Backward compatibility** (the default): a consumer on the new schema can read data written with the old schema — **deploy the consumer first**; **forward compatibility**: a consumer on the old schema can read data written with the new schema — **deploy the producer first**.

### Quick intuition
Think of plain JSON as a handwritten letter with no template: everybody writes whatever they like, and an old recipient cannot understand it once words are added or removed. **Schema Registry** is a registry office for letter templates, each with a version number: the sender must use a registered template, the receiver uses the same template, and both understand each other. **Backward compatibility** means the receiver (consumer) moves to the new template first and can still read old letters; **forward compatibility** means the sender (producer) uses the new template first and the old receiver can still read new letters. The golden rule: only add words (fields) that can be ignored (with a default); never delete a word or change its type.

### Glossary
- **Schema Registry**: a server that stores schemas by version and checks compatibility at registration; the producer serializer fetches and caches the schema ID (magic byte + 4-byte ID).
- **Backward compatibility**: the consumer deploys first — the new schema can read old data (delete a field, or add a field with a default).
- **Forward compatibility**: the producer deploys first — the old schema can read new data (add a field, or delete a field that had a default).
- **FULL compatibility**: both conditions — only add/remove fields that carry a default.
- **Avro**: JSON schema, compact binary encoding, union/nullable support, strong logical compatibility.
- **Protobuf**: {{.proto}} files, typed code generation, backward/forward compatibility through field numbers (never change a number, never change a type).
- **Transitive modes**: check against **every** historical version, not just the immediately preceding one.
- **Compatibility check**: CI/CD calls the REST endpoint {{/compatibility/subjects/.../versions/latest}} before merging.

### Why JSON is not enough
- No validation at produce time ⇒ garbage enters the topic and consumers discover it late.
- No evolution rule ⇒ one team adds {{phone}} as a string type, another adds {{phone}} as an object type ⇒ a silent conflict.
- Consumers must defensive-code everything (nullable everywhere) ⇒ extra branches, easy bugs.

### Avro / Protobuf + Schema Registry
- **Avro**: the schema is JSON, compact binary payload, supports unions/nullability, strong logical compatibility. Uses Confluent Schema Registry (REST API); the client serializer fetches and caches the schema ID (magic byte + 4 bytes ID).
- **Protobuf**: {{.proto}} files, typed code generation for Java/Go/Python, backward/forward compatibility via field numbers (never reuse a number, never change a field type; when you delete a field, {{reserved}} its number). proto3 drops {{required}}, so every field is optional. Confluent Schema Registry supports Protobuf and JSON Schema since Confluent Platform 5.5.

~~~java
// Avro serializer config
props.put("value.serializer", io.confluent.kafka.serializers.KafkaAvroSerializer.class);
props.put("schema.registry.url", "http://sr:8081");
props.put("auto.register.schemas", "false");  // register in CI only; production just consumes
~~~

### Compatibility modes (Confluent)
| Mode | Who deploys first | What's allowed | What's forbidden |
|---|---|---|---|
| **BACKWARD** (default) | **Consumer** | Delete a field, add a field **with a default** | Add a field without a default, change an incompatible type, rename (no aliases) |
| FORWARD | **Producer** | Add a field, delete a field **with a default** | Delete a field without a default, change an incompatible type |
| FULL | Either order | Only add/delete fields **with a default** (satisfies both conditions) | Anything BACKWARD or FORWARD forbids |
| NONE | - | Any change | No check (dangerous) |

The {{*_TRANSITIVE}} modes check against **every** historical version, not just the immediately preceding one.

**Golden rule**: only add optional/default fields; never delete/change types/rename. To "delete" ⇒ add the new field, deprecate the old one, clean up after N releases.

### Deployment order by compatibility
- **BACKWARD** (most common): Consumer v2 (new schema) deploys first → Producer v2 deploys later. Consumer v2 still reads data v1 left in the topic (the new field takes its default).
- **FORWARD**: Producer v2 deploys first → Consumer v2 deploys later. Consumer v1 still reads data v2 (it ignores the unknown field, and a deleted field takes the default from its own schema).
- Producer and consumers deploy independently, with no control over order ⇒ choose **FULL** (or FULL_TRANSITIVE).

### Migrating a breaking change
1. Register the new schema with compatibility=NONE (or disable the check temporarily).
2. Deploy consumers that read **both** (union types / upcast logic).
3. Deploy producers writing the new schema.
4. Once no old data remains ⇒ turn compatibility back on and delete the old reader code.

### Common mistakes
1. **Leaving auto-register on in production**. Symptom: one bad build registers a strange schema and consumers break. Fix: only CI may register; set auto.register.schemas=false in production.
2. **Adding a field without a default under BACKWARD**. Symptom: the registry rejects the registration, or (with NONE) new consumers cannot read old data. Fix: give every new field a default.
3. **Reusing a field number in Protobuf**. Symptom: old data is decoded with the wrong meaning and nothing errors. Fix: mark deleted numbers and names as reserved.
4. **Setting NONE and forgetting to turn it back on**. Symptom: months later a breaking change slips through. Fix: change the mode only through a reviewed PR and track when it must be reverted.

### One-minute spoken answer
"Plain JSON has no contract, so when the producer adds or removes a field an old consumer can break with nobody warned in advance. I move to Avro or Protobuf with a Schema Registry: each message carries only a schema ID, the registry stores schemas by version and checks compatibility at registration. BACKWARD, the default, means the new schema reads old data, so consumers deploy first; FORWARD means producers deploy first; when both sides deploy independently I pick FULL_TRANSITIVE. My rule is to only add fields with defaults, never change a type or a name, and to deprecate a field and clean it up a few releases later instead of deleting it. The trade-off is one more system to operate, so I run the compatibility check in CI and turn auto-register off in production."

> Senior tip: CI/CD **must** run a compatibility check (e.g. the {{test-compatibility}} goal of the {{kafka-schema-registry-maven-plugin}}, or a REST call to {{/compatibility/subjects/.../versions/latest}}) before merge. A PR that changes {{.avsc}}/.proto and fails the check does not merge. No exceptions — production is not the place to test schemas.`,
    follow: [`How do Avro union types handle nullability compared with Protobuf optional fields?`, `When do you choose FORWARD instead of BACKWARD?`, `How does Schema Registry stay highly available, and how does a producer cache the schema ID?`]
  },
  'microservices-022': {
    q: `Compare the Inbox pattern and the Outbox pattern for achieving an exactly-once effect when consuming events. How do you implement an idempotent consumer using a processed_message table?`,
    a: `**Summary:** **Outbox** solves atomicity of **write DB + publish event** on the **producer** side; **Inbox** solves atomicity of **consume event + write DB** on the **consumer** side. Both pursue the same goal: the side effect happens exactly once. Inbox uses a {{processed_message(msg_id PK, processed_at)}} table inserted in the same transaction as the business write — a duplicate message ⇒ PK conflict ⇒ skip.

### Quick intuition
Imagine an online shop. **Outbox** is like writing the order into a logbook (the outbox) as part of the same calculation that saves it to the database — only if the save succeeds do you send the confirmation email. **Inbox** is what you do when an order arrives: first check whether this order was already handled (the processed_message table) before doing the business work. Both guarantee nothing is processed twice and nothing is lost, but at opposite ends of the pipe.

### Glossary
- **Outbox**: write the business row + outbox row in one producer transaction, then relay the event out later.
- **Inbox**: insert processed_msg + business row in one consumer transaction; dedup through the primary key.
- **Exactly-once**: the side effect happens exactly once (even though the broker only offers at-least-once).
- **Processed message**: the table of msg_ids already handled, used to dedup the consumer.
- **Duplicate key**: the error raised when inserting an existing message — used to skip duplicates.
- **Idempotent consumer**: a consumer whose handling of a duplicate message causes no side effect.
- **Transaction**: saving to the DB and inserting processed_message in the same transaction, so the pair is atomic.
- **Relay**: polling/CDC that pushes outbox rows out to the broker as events.

### Outbox vs Inbox — the two ends of the pipe
| | Outbox (Producer) | Inbox (Consumer) |
|---|---|---|
| Problem | DB write succeeds, publish event fails/is lost | Consume event, DB write fails/is lost, or duplicate processing |
| Solution | Business row + outbox row **in one transaction** | Insert processed_msg + business row **in one transaction** |
| Relay | Polling / CDC (Debezium) pushes to the broker | No relay needed — the consumer dedups itself |
| At-least-once → exactly-once effect | Producer idempotent + consumer idempotent | **Consumer idempotency is mandatory** |

### Implementing the Inbox pattern
~~~sql
CREATE TABLE processed_message (
    msg_id VARCHAR(255) PRIMARY KEY,   -- Kafka offset/partition or event ID
    processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_payment (
    order_id VARCHAR(64) PRIMARY KEY,
    amount DECIMAL(19,2),
    status VARCHAR(20)
);
~~~

~~~java
@Transactional
public void handlePayment(PaymentEvent evt) {
    // 1. Try to insert processed_msg — duplicate key ⇒ exception ⇒ skip (MySQL; PostgreSQL see pitfall)
    try {
        jdbc.update("INSERT INTO processed_message(msg_id) VALUES (?)", evt.msgId());
    } catch (DuplicateKeyException e) {
        log.info("Duplicate event ignored: {}", evt.msgId());
        return;  // already handled, idempotent
    }

    // 2. Write the business data (same transaction)
    jdbc.update(
        "INSERT INTO order_payment(order_id, amount, status) VALUES (?, ?, 'PAID') " +
        "ON DUPLICATE KEY UPDATE amount=amount, status='PAID'",
        evt.orderId(), evt.amount()
    );
}
~~~
- **msg_id**: use {{topic-partition-offset}} (unique inside Kafka) or the {{eventId}} from the payload (if the producer guarantees uniqueness).
- **Same transaction** is an absolute requirement: two separate transactions ⇒ a crash between the steps means a duplicate or a loss.
- **Natural-key upsert** (INSERT ... ON DUPLICATE KEY UPDATE) replaces the processed_message table when the business key is already unique (e.g. {{order_id}} unique within payment) — one fewer table and one fewer insert.

### Compared with Outbox
- Outbox is **mandatory** when a service both writes to a DB and publishes events: there is no shared transaction between the DB and the broker (dual write) ⇒ write the event into the outbox table in the same transaction and relay it later.
- Inbox is **mandatory** when the consumer does not control the producer (3rd party, legacy) — the producer has no outbox.
- If you control **both ends**: Outbox + Inbox = end-to-end exactly-once effect (even though the broker is only at-least-once).

### Common mistakes
- The processed_message table **grows forever** ⇒ run a job that deletes old rows (TTL 7–30 days) and partition by day.
- If msg_id is {{topic-partition-offset}}: it only blocks the **consumer re-reading the same record**; a duplicated producer (non-idempotent retry, an outbox relay publishing twice) creates a record with a **new offset** ⇒ it slips through. Mirroring or restoring a topic also changes offsets ⇒ prefer an event ID the producer generates into the payload/header.
- PostgreSQL: a duplicate-key error **aborts the whole transaction** — catching the exception and running more SQL fails with "current transaction is aborted". Use {{INSERT ... ON CONFLICT (msg_id) DO NOTHING}} and check that the affected row count == 0 instead of catching exceptions.
- **Transaction timeout**: inserting processed_msg + the business write must be fast; avoid calling external APIs inside the transaction.

### One-minute spoken answer
"When I need an event handled exactly once, I apply the Inbox pattern: a processed_message table keyed by msg_id, inserted in the same transaction as the business write — if the message is a duplicate the primary key conflicts and I skip it. Outbox belongs on the producer side, when I both write to the database and must publish an event — I write both in one transaction and relay afterwards. If I control both the producer and the consumer I use both: Outbox on the producer, Inbox on the consumer, giving an exactly-once effect even though the broker is only at-least-once."

> Senior tip: the Inbox table is cheap insurance — always add it when consuming events from another team. One INSERT + one index lookup buys you peace of mind and no double charge.`,
    follow: [`Should msg_id come from the Kafka offset or from an event ID in the payload, and what are the trade-offs?`, `How does the Inbox pattern deal with transaction timeout (DB locks) at high volume?`, `When is a natural-key upsert a good replacement for the processed_message table, and when is it not?`]
  },
  'microservices-023': {
    q: `Your system uses choreography (event-driven) but the order flow spans 6 services: debugging is painful and services time each other out. When do you migrate to orchestration (Temporal/Camunda), and how do the two approaches compare on observability, compensation and versioning?`,
    a: `**Summary:** **Choreography**: each service emits and reacts to events on its own; nobody orchestrates. Simple at first, but once a flow gets long (more than 3–4 services) it turns into "event spaghetti": the whole picture is hard to see, timeouts pile on each other, compensations are scattered. **Orchestration**: a **workflow engine** (Temporal, Camunda) or a hand-written orchestrator drives every step; state is centralized, observability is good, compensation has an order. I switch when the flow is complex, crosses teams, needs centralized timeout/retry, needs to wait for external signals, or when an audit trail is mandatory.

### Quick intuition
**Choreography** is like a **football team without a coach**: every player watches the others and moves. Three players is fine; eleven and it is chaos, and when you lose nobody knows whose fault it was. **Orchestration** is like a **conductor** holding the full score: he knows who plays in which passage, stops when someone plays wrong, and follows the script. The conductor is one more person to pay, but a large orchestra cannot do without one.

### Glossary
- **Choreography**: decentralized coordination through events; each service knows which events it reacts to.
- **Orchestration**: one central component commands each step and tracks the flow state.
- **Workflow engine**: a system that runs workflows and stores their state durably (Temporal, Camunda).
- **Activity (Temporal)**: one step that calls the outside world (API, DB), retried and timed out per configuration.
- **Deterministic workflow**: workflow code must produce the same result when re-run from history, so it may not use randomness, the system clock or direct I/O.
- **BPMN**: a standard for drawing business processes as diagrams; Camunda executes the diagram directly.
- **Compensation**: a business action that undoes a step that already completed.
- **Human-in-the-loop**: a step that needs a person (approval, OTP entry) before the flow continues.

### Choreography: when it is enough, when it is overloaded
1. **Enough**: up to about 3 services, a linear flow, one team, few branches, no human step. Why: everyone can hold the whole flow in their head.
2. **Overloaded**: complex fan-out/fan-in, many conditional branches, must wait for external signals (OTP, manual approval), compensation has to walk back several steps, many teams with nobody owning end-to-end responsibility.
3. **Observability**: you need distributed tracing to see the flow; a failed event does not reveal which flow it belongs to or where an order is "stuck".
4. **Versioning**: adding a step = adding a consumer the producer does not know about; changing an event schema requires coordinating every consumer.
5. **Timeout**: each service sets its own timeout; nobody holds the "total deadline" of the whole order.

~~~text
Choreography (6 services):              Orchestration:
Order ─evt─► Stock ─evt─► Payment         Orchestrator ─cmd─► Stock
   ▲            │           │                │      ─cmd─► Payment
   └──evt── Shipping ◄─evt──┘                │      ─cmd─► Shipping ...
  "where is order 123?" → read 6 logs    state of order 123 = 1 workflow row
~~~

### Comparison on the three axes in the question
| | Choreography | Orchestration |
|---|---|---|
| Observability | stitch traces + logs from many services | the engine shows each step, its input/output and errors |
| Compensation | each service listens for failure events and compensates itself; ordering is hard to guarantee | the orchestrator compensates in reverse order, with its own retry/timeout |
| Versioning | changing an event means coordinating every consumer | version the workflow/process; old instances keep running the old version |

### Temporal vs Camunda vs hand-written
| | Temporal | Camunda 8 (Zeebe) | Spring StateMachine / hand-written |
|---|---|---|---|
| Model | code-first (Java SDK, workflow = code) | BPMN diagram + FEEL expressions | Java code + state table |
| State | stores the full event history, replays to recover | variables persisted, incidents on failure | managed by you in a DB |
| Retry/timeout | built in; heartbeat for long activities | built in | you write it |
| Scale | workers poll task queues, scales horizontally | Zeebe broker scales horizontally | depends on the implementation |
| Fits | backend teams that like writing code | BA + developers working on the same BPMN | small flows, small teams |
| Lock-in | Temporal server (self-host/Cloud) | Camunda SaaS/self-host | none |

- **Temporal**: workflows written in Java (or Go, TypeScript…), with **deterministic execution**: when a worker dies, another worker replays history and resumes at the exact point. It offers activity heartbeats for long-running work and **continue-as-new** to trim history on very long workflows. Versioning via {{Workflow.getVersion}} or worker versioning.
- **Camunda 8 (Zeebe)**: BPMN 2.0, clients talk gRPC/REST; running instances keep their old process version, and tooling exists to migrate instances.

### Compensation in orchestration
1. Each step registers its **compensation action** right after it succeeds.
2. When a step finally fails (retries exhausted), the compensation actions run in reverse order (LIFO).
3. The compensation actions themselves have retry/timeout, and the workflow shows a "compensating" state.

~~~java
Saga saga = new Saga(new Saga.Options.Builder().build());   // io.temporal.workflow.Saga
try {
    activities.reserveStock(orderId);
    saga.addCompensation(activities::releaseStock, orderId);  // compensation for step 1
    activities.chargePayment(orderId);
    saga.addCompensation(activities::refundPayment, orderId); // compensation for step 2
    activities.createShipment(orderId);
} catch (ActivityFailure e) {
    saga.compensate();   // run the compensations in reverse order
    throw e;
}
~~~
Camunda uses compensation events / boundary events on the diagram. The advantage over choreography: **compensation order is guaranteed**, compensation has its own timeout and retry, and the state is visible.

### When you do NOT need a workflow engine
- Flows under 3 services, linear, no branching, no human step.
- The team is not ready to operate one more engine (monitoring, upgrades, backing up the engine database).
- A simple saga: a saga state table + a state machine inside the service is enough.

### Common mistakes
1. **Non-deterministic Temporal workflow code** (calling {{LocalDateTime.now()}}, randomness, direct HTTP). Symptom: replay fails with "non-deterministic" and the workflow is stuck. Fix: use {{Workflow.currentTimeMillis()}}, put all I/O into activities, and test by replaying history.
2. **Editing a running workflow's logic without versioning**. Symptom: old instances replay down the wrong branch. Fix: {{Workflow.getVersion}} or worker versioning.
3. **Putting detailed business rules into the orchestrator**. Symptom: the orchestrator becomes a "god service". Fix: the orchestrator only coordinates; business rules live in the services.
4. **Moving everything to orchestration**. Symptom: even side notifications have to go through the engine. Fix: orchestrate the main flow; side tasks (email, analytics) keep listening to events.

### One-minute spoken answer
"Choreography is fine when the flow is short, linear and owned by one team. Once an order crosses 6 services with branches, external signals and multi-step compensation, I move to orchestration. On observability, an engine like Temporal shows each step, input and error of each order instead of stitching logs from 6 services. On compensation, the orchestrator registers an undo action after each step and runs them in reverse on failure, with its own retries. On versioning, workflows are versioned and old instances keep running the old logic. The trade-off is one more system to operate and the requirement that workflow code is deterministic. I keep events for side tasks and do not push everything into the engine."

> Senior tip: do not fear "adding an engine" — running Temporal/Camunda usually costs **less than debugging choreography at 3 AM**. Choose an engine when the cost of confusion is greater than the cost of infrastructure.`,
    follow: [`Temporal workflow code must be deterministic — how do you actually test determinism?`, `How is Camunda BPMN versioning different from ordinary code versioning?`, `When do you choose Spring StateMachine instead of a dedicated engine?`]
  },
  'microservices-024': {
    q: `Deploying Spring Boot 3 onto Kubernetes: how do you configure liveness, readiness and startup probes? Explain resource requests/limits, graceful shutdown with the preStop hook, and why you must not use a liveness probe to cover a slow startup.`,
    a: `**Summary:** The **startup probe** shields a slow boot (JVM warmup, Flyway migrations, cache loading); the **readiness probe** decides whether the pod receives traffic; the **liveness probe** only detects a truly hung app (deadlock) so it can be restarted — **never** use liveness to wait for startup, and never check dependencies in liveness. CPU/RAM requests/limits must come from real measurements, and remember Java memory is not only the heap. Graceful shutdown = {{preStop}} sleep + {{server.shutdown=graceful}} + a large enough {{terminationGracePeriodSeconds}}.

### Quick intuition
Picture a **new employee starting a shift** at a service counter. **Startup probe**: the manager gives them 5 minutes to boot the terminal, log in and arrange the papers; nobody judges them during that time. **Readiness probe**: the "counter open/closed" sign; when they are busy or lose the system connection they flip it to "closed" so customers go to another counter, but nobody fires them. **Liveness probe**: checking whether the employee has **passed out**; only a real blackout gets them replaced. If you use liveness to check during startup, you "replace the person" while they are still booting and no one ever makes it to the counter. **Graceful shutdown**: at the end of the shift, flip the sign to "closed", serve the customers already at the counter, and only then go home.

### Glossary
- **Probe**: a periodic check the kubelet performs against the container (HTTP, TCP, exec, gRPC).
- **EndpointSlice**: the list of ready pod IPs behind a Service; pods that are not ready are removed from it.
- **requests / limits**: how much resource the scheduler reserves for the pod / the ceiling the container may use.
- **OOMKilled**: the container was killed by the kernel for exceeding its memory limit.
- **CPU throttling**: the container is held back when it exhausts its quota in each CFS period, causing latency spikes.
- **QoS class**: Guaranteed / Burstable / BestEffort, which decides the eviction order when the node runs short of resources.
- **preStop hook**: a command that runs as soon as the pod starts terminating, before the container receives SIGTERM.
- **terminationGracePeriodSeconds**: the total maximum time from the start of termination until SIGKILL.

### Three probes with different purposes
| Probe | Purpose | On failure | When to use |
|---|---|---|---|
| **Startup** | the app is booting | past the threshold ⇒ **kill + restart** the container | **always** for Java (warmup, migrations, cache loading) |
| **Readiness** | ready to accept requests | **removed from Service endpoints**, no restart | **always** |
| **Liveness** | app hung/deadlocked | **kill + restart** the container | only for hard failures; use a light endpoint |

1. The **startup probe** runs first; while it has not succeeded, liveness/readiness **are not evaluated**. Set {{failureThreshold * periodSeconds}} greater than the maximum boot time (e.g. 30 × 10s = 300s for an app that migrates a DB). Why: avoid being killed while still booting.
2. **Readiness** uses {{/actuator/health/readiness}}: Spring Boot enables this probe group automatically on Kubernetes and reports REFUSING_TRAFFIC while booting and once shutdown begins. You may add the health of a dependency **that is essential to this app alone** (e.g. its own DB), but **never** check other downstream services, and be careful with shared dependencies: a slow shared DB can make **every** pod not-ready, i.e. the whole service turns itself off.
3. **Liveness** uses {{/actuator/health/liveness}} and reflects internal state only. **Do not check the DB**: if the DB dies and liveness fails, every pod restarts in a loop and hammers the DB even harder as it reconnects.

~~~yaml
startupProbe:
  httpGet: { path: /actuator/health/liveness, port: 8080 }
  periodSeconds: 10
  failureThreshold: 30          # up to 300s to boot
readinessProbe:
  httpGet: { path: /actuator/health/readiness, port: 8080 }
  periodSeconds: 5
  failureThreshold: 3
livenessProbe:
  httpGet: { path: /actuator/health/liveness, port: 8080 }
  periodSeconds: 10
  failureThreshold: 3           # restart only after 30s without a response
~~~

### Resource requests/limits — Java specifics
~~~yaml
resources:
  requests: { memory: "1536Mi", cpu: "500m" }
  limits:   { memory: "1536Mi", cpu: "2" }   # memory request = limit to avoid surprise OOM
# JAVA_TOOL_OPTIONS: -XX:MaxRAMPercentage=70
~~~
1. **Memory**: the total = heap + Metaspace + CodeCache + thread stacks (about 1MB per thread × 200 threads = 200MB) + direct buffers + GC overhead. That is why the heap should be roughly 60–75% of the limit; use {{-XX:MaxRAMPercentage=70}} instead of hard-coding {{-Xmx}} (modern JVMs read the container's cgroup limits).
2. **CPU**: the request is the baseline the scheduler reserves; a limit that is too tight throttles GC and JIT and latency jumps. Many teams set a CPU request but no (or a generous) CPU limit.
3. **QoS**: every container with request = limit for both CPU and memory → Guaranteed (evicted last); request < limit → Burstable; nothing set → BestEffort (evicted first).

~~~text
limit 1536Mi = heap 1075Mi (70%) + metaspace ~150Mi + codecache ~100Mi
             + threads ~200Mi + direct/GC ~ the remainder
-Xmx = limit  →  heap full + off-heap  →  exceeds the cgroup  →  OOMKilled
~~~

### Graceful shutdown: do not drop requests (step by step)
1. The pod moves to Terminating. **In parallel**: the control plane removes it from the EndpointSlice and the kubelet runs preStop. Why preStop is needed: kube-proxy/ingress takes a few seconds to update, and traffic **still reaches the pod** during that window.
2. **preStop sleep 10s**: the app keeps serving normally while the load balancers update.
3. After preStop the container receives **SIGTERM**. Spring Boot with {{server.shutdown=graceful}} (the default since Boot 3.4) stops accepting new requests and waits for in-flight requests for at most {{spring.lifecycle.timeout-per-shutdown-phase}} (30s by default).
4. When {{terminationGracePeriodSeconds}} runs out (counted from the start of termination, preStop included) before the app exits, it gets **SIGKILL**.

~~~yaml
lifecycle:
  preStop:
    exec:
      command: ["sh", "-c", "sleep 10"]   # distroless images have no shell: use the native sleep action of recent K8s
terminationGracePeriodSeconds: 45          # >= 10 (preStop) + 30 (shutdown phase) + slack
~~~

### Common mistakes
1. **A liveness probe that checks the DB**. Symptom: the DB slows down, pods restart one after another. Fix: liveness reflects internal state only.
2. **No startup probe and a short liveness initialDelay**. Symptom: the app needs 90s to boot but is killed at second 30, CrashLoopBackOff. Fix: add a long enough startup probe. (Readiness failing during boot is fine — the pod simply is not receiving traffic yet.)
3. **-Xmx set to the memory limit**. Symptom: OOMKilled even though the heap is not full. Fix: MaxRAMPercentage 60–75%.
4. **No preStop**. Symptom: a burst of 502/connection-refused errors on every deploy. Fix: preStop sleep + graceful shutdown + a large enough grace period.

### One-minute spoken answer
"I use three probes for three purposes. A startup probe for slow Java boots, with failureThreshold times periodSeconds larger than the maximum boot time. Readiness points at actuator health readiness to decide whether to accept traffic, and it does not check downstream services. Liveness only detects a hung app and never checks the DB, because a dead DB would restart every pod in a chain. On resources I leave the heap at about 70% of the memory limit through MaxRAMPercentage because Java also needs metaspace, thread stacks and direct buffers, and I avoid a tight CPU limit that throttles GC. For shutdown, preStop sleeps so load balancers can update, Spring shuts down gracefully, and the grace period is larger than the sum of the two."

> Senior tip: always load-test to find the real heap size after a Full GC and the native memory footprint (use Native Memory Tracking), and only then set requests/limits. Do not guess: Java memory is not only the heap.`,
    follow: [`How do you compute {{failureThreshold * periodSeconds}} for an app running 200 Flyway scripts?`, `How risky is a readiness probe that checks a downstream service?`, `{{terminationGracePeriodSeconds}} defaults to 30s — how much do you raise it for an app with slow requests?`]
  },
  'microservices-025': {
    q: `A request from a client travels through 5 services (A→B→C→D→E), each with a 5s timeout. Explain timeout budgets, deadline propagation, and why the timeout must shrink with depth (deeper hops get shorter timeouts).`,
    a: `**Summary:** A **timeout budget** is the total time the client is willing to wait (e.g. 5s); every downstream hop must fit **inside** that budget — it is not 5s per hop. **Deadline propagation**: the request carries a "due time" (an absolute deadline or the remaining time) in a header; each service subtracts what it has already spent and passes it on, and stops immediately once the deadline passes. Deeper hops get shorter timeouts so that: (1) time is left for retries and processing at the upper layers, (2) upstream resources are not held for nothing, (3) the chain fails fast before the client has already walked away.

### Quick intuition
You order a pizza and say "if it is not here in 30 minutes I cancel". The shop spends 10 minutes baking, leaving 20 minutes for the driver. If the driver thinks "I have a full 30 minutes", the pizza arrives after the customer cancelled and the effort is wasted. Deadline propagation is **writing the expiry time on the pizza box** so whoever holds the box knows how much time is left; when it runs out, stop chasing the order. The farther from the customer (the driver), the less time there is, because the earlier steps already consumed most of it.

### Glossary
- **Timeout budget**: the total maximum time for the whole request from the client's point of view.
- **Deadline**: the absolute moment after which the result no longer has value.
- **Deadline propagation**: passing the deadline/remaining time down to every downstream hop.
- **Hop**: one call from one service to another.
- **Zombie request**: a request the client abandoned but the downstream is still processing.
- **grpc-timeout**: the standard gRPC header carrying the remaining time; gRPC checks and propagates it through the Context automatically.
- **Safety margin**: time reserved for the network, serialization and response handling.
- **Clock skew**: the clocks of different machines drifting apart, which makes absolute deadlines wrong.

### The problem: a fixed 5s timeout for every hop
1. Client timeout 5s; A→B→C→D→E each 5s, so the worst case is A waiting roughly 5s × (number of hops) if every hop runs close to its limit. Why that is nonsense: the client left at second 5.
2. Add 3 retries at B: B alone can take 15s while the client timed out long ago.
3. No deadline propagation: D does not know the client left, so it keeps working and returns the result to... nobody. CPU, connections and DB are burned on zombie requests.

~~~text
No propagation:    client 5s ──► A(5s) ──► B(5s, retry×3) ──► C ──► D ──► E
                   t=5s client gave up;  t=20s E is still querying the DB (zombie)
With propagation:  client deadline=5s ─► A 4.8s left ─► B 4.3s ─► C 3.5s
                   ─► D 2.6s ─► E 1.5s;  wherever it expires, the chain stops there
~~~

### Deadline propagation (step by step)
1. **The edge sets the deadline**: the gateway writes the remaining time into a header, e.g. {{x-request-timeout-ms: 4800}} (you choose the header name), or gRPC uses {{grpc-timeout}}.
2. **Each service reads the header when the request arrives** and computes {{deadline = now + remaining}} on its own clock. Why remaining time instead of an absolute timestamp: it avoids clock skew between machines.
3. **Before calling downstream**, compute the remaining time again and subtract the safety margin; if nothing is left, return 504 immediately.
4. **Use the remaining time as the timeout** for the downstream call and pass it on in the header.

~~~java
long remaining = deadline - System.currentTimeMillis() - 100;   // keep a 100ms margin
if (remaining <= 0) {
    return ResponseEntity.status(504).build();   // budget exhausted: fail fast, do not call further
}
// attach the header + timeout to the downstream call
headers.set("x-request-timeout-ms", String.valueOf(remaining));
~~~
- **Spring** has no built-in deadline propagation over HTTP: write a filter that reads the header and stores the deadline in the request context (ThreadLocal/MDC, or the Reactor Context with WebFlux), then a {{ClientHttpRequestInterceptor}} (RestClient/RestTemplate) or an {{ExchangeFilterFunction}} (WebClient) attaches the header and sets the timeout on outgoing calls.
- **gRPC**: the deadline lives in the {{Context}} and is propagated automatically when you call further within the same context.
- **DB**: you can set the query timeout from the remaining time (JDBC {{Statement.setQueryTimeout}}, PostgreSQL {{statement_timeout}}).

### Timeouts shrink with depth
| Hop | Service | Example timeout | Why |
|---|---|---|---|
| 1 (edge) | API Gateway / BFF | 4.5s | closest to the client, leaves time to return the response |
| 2 | Orchestration / API composition | 3.5s | needs time to aggregate, calls run in parallel |
| 3 | Core domain (Order, Payment) | 2.5s | main logic, local DB |
| 4 | Infrastructure (cache, queue) | 1.5s | fast path, little logic |
| 5 (leaf) | External / legacy | 1.0s | not under your control, fail fast |

- The table is only an example. **The principle**: timeout of hop i < timeout of hop i-1 minus local processing time and (number of retries × timeout per retry). The real numbers come from the measured p99 latency of each hop.
- **Retry budget**: reserve only about 10–20% of the budget for retries and retry at **one** layer only; retrying at every layer multiplies (3 layers × 3 retries = 27 calls to the leaf).

### Common mistakes
1. **Not propagating the deadline**. Symptom: zombie requests; downstream metrics say "success" while the client sees a timeout. Fix: a remaining-time header + a check before every call.
2. **Deeper hops with longer timeouts than shallower ones**. Symptom: one slow leaf drains the upstream thread pool. Fix: tapered timeouts based on p99.
3. **Using an absolute timestamp across machines with skewed clocks**. Symptom: requests are considered expired the moment they arrive. Fix: pass remaining time, or sync NTP tightly.
4. **Forgetting async**. Symptom: a Kafka message is processed 10 minutes later for a request the user already cancelled. Fix: put an expiry (expires-at) on the message and let the consumer skip expired ones when the business allows it.

### One-minute spoken answer
"The timeout budget is the total time the client accepts, say 5 seconds, and every hop must fit inside it instead of each hop getting its own 5 seconds. I use deadline propagation: the gateway puts the remaining time in a header, each service computes its own deadline from its clock, subtracts a margin and uses what is left as the timeout for the next call; when it expires it returns 504 immediately. gRPC does this with grpc-timeout; for Spring HTTP I write the filter and interceptor myself. Deeper hops get shorter timeouts to leave room for retries and upper-layer processing, and I only retry at one layer. The biggest win is no more zombie requests consuming resources after the client left."

> Senior tip: measure **budget consumption** by percentile (p50, p95, p99) at every hop. If p99 at hop 3 already eats 80% of the budget, you must optimize hop 3 or cut the share given to hops 1–2. Without that metric you are searching in the dark.`,
    follow: [`How is deadline propagation handled over Kafka (async)?`, `When do you prefer an absolute deadline timestamp over remaining time?`, `A leaf service (external API) has a short timeout and fails often — where do you retry it?`]
  },
  'microservices-026': {
    q: `One slow downstream (payment) jams the upstream's (order) thread pool, and other requests (catalog, user) queue behind it. You apply the Bulkhead pattern: thread-pool isolation vs semaphore isolation, and how do you configure it?`,
    a: `**Summary:** **Bulkhead** splits resources (threads, permits) into separate compartments per dependency, so one slow downstream only drains **its own compartment** instead of sinking the whole service. **Thread pool isolation**: each dependency gets its own pool + queue, the caller is not blocked, fits blocking code; the price is threads and context switches. **Semaphore isolation**: only counts concurrent calls, no real queue, very lightweight, fits reactive/non-blocking and virtual threads. Size it with **Little's Law**: concurrency ≈ throughput × latency.

### Quick intuition
A ship has **watertight bulkheads**: if one compartment is breached, water fills only that one and the ship stays afloat. In a restaurant, if all 20 waiters stand around waiting for the grill (the kitchen is slow), customers asking for water or salad get nobody's attention. A bulkhead is the rule: **at most 5 waiters may queue at the grill**; the 6th must tell the customer "the grill is slow, please pick something else", while the other 15 waiters keep serving other tables.

### Glossary
- **Bulkhead**: a per-dependency resource limit that isolates failures.
- **Thread pool bulkhead**: the call runs on a dedicated thread pool (core/max/queue) and returns a CompletableFuture.
- **Semaphore bulkhead**: limits concurrent calls with permits; the call runs on the caller's thread.
- **BulkheadFullException**: the Resilience4j exception thrown when there is no room.
- **Little's Law**: the number of requests being processed = arrival rate × processing time.
- **Context switch**: the CPU switching between threads, which costs when there are too many threads.
- **Virtual threads (Java 21)**: lightweight threads managed by the JVM; blocking I/O does not hold an OS thread.

### Why a bulkhead is needed (the incident, step by step)
1. The order service shares Tomcat's pool of 200 threads to call Payment, Catalog and User.
2. Payment is slow (a 30s DB lock): every request that calls Payment holds a thread for the entire wait.
3. After a few seconds all 200 threads are stuck at Payment; Catalog and User requests queue and then time out. Why: they have no thread to run on, even though Catalog is perfectly healthy.
4. With a bulkhead: Payment allows at most 25 concurrent calls; call number 26 is rejected immediately and runs a fallback; the other 175 threads keep serving Catalog/User.

~~~text
No bulkhead:  [200 threads] ──► slow Payment: 200/200 stuck → the whole service is dead
Bulkhead:     Payment ≤ 25 │ Catalog ≤ 50 │ User ≤ 50 │ the rest for other work
              slow Payment: 25 stuck, call #26 → BulkheadFullException → fallback
~~~

### Thread pool isolation (Resilience4j)
~~~yaml
resilience4j:
  thread-pool-bulkhead:              # a different key from the semaphore bulkhead
    instances:
      paymentApi:
        coreThreadPoolSize: 10
        maxThreadPoolSize: 25
        queueCapacity: 50            # requests waiting when the pool is full
        keepAliveDuration: 60s
~~~
1. Annotate with {{@Bulkhead(name = "paymentApi", type = Bulkhead.Type.THREADPOOL)}}; the method **must return** {{CompletableFuture}}/{{CompletionStage}} because the call runs asynchronously on the dedicated pool.
2. When the pool is full and the queue is full it throws {{BulkheadFullException}}.
3. Pros: the queue absorbs short spikes and the caller's thread is not blocked; combine with {{@TimeLimiter}} to cut calls that take too long. Note there is no separate setting for how long a request may wait in the queue, so keep the queue short.
4. Cons: extra threads (each platform thread costs about 1MB of stack), context switches, and you must tune core/max/queue.

### Semaphore isolation (Resilience4j default)
~~~yaml
resilience4j:
  bulkhead:
    instances:
      paymentApi:
        maxConcurrentCalls: 25       # number of permits
        maxWaitDuration: 0           # default 0: no permit means reject immediately
      catalogApi:
        maxConcurrentCalls: 50
~~~
1. {{@Bulkhead(name = "paymentApi")}} (default type SEMAPHORE): the caller's thread takes a permit, makes the call, returns the permit.
2. Pros: almost zero overhead; fits WebClient, R2DBC and **virtual threads** (Java 21), because there threads are cheap but the downstream resource is still finite.
3. Cons: when permits run out the caller waits at most {{maxWaitDuration}} and then gets {{BulkheadFullException}}; the caller must have a fallback.

### Which one to choose
| Condition | Pick |
|---|---|
| Blocking I/O on platform threads, want the caller not to be stuck | **Thread pool** |
| Non-blocking (WebClient, R2DBC) or virtual threads | **Semaphore** |
| Need a queue to absorb short spikes | **Thread pool** |
| Very low latency, high throughput | **Semaphore** |

### Sizing with Little's Law
~~~text
Concurrency = Throughput (req/s) × Latency (s)
Payment: 100 req/s × 0.8s (p99, conservative) = 80  → set 100 (~25% headroom)
Catalog: 500 req/s × 0.05s (p99)                     = 25  → set 35
~~~
- Little's Law uses **average** latency; use p99 to leave a safe headroom.
- The sum of the bulkheads should be smaller than the server's worker thread count (Tomcat defaults to 200), so there are always threads left for other work and for health checks.

### Common mistakes
1. **One shared bulkhead for every dependency**. Symptom: a slow Payment still causes Catalog to be rejected. Fix: one instance per dependency.
2. **A bulkhead without a timeout**. Symptom: 25 permits are held forever by hung calls and Payment is rejected 100% of the time. Fix: HTTP client timeout / TimeLimiter + circuit breaker.
3. **A thread pool queue that is too long**. Symptom: requests wait in the queue longer than the client's timeout and are processed after the client left. Fix: a short queue, fail fast.
4. **No fallback for BulkheadFullException**. Symptom: users see a puzzling 500 error. Fix: return 503 + Retry-After, or degraded data.

### One-minute spoken answer
"A bulkhead gives every dependency its own compartment of resources so a slow Payment only drains Payment's compartment instead of eating all 200 Tomcat threads. Resilience4j has two kinds: the thread pool bulkhead runs the call on its own pool with a queue and the method returns a CompletableFuture, which fits blocking code; the semaphore bulkhead only limits concurrent calls, is very light, and fits WebClient or virtual threads. I size it with Little's Law, throughput times p99 latency plus a headroom, and I always pair it with a timeout, a circuit breaker and a fallback for BulkheadFullException. In my experience you should watch the free permits per dependency and re-tune periodically."

> Senior tip: bulkhead configuration is **not set once, forget forever**. Keep a dashboard of {{resilience4j.bulkhead.available.concurrent.calls}} against {{resilience4j.bulkhead.max.allowed.concurrent.calls}} per dependency. If free permits are usually below 10%, raise the limit or optimize the downstream; if they are always near the maximum, you are over-provisioning.`,
    follow: [`With queueCapacity on the thread pool bulkhead, do requests that wait too long in the queue time out?`, `When the semaphore bulkhead rejects a request because it is full, how do you fall back gracefully?`, `Does the bulkhead combine with the circuit breaker — are permits released when the breaker opens?`]
  },
  'microservices-027': {
    q: `A 15-service system where the team complains "any change forces deploying 5 services at once", and latency is high because of repeated HTTP calls. What are the signs of a wrongly split bounded context (chatty services, distributed monolith), and how do you merge or split again?`,
    a: `**Summary:** **Chatty services** need many network calls for one simple business operation; a **distributed monolith** is services that are separate in deployment but still tightly coupled in logic (shared DB, chains of sync calls, must deploy together). Symptoms: one use case fans out to more than 3 services, a shared DB, cyclic dependencies, teams that must align their release schedule. The fix: **merge** services that always change together, **split** services that contain several bounded contexts, and use API composition/CQRS for cross-service queries instead of repeated calls.

### Quick intuition
A company is split into 15 departments, but approving a single purchase of pens needs 5 signatures and all 5 departments must meet on the same day. That is not "delegation", that is **one big department chopped up badly**. The fix: departments that always do the same job get merged back into one; a department holding two unrelated jobs gets split; and whoever needs a combined report keeps a **shared summary table** instead of asking every department each time.

### Glossary
- **Bounded context**: a business area with its own model and language; it should be the boundary of a service.
- **Chatty service**: a service that has to call back and forth many times to complete one task.
- **Distributed monolith**: many services, but coupled like a monolith — you lose the benefits of both.
- **Fan-out**: one request triggers many parallel/sequential calls to other services.
- **Cyclic dependency**: A calls B, B calls C, and C calls A again.
- **Business capability**: a complete business ability (Ordering, Billing), as opposed to "one data table".
- **Nanoservice**: a service that is too small (one function, one verb); its operational cost exceeds its value.
- **Change coupling**: services that are always modified in the same commit/PR, measurable from git history.

### Signs of a bad split
| Smell | Symptoms | Root cause |
|---|---|---|
| **Chatty** | 1 client request → 10+ internal calls, p99 above 2s | boundary too thin, missing an aggregate API |
| **Distributed monolith** | must deploy 5 services together, rolling back 1 drags 4 along | shared DB, chains of sync calls, cyclic dependencies |
| **Data coupling** | 3 services read/write the {{customer}} table | no owner defined for the data |
| **Temporal coupling** | A must wait for B to finish before running | sync calls instead of events |
| **Team friction** | team X blocks team Y's release because they share code/models | no clear bounded context |

~~~text
Example "view order details" (chatty):
client → Order → OrderItem → Product → Price → Discount → Customer
latency = 6 hops × ~80ms ≈ 480ms (sequential); 1 failed hop = the whole request fails
After merging Order + OrderItem + Discount into Ordering:
client → Ordering → (Product, Customer in parallel) ≈ 160ms
~~~

### Diagnosis (step by step)
1. **Draw the dependency graph from tracing**: node = service, edge = call (sync/async), thickness = calls per request. Why from traces: documentation is usually stale; a trace is what is actually running.
2. **Look for cycles**: A→B→C→A is almost certainly a distributed monolith.
3. **Look for high fan-out**: a service that calls many places per request is a candidate for merging or needs a BFF/API composition.
4. **Look for a shared DB**: a "hidden" edge, detected through DB users, connection metrics or audit logs.
5. **Measure change coupling from git**: two services always modified in the same PR are a sign they belong to one context.

### Merge/split strategy
1. **Merge when**: two services always deploy together, share a DB and call each other synchronously all the time; the coupling is **functional** (the same bounded context). Example: {{Order}} + {{OrderItem}} + {{OrderHistory}} → one Ordering service. Merge by moving the code into one repo/artifact, keeping separate modules inside (modular) and merging the schema gradually.
2. **Split when**: a service holds 2+ bounded contexts (e.g. {{UserService}} handles both authentication and profile), the scale profiles differ (payment needs high availability, catalog can tolerate an outage), or different teams own it.
3. **Turn sync into async** for steps that do not need an immediate result (sending email, updating statistics), to reduce temporal coupling.
4. **Work in small steps**, each with before/after metrics (latency, number of services that must be deployed per feature).

### Cross-service queries: never join databases
- **API composition (BFF/gateway)**: merge responses at the edge, call in parallel; fits few reads and acceptable latency.
- **CQRS read model**: build a table/Elasticsearch from events; very fast queries, fits heavy reads, but more complex.
- **Data lake/OLAP**: for reporting and analytics; not on the transactional path.

### Common mistakes
1. **Splitting by entity/CRUD** (UserService, ProductService that just wrap a table). Symptom: every business operation calls across services, chatty. Fix: split by business capability.
2. **Splitting too finely (nanoservice)**. Symptom: one service per verb, 15 services for one business flow. Fix: one service owns a whole process and its data.
3. **Being afraid to merge because "that goes against microservices"**. Symptom: keeping a painful architecture. Fix: treat merging as normal; the goal is independent deployment, not a service count.
4. **Fixing it with caches everywhere**. Symptom: latency drops but the data is stale and the bugs are baffling. Fix: fix the boundaries first, cache later.

### One-minute spoken answer
"When every change requires deploying 5 services, that is a distributed monolith: separate in deployment but coupled in logic. I diagnose it with the dependency graph from tracing, looking for cycles, high fan-out, a shared DB, and I measure change coupling from git: services always modified in the same PR belong to one bounded context. Those services I merge into one modular service, for example Order, OrderItem and OrderHistory into Ordering, and a service holding two contexts gets split. For cross-service queries I use API composition with parallel calls or a CQRS read model, never a DB join. The trade-off is migration work, so I go step by step and measure latency and the number of services each feature must deploy."

> Senior tip: do not split services by **entity/CRUD** (UserService, ProductService that only wrap a table); split by **business capability / subdomain** (Ordering, Fulfillment, Billing), where each service owns a whole process and its data. Entity services lead to chatty calls; splitting until every use case gets its own service leads to nanoservices.`,
    follow: [`How do you detect a shared DB in production when there is no documentation?`, `When merging 2 services, how do you migrate the data with zero downtime?`, `For a cyclic dependency A→B→C→A, where do you cut first?`]
  },
  'microservices-028': {
    q: `The dashboard must show orders + customers + payments + inventory, with the data spread across 4 services. Compare API Composition, CQRS Read Model and Data Lake. When do you pick which, and what are the trade-offs of latency vs consistency vs effort?`,
    a: `**Summary:** **API composition** (BFF/gateway) merges responses at runtime: simple, the freshest data from each service, latency ≈ the slowest call if calls run in parallel (≈ the sum if sequential). **CQRS read model** maintains a flat table/view built from events: very fast queries, but it costs effort to build the projection and it lags (eventual consistency). **Data lake/OLAP** is for analytics and reporting, not for the transactional path. Choose by read/write ratio, latency SLA, tolerance for stale data and team capacity.

### Quick intuition
You need a report combining information from 4 departments. **API composition** is **phoning the 4 departments every time the boss asks**: freshest numbers, but you wait for any busy department and the report is incomplete if one is closed. **CQRS read model** is **a secretary keeping a summary sheet**, updated whenever a department changes something: the boss asks and gets it immediately, though it may be a few seconds behind reality. **Data lake** is the **archive of end-of-day records**: perfect for analyzing a whole year of trends, useless for "has this order been paid yet".

### Glossary
- **API composition**: one component calls many services and merges the results.
- **BFF**: a backend for one specific frontend, usually where API composition lives.
- **Read model / materialized view**: a flat table built ahead of time for reading.
- **Projection**: a consumer that listens to events and updates the read model.
- **Projection lag**: the delay between an event happening and the read model being updated.
- **Partial response**: returning data with a missing part (clearly marked) when one source fails.
- **Data lake / OLAP**: a large data store for analytics (e.g. Iceberg/Delta Lake + Trino), optimized for scans over many rows.
- **Schema-on-read**: data is stored raw and the structure is applied when reading.

### Comparing the three
| Criterion | API Composition | CQRS Read Model | Data Lake / OLAP |
|---|---|---|---|
| **Latency** | 50–500ms (the slowest call) | very fast (5–20ms, one row) | minutes–hours (batch) or seconds (streaming) |
| **Consistency** | near real-time, but not a consistent snapshot across services | eventual (per projection lag) | eventual (per load cycle) |
| **Build effort** | low | high (projection, replay, schema) | medium (pipeline, modeling) |
| **Ops effort** | low | high (lag monitoring, rebuild) | medium |
| **Fit** | internal dashboards, not many reads | customer-facing dashboards, reads dozens of times the writes | reporting, BI, ML training |
| **Schema changes** | easy (change the aggregator) | hard (migrate the view, replay) | easy (schema-on-read) |

### API composition (step by step)
1. **Call independent services in parallel**, each with its own timeout. Why: latency ≈ the slowest call instead of the sum.
2. **Handle partial failure**: if one source fails, return a partial response (e.g. hide the inventory block, show "no data right now") instead of failing the whole page.
3. **Cache briefly** (10–60s) for parts that change rarely, like customer information.

~~~java
@GetMapping("/dashboard/orders/{id}")
public OrderDashboardDto dashboard(@PathVariable String id) {
    Order order = orderClient.get(id);                                   // needed first to know customerId
    var customer  = CompletableFuture.supplyAsync(() -> customerClient.get(order.customerId()), pool);
    var payment   = CompletableFuture.supplyAsync(() -> paymentClient.byOrder(id), pool);
    var inventory = CompletableFuture.supplyAsync(() -> inventoryClient.reserved(id), pool)
        .completeOnTimeout(Inventory.unknown(), 300, TimeUnit.MILLISECONDS);  // error/slow → partial
    return new OrderDashboardDto(order, customer.join(), payment.join(), inventory.join());
}
~~~
~~~text
Sequential: 50 + 30 + 40 + 30 = 150ms     Parallel: 50 + max(30, 40, 30) = 90ms
~~~

### CQRS read model (step by step)
1. Each service publishes events through its outbox: {{OrderPlaced}}, {{PaymentCaptured}}, {{StockReserved}}, {{CustomerUpdated}}.
2. The projection service listens to the topics and updates the {{order_dashboard_view}} table (upsert by order_id, ignoring events older than the current version). Why check versions: events from different topics can arrive out of order.
3. Query: {{SELECT * FROM order_dashboard_view WHERE order_id = ?}}: one row, no joins.
4. **Monitor projection lag** (event time → view updated) and alert when it exceeds a threshold (e.g. 5s).
5. **Have a rebuild tool**: replay from the start of the topic or from a checkpoint when the view schema changes or you detect drift.

### When to pick which
- Few reads (under roughly 10 per write), a latency budget above 200ms, a small team → **API composition**.
- Many reads (dozens per write), latency under 50ms, a team ready to invest in projections → **CQRS read model**.
- Historical analysis, ad-hoc queries, no real-time need → **Data lake** (Iceberg/Delta Lake + Trino/StarRocks).
- **Combine**: API composition for the detail screen, CQRS for the high-traffic dashboard, data lake for BI.

### Common mistakes
1. **Sequential calls in the composition**. Symptom: latency equals the sum of the calls. Fix: call every independent service in parallel.
2. **One failing service breaks the whole dashboard**. Symptom: a blank page when only inventory is slow. Fix: timeout + partial response.
3. **A projection that is not idempotent and checks no version**. Symptom: the view shows an old state overwriting a newer one. Fix: upsert by version/event time.
4. **Using a data lake for a real-time screen**. Symptom: numbers hours behind, customers complain. Fix: a data lake is for reporting only.

### One-minute spoken answer
"I have three options. API composition calls the four services in parallel and merges the results: easy to build, fresh data, latency equals the slowest call, and it needs timeouts plus partial responses when a source fails. A CQRS read model keeps a flat table built from the four services' events: a single-row query is very fast, but it takes work to build the projection, handle out-of-order events and monitor lag. A data lake is only for reporting and analytics. I start with API composition plus cache and only move to a read model when metrics show latency or read load breaking the SLA. In my experience, building CQRS too early is expensive technical debt."

> Senior tip: do not build a CQRS view for everything; start with API composition + cache. Only add a projection when a metric proves it is needed (p99 reads above the SLA, read traffic draining the source service's CPU). Over-engineering CQRS is one of the most expensive debts in microservices.`,
    follow: [`In API Composition, how does partial failure (one service down) fall back?`, `Which metric do you use to monitor CQRS projection lag, and what is the alert threshold?`, `Can a Data Lake power a real-time dashboard — why or why not?`]
  },
  'microservices-029': {
    q: `A topic has 12 partitions but the team expects every event of a single order to keep the right order. How do you choose the key and the number of partitions, and what is Kafka's ordering guarantee?`,
    a: `**Summary:** Kafka only guarantees ordering **within one partition**. Use {{orderId}} as the key so all events of one order land in the same partition, and the consumer must process sequentially per partition (or per key). Choose the partition count based on how much parallelism you need and leave headroom from the start, because **increasing partitions changes the key → partition mapping** and breaks ordering for keys that have events in flight.

### Quick intuition
A post office has 12 counters (partitions). The rule: all parcels for the same customer (key) always go to the **same counter**, so the letter sent first is handled first. Between different counters nobody guarantees which finishes first. If the post office opens counter number 13, the splitting formula changes: a new parcel for customer A may go to another counter while A's older parcel is still queued at the old one — and the order is flipped.

### Glossary
- **Partition key**: the value the producer attaches to a record to decide the partition.
- **Partitioner**: the producer component that computes the partition from the key (by default it hashes with murmur2 and takes the remainder over the partition count).
- **Total order**: a global order over all messages; Kafka does not provide one across partitions.
- **Hot partition / hot key**: a partition (or key) that receives most of the traffic and becomes a bottleneck.
- **Aggregate**: the business unit that must stay consistent (one order, one account).
- **Idempotent producer**: a producer that attaches sequence numbers so the broker drops duplicates and preserves order during retries.
- **Consumer lag per partition**: how far behind each partition is, which helps spot a hot partition.

### From key to ordering (step by step)
1. **The producer hashes the key**: {{partition = toPositive(murmur2(keyBytes)) % numPartitions}}. Why: the same key always yields the same partition, as long as the partition count does not change.
2. **The broker appends** the record to the end of that partition's log and assigns increasing offsets.
3. **The consumer reads by increasing offset**; within a group each partition belongs to exactly one consumer, so order-42's events are seen in the order they were written.
4. **The producer keeps ordering across retries**: enable idempotence (on by default since Kafka 3.0) with {{acks=all}} and {{max.in.flight.requests.per.connection}} of at most 5. Why: without idempotence, batch 1 failing and being retried can land after batch 2.

~~~text
12 partitions, key = orderId
order-42: Created → Paid → Shipped   (all in partition 7, offsets 100, 101, 102)
order-99: Created → Paid             (partition 2)
P7 and P2 are processed in parallel, NO ordering between the two partitions
~~~
A record without a key is spread by the sticky partitioner: load is even, but events of the same aggregate can sit in several partitions and be processed in parallel, flipping the order.

### Choosing the key and partition count
1. **Key = the unit that must be serialized**: {{orderId}} for the order lifecycle, {{accountId}} for account balances. Avoid time-based or constant keys because they create hot partitions.
2. **Partition = the maximum unit of parallelism** in one consumer group. 12 partitions allow up to 12 consumers actually working; but if most traffic lands on one key, a single consumer still carries it.
3. **Estimate**: partitions ≥ target throughput / throughput of one consumer, plus headroom for 1–2 years of growth (e.g. if you need 6, create 12–24).
4. **Changing the partition count requires a plan**: create a new topic with the new count, switch the producers, let consumers drain the old topic before reading the new one; or pause the producers until the lag reaches 0 and only then add partitions. Do not assume adding partitions is "transparent".

### Keeping order on the consumer side
- Process **sequentially within a partition**; if you want internal parallelism, parallelize **per key** (one queue per key) and commit an offset only when every earlier record has completed.
- Non-blocking retries (pushing to a retry topic) **break ordering**: a later event of the same key runs before the retried one. Events that need ordering must use blocking retries, or the consumer must check versions (ignore events older than the current state).

### Common mistakes
1. **Processing asynchronously and then committing an offset above a record that is not finished**. Symptom: the broker delivers in the right order but the business effect is flipped, or records are lost on crash. Fix: track completion by offset and only commit a contiguous run of finished offsets.
2. **Several producers sending events for one key without coordination**. Symptom: the order in the log differs from the business order. Fix: one event source per aggregate (the outbox of the owning service).
3. **Adding partitions while running**. Symptom: sporadic ordering errors that are hard to reproduce. Fix: leave headroom from the start and migrate on a plan.
4. **A hot key** (one merchant taking 30% of the traffic). Symptom: one partition's lag keeps growing while the others are idle. Fix: optimize handling of that key, or split the key if the business only needs ordering on a smaller unit (e.g. merchantId + orderId).

### One-minute spoken answer
"Kafka only orders records within a partition, so I use orderId as the key: the partitioner hashes the key, so every event of one order lands in the same partition and the consumer reads by increasing offset. The producer enables idempotence with acks=all so retries do not flip the order. On the consumer side I process sequentially per partition or in parallel per key, and I only commit offsets that are pending-free up to a contiguous point. I choose the partition count by throughput and leave headroom for growth, because adding partitions changes the key mapping and breaks ordering; if I must change it, I create a new topic and migrate on a plan. I also watch lag per partition to spot hot keys."

> Senior tip: measure the record distribution across partitions before adding partitions. For payments, watch the hot key and lag per partition; increasing the total partition count does not fix a single merchant that dominates the load.`,
    follow: [`If one key consumes 30% of the traffic, how do you keep ordering while reducing the hot partition?`, `How does adding partitions while running affect consumers and ordering?`]
  },
});
