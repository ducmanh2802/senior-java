/*
 * English translation of js/data/q-system-design.js — task T386. Format: js/core/i18n.js (content overlay).
 * ids: design-028 design-029
 */
App.i18n.content({
  'design-028': {
    q: 'An API for report generation takes 2–5 minutes to run synchronously: the load balancer cuts off at 60 seconds, users click again causing duplicate reports, and deployments mid-process cause work loss. How do you transition this to an async job: API contract, jobs table, worker job acquisition, lease/heartbeat, reaper, reporting results, and retry?',
    a: `**Summary:** Separate 'request acceptance' from 'work execution': the API writes a row to the **jobs** table and immediately returns **202 Accepted** with a status link; a worker claims the job using {{SELECT ... FOR UPDATE SKIP LOCKED}}, maintains the job with a **lease with heartbeat**, and a **reaper** reclaims jobs from dead workers. Clients monitor via a **status API** (or webhook), all steps are **idempotent**, and retries feature **exponential backoff + jitter**.

### Why synchronous fails
- Request holds a thread and an HTTP connection for 5 minutes; 200 concurrent users will exhaust the thread pool, affecting other APIs.
- Proxies, load balancers, and gateways have timeouts (usually 30–60 s): the server keeps running but the client receives 504 and clicks again, creating duplicate reports.
- Deployments or pod restarts kill in-progress requests, with no mechanism to resume.

### The new flow
~~~text
Client --POST /reports (Idempotency-Key: k1)--> API --INSERT jobs--> DB
       <-- 202 Accepted, Location: /jobs/123 ---
Worker --claim (SKIP LOCKED)--> DB; runs job; heartbeat every 30s; writes file to S3
Worker --UPDATE status=SUCCEEDED, result_url--> DB  (--> webhook if client subscribed)
Client --GET /jobs/123--> {status: RUNNING, progress: 40}  ... {status: SUCCEEDED, result_url}
~~~

### API Contract
- {{POST /reports}} with header {{Idempotency-Key}}: unique per {{(tenant_id, idempotency_key)}}. Duplicate clicks with the same key return the **same job**, not a new one.
- Returns **202 Accepted**, header {{Location: /jobs/123}}, body {{jobId}} and {{status}}. Optionally {{Retry-After: 5}} suggests poll interval.
- {{GET /jobs/123}}: {{status}}, {{progress}}, {{error}}, {{result_url}} (presigned URL, do not return file content via API).
- {{POST /jobs/123/cancel}}: sets a cancellation flag; worker checks flag at each checkpoint.

### Jobs table
~~~sql
CREATE TABLE jobs (
  id              BIGSERIAL PRIMARY KEY,
  tenant_id       BIGINT NOT NULL,
  idempotency_key TEXT   NOT NULL,
  type            TEXT   NOT NULL,
  payload         JSONB  NOT NULL,
  status          TEXT   NOT NULL,       -- QUEUED, RUNNING, SUCCEEDED, FAILED, CANCELLED
  attempts        INT    NOT NULL DEFAULT 0,
  max_attempts    INT    NOT NULL DEFAULT 5,
  run_after       TIMESTAMPTZ NOT NULL DEFAULT now(),
  lease_owner     TEXT,
  lease_until     TIMESTAMPTZ,
  progress        INT, result_url TEXT, last_error TEXT,
  UNIQUE (tenant_id, idempotency_key)
);
CREATE INDEX jobs_ready ON jobs (run_after) WHERE status = 'QUEUED';
~~~
Worker claims via a **short** transaction: select QUEUED with {{run_after <= now()}} using {{FOR UPDATE SKIP LOCKED}}, set to RUNNING, set {{lease_owner}}, {{lease_until = now() + 90s}}, increment {{attempts}}, commit. Do not hold transaction during the 5-minute job.

### Lease, heartbeat, and fencing
Lease means "this job belongs to worker W until time T". Worker renews periodically:
~~~java
// run every 30s while job is running; 90s lease = withstands 2 missed heartbeats
int n = jdbc.update("""
    UPDATE jobs SET lease_until = now() + interval '90 seconds', progress = ?
     WHERE id = ? AND lease_owner = ? AND attempts = ? AND status = 'RUNNING'
    """, progress, jobId, workerId, attempt);
if (n == 0) {          // lease was reclaimed by reaper and given to another worker
    cancelled.set(true); // stop immediately, do not write results
}
~~~
Condition {{lease_owner = ? AND attempts = ?}} is **fencing**: worker paused by GC for 3 minutes cannot overwrite results of a new run. Final write must have the same conditions. Use DB {{now()}}, not pod clock.

### Reaper and retry
A process runs every 30s (needs only one instance, e.g., using advisory lock):
- RUNNING job with {{lease_until < now()}}: if {{attempts < max_attempts}}, set to QUEUED with {{run_after = now() + backoff}}, otherwise FAILED.
- Backoff: {{min(cap, base × 2^attempts)}} + jitter. Jitter prevents 1,000 failed jobs from retrying at the same second.
- Error classification: transient (timeout, 5xx, deadlock) → retry; permanent (invalid data, 4xx) → FAILED.

### Reporting results
| Method | Pros | Cons |
|---|---|---|
| Polling status API | simple, universally supported | wastes requests; needs cache/ETag |
| Webhook | realtime, no polling | client needs public endpoint; needs HMAC, retry, client-side dedup |
| SSE/WebSocket | realtime for UI | connection overhead, proxy issues |

In practice: always have status API (source of truth), add webhook or SSE as optimization.

### Production Pitfalls
- Non-idempotent handler: retry creates two files, sends two emails. Write results to a fixed key ({{reports/123.xlsx}}) so re-runs overwrite.
- Graceful shutdown: on SIGTERM, stop claiming new jobs, wait for running job to checkpoint or return to QUEUED; otherwise, job only reclaimed after lease expires.
- Jobs table bloat (PostgreSQL bloat from frequent UPDATE): move SUCCEEDED jobs to archive table or partition by day, drop partition.
- Unlimited jobs per tenant: one tenant sends 10,000 jobs, exhausting workers. Implement quota and fair share claim per tenant.

> Senior tip: the most important metric is **the age of the oldest QUEUED job** and **number of reaper lease reclaims**. Frequent reaper reclaims usually mean heartbeat shares thread pool with heavy jobs and is delayed: move heartbeat to a separate thread, and set lease at least 3x heartbeat interval.`,
    follow: [
      'Worker paused by GC longer than lease and wakes up: what prevents it from overwriting results?',
      'When would you replace the jobs table with SQS or Temporal?',
      'How do you design webhook retry and HMAC signature to prevent client forgery and duplicates?'
    ]
  },
  'design-029': {
    q: 'Design a system for background jobs (sending emails, resizing images, synchronizing with partners). Compare DB-based queues, Redis Streams, message brokers (RabbitMQ/SQS), and Kafka, and when do you choose which?',
    a: `**Summary:** Choose based on 4 questions: does the job need to be recorded in the **same transaction** as business data? Does it need **ack/retry/delay per job**? What is the required **throughput**? And is **replay / multiple consumers** needed? DB-based queues excel in consistency and simplicity; Redis Streams excel in low latency but have weaker durability; RabbitMQ/SQS are standard work queues; Kafka is for event streams rather than job queues.

### 1. DB table (SELECT ... FOR UPDATE SKIP LOCKED)
- Mechanism: Each job is a row; worker claims using {{FOR UPDATE SKIP LOCKED}} so multiple workers don't take the same job; lease + reaper reclaims hung jobs.
- Biggest strength: **INSERT job within the same transaction** as business data. If the order commits, the email job definitely exists; if it rolls back, the job vanishes. No dual-write issues.
- Queryable: "Show me failed jobs for tenant X this week" is just a SQL query.
- Limitations: Each job involves multiple UPDATEs; polling creates load on the main DB. Usually sufficient for tens to hundreds of jobs/s; measure if higher. PostgreSQL suffers from bloat due to frequent UPDATE/DELETE, needs good autovacuum or partitioning by day. {{LISTEN/NOTIFY}} can wake up workers instead of thick polling.

### 2. Redis Streams
- Mechanism: {{XADD jobs * ...}} adds job; consumer group reads via {{XREADGROUP}}; each delivered message stays in **PEL (pending entries list)** until worker {{XACK}}. If worker dies, another uses {{XAUTOCLAIM}} to receive pending messages; {{XPENDING}} shows retry counts, used to push poison messages to DLQ.
- Strengths: Low latency (milliseconds), high throughput, ready if Redis is already used.
- Weaknesses: Data in RAM; AOF with {{appendfsync everysec}} can lose ~1s of commits; asynchronous replication means failover might lose already-acked jobs. No built-in delay/retry schedule; must build manually (e.g., sorted set by time). Stream must be truncated ({{MAXLEN}}) to avoid filling RAM.

### 3. Message broker: RabbitMQ, SQS
- **SQS**: message is hidden in **visibility timeout**; delete on success, otherwise becomes visible again for retry. After {{maxReceiveCount}}, moves to DLQ (redrive policy). Delay up to 15 mins, retention up to 14 days. No operational overhead.
- **RabbitMQ**: manual ack/nack, {{prefetch}} limits jobs held per worker, dead-letter exchange, TTL, priority; use **quorum queues** for node fault tolerance.
- Strengths: True work queue semantics: worker takes work when idle, acks per job, retry/DLQ built-in, free worker scaling.
- Weaknesses: Not in same transaction as DB, needs outbox for sync with business data; cannot replay already-acked jobs.

### 4. Kafka
- Best when jobs are essentially **reactions to an event** already in Kafka, requiring multiple independent consumers and replay.
- Not for long, uneven jobs: head-of-line blocking by partition, worker count limited by partitions, retry/DLQ must be built using sub-topics. Share groups (Kafka 4.x) improve this but are new and don't guarantee ordering.

### Comparison Table
| Criteria | DB Table | Redis Streams | RabbitMQ / SQS | Kafka |
|---|---|---|---|---|
| Enqueue in DB transaction | **Yes** | No | No (needs outbox) | No (needs outbox) |
| Ack/retry per job | self-built, easy | PEL + XAUTOCLAIM | **Native** | No (consumer group) |
| Delay / schedule | **Easy** ({{run_after}}) | self-built | Yes (limited) | self-built |
| Durability | High (WAL) | Medium | High (quorum / SQS) | High |
| Throughput | Low–Medium | High | Medium–High | Very High |
| Replay | query again | limited | No | **Yes** |
| OpEx | None | Redis ready | Medium / Near 0 (SQS) | High |

### How to choose
1. Job must match business data transactionally, tens of jobs/s: **DB Table**. No extra infra.
2. On AWS, independent jobs, needs retry/DLQ/delay: **SQS**. If job generated from DB transaction, use outbox to push to SQS.
3. Complex routing, priority, on-prem: **RabbitMQ**.
4. Low latency (ms), idempotent jobs, already using Redis: **Redis Streams**.
5. Job is an event reaction requiring replay and multiple consumers: **Kafka**, possibly bridged to a queue for heavy lifting.

### Production Pitfalls
- Choosing Kafka for "email queue" then writing custom retry topics, DLT, delay: costs much more than SQS.
- Using Redis List ({{LPUSH}}/{{BRPOP}}) as queue: worker death after pop means **job loss**, no PEL. Use Streams or patterns with processing lists.
- DB queue in main DB, worker polls 100 times/s per pod: DB wastes CPU returning "no jobs". Use LISTEN/NOTIFY or less aggressive polling.

> Senior tip: at every choice, the actual semantics are **at-least-once**, so an idempotent handler is mandatory, not optional. Start with DB table or SQS; only move to more complex things when metrics (job age, DB load, throughput) show it's needed, and document the reason with an ADR.`
  }
});
