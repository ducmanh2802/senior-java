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
    q: 'A system needs to run background jobs (sending emails, resizing images, synchronizing with partners). How do you compare DB table queues, Redis Streams, message brokers (RabbitMQ/SQS), and Kafka, and when do you choose which?',
    a: `**Summary:** Choose based on 4 questions: must the job be written in the **same transaction** as the business data, do you need **ack/retry/delay per job**, what is the **throughput**, and do you need **replay / multiple consumers**? A DB table wins on consistency and simplicity; Redis Streams wins on latency but has weaker durability; RabbitMQ/SQS are standard work queues; Kafka fits event streams more than job queues.

### 1. DB table (SELECT ... FOR UPDATE SKIP LOCKED)
- Mechanism: a job is a row; workers claim it using {{FOR UPDATE SKIP LOCKED}} so multiple workers do not pick the same job; a lease + reaper reclaims stuck jobs.
- Biggest strength: **INSERT the job in the same transaction** as the business data. If the order commits, the email job is guaranteed to exist; if it rolls back, the job disappears too. No dual-write.
- Queryable: "which jobs failed for tenant X this week" is just a SQL query.
- Limitations: each job involves multiple UPDATEs; workers polling continuously create load on the main DB. Usually enough for tens to a few hundred jobs/s; measure beyond that. PostgreSQL can bloat from frequent UPDATE/DELETE, so good autovacuum or partitioning by day is needed. {{LISTEN/NOTIFY}} can wake workers instead of aggressive polling.

### 2. Redis Streams
- Mechanism: {{XADD jobs * ...}} adds a job; a consumer group reads with {{XREADGROUP}}; each delivered message stays in the **PEL (pending entries list)** until the worker {{XACK}}s it. If a worker dies, another worker uses {{XAUTOCLAIM}} to take back messages pending too long; {{XPENDING}} shows delivery counts, useful to move poison messages out.
~~~text
XADD jobs * type email to a@x.com          -> 1730000000000-0
XREADGROUP GROUP workers w1 COUNT 10 BLOCK 5000 STREAMS jobs >
XACK jobs workers 1730000000000-0
XAUTOCLAIM jobs workers w2 60000 0-0 COUNT 10   -- reclaim jobs pending > 60s
~~~
- Strengths: low latency (milliseconds), high throughput, available if you already use Redis.
- Weaknesses: data lives in RAM; AOF with {{appendfsync everysec}} can lose about 1 second of writes; asynchronous replication means a failover can lose jobs that were already acknowledged as written. No built-in scheduled delay/retry; you must build it yourself (for example, a sorted set keyed by run time). The stream must be trimmed ({{MAXLEN}}) or it can fill RAM.

### 3. Message brokers: RabbitMQ, SQS
- **SQS**: receive a message and it becomes hidden for the **visibility timeout**; delete it when done, otherwise it becomes visible again for retry. After {{maxReceiveCount}} it moves to a DLQ (redrive policy). Delay up to 15 minutes, message retention up to 14 days. No infrastructure to operate.
- **RabbitMQ**: manual ack/nack, {{prefetch}} limits how many messages each worker holds, dead-letter exchange, TTL, priority; use a **quorum queue** to tolerate node loss.
- Strengths: true work-queue semantics: idle workers take work, ack each job, retry/DLQ are built in, workers scale freely.
- Weaknesses: not in the same transaction as the DB, so an outbox is needed if the job must stay perfectly in sync with business data; you cannot replay jobs that were already acked.

### 4. Kafka
- A good fit when a job is really a **reaction to an event** that already lives in Kafka, and you need multiple independent consumers and replay.
- A poor fit for long, uneven jobs: head-of-line blocking per partition, worker count limited by partitions, and retry/DLQ must be built with extra topics. Share groups (Kafka 4.x) improve this, but they are still new and do not preserve ordering.

### Comparison
| Criteria | DB table | Redis Streams | RabbitMQ / SQS | Kafka |
|---|---|---|---|---|
| Enqueue in the same DB transaction | **yes** | no | no (needs outbox) | no (needs outbox) |
| Per-job ack/retry | self-built, easy | PEL + XAUTOCLAIM | **built in** | no (consumer group) |
| Delay / scheduled run | **easy** ({{run_after}}) | self-built | yes (limited) | self-built |
| Durability | high (WAL) | medium | high (quorum queue / SQS) | high |
| Throughput | low–medium | high | medium–high | very high |
| Replay | query again | within MAXLEN limit | no | **yes** |
| Extra operations | none | Redis already there | medium / near 0 (SQS) | high |

### How to choose
1. The job must stay perfectly in sync with business data, tens of jobs/s: **DB table**. No extra infrastructure.
2. On AWS, independent jobs that need retry/DLQ/delay: **SQS**. If the job is produced from a DB transaction, use an outbox to push to SQS.
3. Need complex routing, priority, on-prem: **RabbitMQ**.
4. Need millisecond latency, can tolerate very small loss and jobs are idempotent, already have Redis: **Redis Streams**.
5. The job is a consequence of an event that multiple systems must consume, and you need replay: **Kafka**, possibly bridged to a queue for the heavy work.

### Production pitfalls
- Choosing Kafka for an "email queue" and then having to build retry topics, a DLT, and delay yourself: it costs many times more than SQS.
- Using a Redis List ({{LPUSH}}/{{BRPOP}}) as a queue: if a worker dies after popping, the job is **lost** because there is no PEL. Streams, or a pattern with a processing list, are safe.
- Putting the DB queue in the same DB as business data while workers poll 100 times/s per pod: the DB burns CPU just to answer "no jobs".

> Senior tip: in every option the real semantics are **at-least-once**, so an idempotent handler is mandatory, not optional. Start with a DB table or SQS; move to something more complex only when metrics (job age, DB load, throughput) show it is needed, and record the reason with an ADR.`
  }
});
