
/*
 * English translation of js/data/q-devops.js — task T215. Format: js/core/i18n.js (content overlay).
 * ids: devops-018 devops-019 devops-020 devops-021 devops-022
 */
App.i18n.content({
  'devops-018': {
    q: 'HPA based on CPU does not react to an I/O-bound service. How do you bring custom metrics such as RPS, queue depth or Kafka lag into HPA? Present the metrics pipeline architecture, how to choose the metric, and traps when scaling a Java service.',
    a: `**Summary:** metrics-server only provides CPU/memory; to make HPA scale by RPS, queue depth or Kafka lag you must feed metrics into {{custom.metrics.k8s.io}} or {{external.metrics.k8s.io}} via Prometheus Adapter, or use KEDA. Choose a metric as close to real load as possible, but HPA is still a slow control loop: scrape, sync 15 s, then JVM startup time, so combine minReplicas and schedule-based scaling.

### Metrics pipeline architecture
~~~text
Pod /actuator/prometheus
        | scrape
   Prometheus ---> prometheus-adapter ---> custom.metrics.k8s.io
        |                                        |
        +------> KEDA (external metrics) --------+--> HPA --> Deployment
~~~
- {{metrics-server}} only serves {{metrics.k8s.io}} (CPU/RAM from kubelet), it does not read Prometheus.
- {{prometheus-adapter}} turns PromQL into a metric API. Map metric names, selectors and formulas.
- {{KEDA}} is strong with built-in scalers (Kafka, RabbitMQ, SQS, cron), supports scaling to zero; under the hood KEDA still creates HPA.

Example HPA by average RPS per Pod:
~~~yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: payment }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: payment }
  minReplicas: 4
  maxReplicas: 30
  metrics:
    - type: Pods
      pods:
        metric: { name: http_requests_per_second }
        target: { type: AverageValue, averageValue: "300" }
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies: [{ type: Percent, value: 100, periodSeconds: 30 }]
    scaleDown:
      stabilizationWindowSeconds: 600
      policies: [{ type: Pods, value: 1, periodSeconds: 60 }]
~~~
{{AverageValue}} means each Pod should serve an average of 300 RPS. If using {{External}} with {{AverageValue}}, HPA divides the total value by replica count; with {{Value}} it does not divide, suitable for metrics like "how many jobs are waiting".

### Formula and latency
~~~text
desired = ceil(currentReplicas * currentMetric / target)
example: 6 Pods * 450 RPS / 300 = 9 Pods
~~~
Each HPA loop includes: Prometheus scrape (10–30 s), adapter, HPA sync (default 15 s), scheduler, pull image, Spring Boot startup 30–90 s and JIT warm-up. From load spike to new Pods serving well can be 2–4 minutes.

### KEDA for Kafka consumers
KEDA has a built-in Kafka scaler: declare {{ScaledObject}} with {{lagThreshold}} and {{maxReplicaCount}}; under the hood it still creates HPA and can scale to zero. Set maxReplicaCount not exceeding partition count, scale down slowly to avoid rebalance storm, and only scale to zero for workers/batch because Java API startup is slow.

### Traps when scaling Java services
| Trap | Consequence | How to avoid |
|---|---|---|
| Count Pods not Ready | Smaller denominator, over-scale | Filter {{ready="true"}} in PromQL or use resource metric |
| Use latency as target | Delayed feedback loop, oscillation | Scale by RPS/concurrency/queue; latency only for alert |
| CPU during JIT/startup | New Pod counted as overload | startupProbe + correct readiness, skip initial phase |

Choose a metric close to real load: RPS/concurrency for I/O-bound APIs, queue depth or lag for consumers, CPU for compute-heavy services. Avoid memory because Java heap rarely returns after GC, and avoid latency because it is a lagging indicator, easily causing oscillation.

> Senior tip: Set minReplicas based on peak traffic divided by target per Pod, not average; and keep a manual override (kubectl scale) for emergencies when HPA is slow.
`,
    follow: [
      'Why does scaling a Kafka consumer beyond the partition count not increase throughput? How do you handle backlog?',
      'Is the RPS metric returned by the adapter total or average per Pod? How does HPA configuration differ?',
      'HPA scales to 20 Pods but p99 does not drop: which bottlenecks do you check?'
    ]
  },
  'devops-019': {
    q: 'For a core banking and payment system, which do you choose: rolling update, blue-green or canary? Compare cost, blast radius, rollback and data constraints; when do you use each strategy and who has authority to decide rollback?',
    a: `**Summary:** Rolling update is the default because it is cheap and simple but mixes two versions during deploy; blue-green switches all traffic to the new environment, rollback is instant but requires double resources; canary reduces blast radius by sending a portion of traffic through the new version, but needs traffic-splitting infrastructure and reliable metrics. For core banking, I use rolling for small changes, canary with automatic analysis for risky changes, and blue-green for large infrastructure or platform version changes.

### Comparison
| Criterion | Rolling | Blue-green | Canary |
|---|---|---|---|
| Spare resources | Low (surge 1–25%) | Nearly double | Low to moderate |
| Rollback | Rollout undo, tens of seconds | Switch selector/DNS, almost instant | Reduce weight to 0 |
| Blast radius | Entire if version is broken | 0 before cutover | Small, by percentage |
| Complexity | Low | Medium | High |
| Data requirements | Schema backward compatible | Same as rolling | Same as rolling + metrics |
| Best for | Stateless, small changes | Large releases, clean cutover needed | Risky changes, enough traffic |

### Rolling update
- Control with {{maxSurge}}, {{maxUnavailable}}, {{minReadySeconds}}, probes and graceful shutdown.
- Old and new versions run in parallel, so API, message schema and DB must be backward compatible.
- There is no "golden window" to compare two versions; if the new version is broken, some users are already affected before rollout stops.
- {{kubectl rollout undo}} reverts to the previous ReplicaSet; but if a DB migration has already run, rolling back the app can break things.

### Blue-green
- Two environments (blue/green) run in parallel, Service or Ingress points to only one side.
- Green is warmed up and smoke-tested first; cutover changes selector or weight to 100%.
- Rollback is just switching back the selector, very fast, but **does not** fix data already written by the new version.
- Cost: double Pods, double DB connection pool, double cache; verify the DB can handle it.
- DNS TTL and connection keep-alive make cutover not instantaneous for some clients; session must be externalized or stateless.

### Canary
- Send 1% → 5% → 25% → 50% → 100% traffic through the new version, and stop for analysis at each step.
- Tools: Argo Rollouts, Flagger, Istio/Gateway API weight, or ingress controllers with weighted routing.
- Auto-analysis based on Prometheus: 5xx error rate, p99, timeout rate, and business metrics like transaction success rate. Compare canary against baseline at the same time, not against yesterday.
- Need enough samples: 1% of 100 RPS is 1 RPS, not enough to detect rare errors.
- Cannot split traffic by percentage for Kafka consumers; use a separate consumer group, shadow topic, or run the new version on a subset of partitions.

### Data constraints are paramount
All three strategies require **expand-contract** when changing schema: add new column/table first, dual-write, backfill, switch reads, then drop the old column after a few releases. Canary cannot save a migration that breaks the old version. Do not let each Pod run its own migration; run migration as a separate step before deploy.

### Who decides rollback
- Before release, agree on **quantitative criteria**: 5xx errors above 1% in 5 minutes, p99 above 800 ms, payment success rate down more than 2%, or SLO burn rate alert.
- Release owner and SRE

> Senior tip: For core banking, never roll back DB with a simple script; always have a forward-fix migration ready. Use feature flags to disable risky paths instantly without redeploying.
`,
    follow: [
      'How is canary different for Kafka consumers vs APIs? How do you split traffic by partition?',
      'Blue-green doubles the DB connection pool: how do you calculate and configure the DB so it does not collapse?',
      'What does your automated rollback criteria include and what is the time window?'
    ]
  },
  'devops-020': {
    q: 'You build a CI/CD pipeline for a new Spring Boot service. Which stages should exist, which stage blocks merge, how to build once and promote the correct artifact through environments, and where to place DB migration in the pipeline?',
    a: `**Summary:** A good pipeline for a Java service must provide fast feedback at cheap steps, build the artifact **once** then promote the correct digest through environments, and block merge with mandatory checks. Do not rebuild for each environment, do not let each Pod run its own migration, and do not trade speed by skipping integration tests.

### Stages
| Stage | Target time | Blocks merge | Notes |
|---|---|---|---|
| Compile + checkstyle | Under 2 min | Yes | Fail fast, cache dependencies |
| Unit test | Under 5 min | Yes | Run in parallel, no real DB needed |
| Integration test | Under 10 min | Yes | Testcontainers for PostgreSQL/Kafka |
| SAST + dependency scan | Under 5 min | Yes for critical | SBOM, CVE, license |
| Build image + scan | Under 5 min | Yes | Once, tag by commit SHA |
| Deploy DEV/SIT | — | No | Automatic |
| E2E/smoke | — | Yes before PROD | Run on production-like environment |
| Deploy PROD | — | Yes with approval | Promote correct digest |

### Build once, promote many times
~~~text
commit abc123
   -> image registry/payment:abc123  (digest sha256:...)
   -> DEV  uses that digest
   -> SIT  uses exactly that digest
   -> PROD uses exactly that digest
~~~
If each environment rebuilds, you cannot prove the tested artifact is the production artifact. Tag by {{git SHA}} and record digest in the release log; enable immutable tags in the registry to prevent overwrites.

### Cache and speed
- Cache {{.m2}} directory by {{pom.xml}} hash; cache Docker layer with {{--mount=type=cache}}.
- Separate unit and integration jobs; unit runs on every push, integration on merge request to save runners.
- Use matrix/shard to split tests; set timeouts so a hung job does not hold a runner.

### Integration tests done right
Testcontainers starts real PostgreSQL/Kafka in CI, runs Flyway migration, then tests the repository. This catches SQL errors, data types, and transaction issues that mocks miss.
~~~java
@Testcontainers
class PaymentRepositoryTest {
    @Container
    static PostgreSQLContainer<?> db = new PostgreSQLContainer<>("postgres:15-alpine");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", db::getJdbcUrl);
        r.add("spring.datasource.username", db::getUsername);
        r.add("spring.datasource.password", db::getPassword);
    }
}
~~~
Do not use a shared staging database for all jobs: parallel tests will trample data and become flaky.

### Migration and deploy
- Run Flyway as a separate job/initContainer before rollout, do not let each Pod migrate. Flyway has a lock, but many Pods waiting increases startup time and makes observation hard.
- Migration must be backward compatible: old and new versions run together during rolling deploy.
- Pipeline stores {{flyway_schema_history}} or logs migration into the release artifact.
- Rollback app by deploying the old digest; rollback DB with a compensating migration or controlled restore, not {{flyway clean}}.

### Security and reproducibility
- Secrets from vault/OIDC with short lifetime, not in repo or image.
- Pin JDK (17 or 21), Maven/Gradle wrapper, plugin versions; enable {{maven-enforcer-plugin}} to block duplicate or unexpected dependencies.
- Image runs non-root, reads from read-only root where possible.

> Senior tip: Store the digest, not just the tag, in your deploy metadata. If a tag is overwritten, only the digest guarantees the exact bits.
`,
    follow: [
      'Which quality gates do you set for dependency scanning without making the pipeline slow and prone to false failures?',
      'How do you ensure the image running in prod is exactly the image tested in SIT?',
      'Should DB migration run before or after app deploy? Why?'
    ]
  },
  'devops-021': {
    q: 'Deploy with zero downtime but DB migration makes app rollback fail. How do you design expand-contract migration with Flyway, and how to roll back DB when Flyway Community has no undo?',
    a: `**Summary:** Flyway Community has no undo in production (undo is in Teams/Enterprise), and DB rollback is usually impossible because data has been written. The correct approach is expand-contract design: add new structure backward compatible, dual-write and backfill, switch reads, then drop old structure after a few releases. When rollback is needed, rolling back the app is enough; fix DB forward with a new migration, and restore a snapshot only when real data loss occurs.

### Why DB rollback is hard
- {{DROP COLUMN}}, {{RENAME}}, changing data type cannot recover lost data.
- In rolling deploy, old and new versions run **at the same time**; schema must serve both.
- Flyway marks migrations by checksum; editing an old file makes {{flyway validate}} fail. Do not modify a migration that has already run.
- Backup/PITR is the final safety net, not a daily rollback process: data written after the backup point is lost.

### Five expand-contract phases
| Phase | Action | App version |
|---|---|---|
| Expand | Add new column/table/index, allow NULL | Old app still runs |
| Dual-write | New app writes both old and new columns, reads old | New app |
| Backfill | Background job copies old data to new by batch | New app |
| Switch | App reads new column; keeps writing both | New app |
| Contract | Drop old column after no version reads it | After 1–2 releases |

~~~sql
-- V10: expand, only add, do not change old column
ALTER TABLE payment ADD COLUMN status_new varchar(20);
CREATE INDEX CONCURRENTLY idx_payment_status_new ON payment(status_new);

-- Backfill job runs outside Flyway, by batch and idempotent
UPDATE payment
SET status_new = status
WHERE status_new IS NULL
  AND id BETWEEN :from_id AND :to_id;
~~~
- {{CREATE INDEX CONCURRENTLY}} must not run inside a transaction. Flyway recognizes this (PostgreSQLParser) and runs that migration outside a transaction; if the old version did not do this, enforce with {{executeInTransaction=false}}. By default Flyway uses advisory locks of transactional type on PostgreSQL, easily causing hangs around such commands: set {{flyway.postgresql.transactional.lock=false}} to switch to session-level locks.
- Backfill in batches of 1,000–10,000 rows, rest between batches, monitor replication lag and lock wait. Updating the whole 50-million-row table holds locks long and bloats WAL.
- With PostgreSQL, adding a column with non-volatile default is usually fast from version 11; adding {{NOT NULL}} still requires scanning the table. Use {{CHECK ... NOT VALID}} then {{VALIDATE CONSTRAINT}} to avoid long locks.

### Flyway in pipeline
- Name files {{V<version>__description.sql}}; do not edit applied files.
- Run {{flyway validate}} in CI, {{flyway info}} before deploy; set {{cleanDisabled=true}}.
- Run migration by a separate job/initContainer, not by each Pod. If the app runs it, set {{spring.flyway.enabled=false}} when the job handles it.
- Set {{lock_timeout}} and {{statement_timeout}} for the migration session so a bad command does not lock tables forever.

### When forced to go back
- **App rollback**: deploy the old digest. With expand-contract, the old version can still read the new schema.
- **DB forward-fix**: write a new migration to fix the error. Faster than restore.
- **Restore/PITR**: only for serious data loss; accept losing data written after the backup, stop writes and notify.

> Senior tip: Always keep a forward-fix SQL script in version control; it is faster than restoring a multi-TB DB and less risky than manual fixes.
`,
    follow: [
      'How do you dual-write and backfill without increasing DB load at peak hours?',
      'Why not use flyway undo even with a Teams license? When is restore the right choice?',
      'How do you run safe migration when 20 Pods start at the same time?'
    ]
  },
  'devops-022': {
    q: 'You design observability for 20 Spring Boot microservices: metrics, distributed tracing and correlated logs. How do Micrometer, Micrometer Tracing/OpenTelemetry and OTel Collector divide the work, how to configure them, and which traps cause cost spikes?',
    a: `**Summary:** Observability is not about installing as many tools as possible, but answering "what is the system doing and why" with good enough signals. With Spring Boot, Micrometer is the facade for metrics, Micrometer Tracing/OpenTelemetry handles traces, and JSON logs with traceId/spanId connect the three pillars. At 20 services, cost and cardinality become the main constraints, so standardize through a shared starter and filter at OTel Collector.

### Reference architecture
~~~text
Spring Boot
  metrics -> /actuator/prometheus <- Prometheus -> Mimir/Thanos
  traces  -> OTLP -> OTel Collector (batch, tail sampling) -> Tempo/Jaeger
  logs    -> stdout JSON -> Promtail/Fluent Bit -> Loki/ELK
                traceId, spanId in MDC to connect the three signals
~~~
- Metrics: {{micrometer-registry-prometheus}} + Actuator; endpoint only exposed internally.
- Trace: {{micrometer-tracing-bridge-otel}} + {{opentelemetry-exporter-otlp}}, or OTel Java agent. Do not enable both for the same app without control, to avoid duplicate spans.
- Log: JSON encoder, traceId/spanId automatically in MDC via Micrometer Tracing; log aggregation labels {{service.name}}, {{environment}}, {{version}}.

### Metrics: few but correct
- Enable histograms for HTTP to calculate percentiles and SLOs, for example {{management.metrics.distribution.percentiles-histogram.http.server.requests=true}} and buckets around 100/300/500/1000 ms.
- Use low-cardinality tags: {{service}}, {{method}}, {{uri}} templated, {{status}}. **Do not** attach {{userId}}, {{accountId}}, {{requestId}} or raw path to metrics.
- Control with {{MeterFilter}}: limit meters, deny dangerous tags, rename by standard.
- Business metrics matter more than infrastructure metrics: successful transactions, queued transactions, error rate by channel. Use clear names and units.

### Trace: connecting services
- Propagate {{traceparent}} (W3C) via HTTP header, Kafka header, message, and DB client if supported.
- Name spans by business at the edge (for example {{POST /payments}}) and keep child spans for DB, HTTP client, cache.
- Sampling: head-based 5–10% in production; errors and slow requests should be kept 100% with tail sampling at Collector.
- Collector handles batching, retry, memory limiter, redacting sensitive data, and routing by environment. Do not let each app send straight to a vendor.
- With async/CompletableFuture/virtual thread, context can be lost; check for broken spans and add propagation.

### Correlated logs
- JSON logs with {{timestamp}}, {{level}}, {{service}}, {{traceId}}, {{spanId}}, {{message}}; do not log card numbers, national IDs, tokens, passwords.
- Error logs need enough context to reproduce: transaction code, business error code, not full payload.

### SLO, alerts and cost
- Pick 2–4 SLIs per service: availability, latency p99, business error rate. Set SLO and error budget; alert by burn rate instead of alerting each failure.
- Standard dashboards: RED for API (rate, errors, duration), USE for infrastructure (utilization, saturation, errors), and one business dashboard.
- Cardinality is cost number one: each tag combination is a time series. One {{userId}} tag can multiply series to millions.
- Trace and log also cost money: tail sampling, limit attributes, filter debug logs at Collector, do not send all to vendor.

> Senior tip: Standardize metrics names with a common prefix per domain (e.g. {{payment.transaction}}); this makes queries portable across the 20 services.
`,
    follow: [
      'If HTTP metric cardinality spikes because paths contain IDs, do you fix it in the app or in Prometheus?',
      'How does tail sampling work at OTel Collector and why is it needed for error traces?',
      'How do you keep traceId through Kafka and thread pools for correct log correlation?'
    ]
  },
});
