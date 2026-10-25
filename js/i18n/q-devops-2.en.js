/*
 * English translation of js/data/q-devops.js — task T214. Format: js/core/i18n.js (content overlay).
 * ids: devops-010 devops-011 devops-012 devops-013 devops-014 devops-015 devops-016 devops-017
 */
App.i18n.content({
  'devops-010': {
    q: 'Design a CI/CD pipeline for a Java Spring Boot service in a bank: from commit to production through DEV, SIT, UAT, PROD. What stages, gates, and principles are mandatory?',
    a: `**Summary:** CI: build, unit test, integration test (Testcontainers), quality and security analysis (SAST, dependency scan, image scan, SBOM), package image with version and push to registry. CD: deploy the same artifact (same digest) sequentially through environments, each step with a gate (automated tests, approval), production deploy via GitOps or pipeline with approval and automatic rollback. Core principle: **build once, promote many**, environment config separated from artifact, every step traceable.

### Stages
~~~text
commit/PR
  1. Build + unit test           mvn -B verify (JUnit, JaCoCo)
  2. Integration test            Testcontainers: PostgreSQL/Oracle, real Kafka
  3. Quality & security        SonarQube quality gate, SAST, SCA (OWASP Dependency-Check/Trivy)
  4. Package                     image tag = version + git sha; SBOM (CycloneDX); sign image (cosign)
  5. Image scan                  Trivy/Harbor scanner: block CRITICAL with patch
  6. Push                        Nexus (jar) / Harbor (image), immutable tag
merge main
  7. Auto deploy DEV              smoke test, contract test
  8. Deploy SIT                  automatic regression API test, integration test with simulated core banking
  9. Deploy UAT                  business test, performance test (k6/JMeter), DAST
 10. CAB approval               linked to change request
 11. Deploy PROD                 canary/rolling, monitor error rate, auto rollback
~~~

### Why "build once, promote many"
If every environment rebuilds from source, dependencies may change (SNAPSHOT, version range, updated base image), so what runs in prod is **not** what was tested in UAT. Therefore build once, promote by **digest** (sha256), not by tag (tags can be overwritten). Different environment configs go through ConfigMap/Secret/values, not baked into the image profile.

### Gates and purpose
| Gate | Blocks what | Example threshold |
|---|---|---|
| Unit + coverage | Logic errors | New code coverage >= 80% |
| Quality gate | Code smell, duplicate, bug | No new Blocker/Critical bugs |
| SCA | Library with CVE (Log4Shell) | No CVE Critical with patch |
| Image scan | OS package vulnerability | As above, with limited exception list |
| Contract test | Broken consumer API | Pact/Spring Cloud Contract pass |
| Performance | Performance regression | p99 not above 10% over baseline |
| Approval | Business risk, compliance | Approver different from code author |

### CI vs GitOps for CD
- **Push-based**: Jenkins/GitLab CI runs {{helm upgrade}} into cluster. Simple, but CI must hold prod cluster credentials.
- **Pull-based (GitOps)**: pipeline only updates version in config repo; Argo CD/Flux inside cluster syncs automatically. Git history is the audit log, rollback by revert, cluster does not expose credentials externally. Fits bank separation-of-duties requirements.

### DB Migration
Flyway/Liquibase runs as a separate step (Job or init) before app deploy; scripts must be backward-compatible (expand-contract) so rolling back app does not require rolling back DB.

### Common wrong answers
- "Rebuild for each environment with corresponding profile": violates build once.
- "Tag latest then deploy": you do not know what is running in prod, cannot roll back accurately.
- "Run tests after deploying prod": gates must come first.
- "More pipeline stages is always better": a 60-minute pipeline causes devs to batch changes, increasing risk; run in parallel and keep CI under 15 minutes.

> Senior tip: In banking, auditors ask "prove the build on prod is the one approved in UAT". Store digest, SBOM, scan results, and approver together with change request; Kubernetes admission policy (Kyverno/OPA Gatekeeper) only allows signed images from internal Harbor. When a new CVE like Log4Shell appears, SBOM lets you answer in minutes "which services are affected" instead of days.`,
    follow: [
      'A Critical CVE appears in a library but has no patch yet. The gate blocks the pipeline; how do you still release?',
      'Compare Jenkins running helm upgrade with Argo CD in terms of security and audit.',
      'Auto-rollback relies on which signals, and how do you avoid false rollbacks?'
    ],
  },
  'devops-011': {
    q: 'You have 30 microservices running on 4 environments (DEV, SIT, UAT, PROD). How do you manage Kubernetes manifests and secrets across environments? Choose Helm or Kustomize?',
    a: `**Summary:** Helm is a package manager using Go templates + values files, with release, version, rollback concepts and chart sharing; Kustomize does not template but patches pure YAML via base + overlay, built into kubectl. In practice, make one common chart for all Spring Boot services, with one values file per environment (or Kustomize overlay). Secrets must never be committed plain or base64-encoded: use External Secrets Operator pulling from Vault/AWS Secrets Manager, or Sealed Secrets/SOPS if they must live in Git.

### Helm
~~~yaml
# templates/deployment.yaml (truncated example)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "spring-boot.fullname" . }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: {{ include "spring-boot.name" . }}
  template:
    metadata:
      labels:
        app: {{ include "spring-boot.name" . }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
        env:
        {{- range .Values.extraEnv }}
        - name: {{ .name }}
          value: {{ .value | quote }}
        {{- end }}
~~~

### Kustomize
~~~yaml
# kustomization.yaml (base)
resources:
- deployment.yaml
- service.yaml
- ingress.yaml

# overlays/dev/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../base
patchesStrategicMerge:
- patch-replicas.yaml
configMapGenerator:
- name: app-config
  literals:
  - ENV=dev
~~~

### Secrets
- Never put secrets in {{values.yaml}} or ConfigMap.
- Use {{External Secrets Operator}} to sync from Vault/AWS SM.
- If Git must hold them, use {{Sealed Secrets}} (encrypted with cluster public key) or {{SOPS}} (encrypted with KMS).
- Rotate regularly and audit access.

### Trade-off
| Criteria | Helm | Kustomize |
|---|---|---|
| Template power | High (loops, conditionals, functions) | Low (only patches) |
| Learning curve | Medium | Low |
| Rollback / release history | Built-in | Manual (Git) |
| Sharing charts | Yes (Helm Hub, artifact repo) | No (copy YAML) |
| Built into kubectl | No (needs helm binary) | Yes |

### Production pitfalls
- {{values.yaml}} grows to 500 lines; split into {{values-dev.yaml}}, {{values-prod.yaml}}.
- Over-parameterizing: every new env creates more branches; prefer fewer overlays.
- Secret rotation requires redeploy; plan for zero-downtime rotation.

> Senior tip: At scale, manage manifests in one repo (GitOps) with folder-per-service. For banks, require code reviewers different from deployers, and use admission controllers to enforce image registry, resource limits, and namespace isolation.`,
    follow: [
      'When should you place a value in values.yaml versus a ConfigMap versus a Secret?',
      'How do you handle secret rotation without restarting all pods at once?',
      'Compare rollback in Helm with rollback via Git revert in Kustomize for a banking use case.'
    ],
  },
  'devops-012': {
    q: 'A Spring Boot app runs on Kubernetes: how should it log and aggregate logs? How do you find all logs for one transaction passing through 6 services using a single traceId?',
    a: `**Summary:** Log to stdout/stderr as single-line JSON, never to a file inside the container. The container runtime logs on the node; a DaemonSet agent (Fluent Bit, Vector, Grafana Alloy) reads them, adds Kubernetes metadata (namespace, pod, label), then pushes to Elasticsearch/OpenSearch (ELK) or Loki. Micrometer Tracing puts traceId/spanId into MDC and propagates via W3C traceparent header across services, so searching by traceId shows the full transaction.

### Why stdout, not file
- Container is ephemeral: if the Pod dies, log files in the container filesystem are lost.
- Logging agents read stdout directly from container runtime (containerd/CRI-O) with zero extra mounts.
- Structured JSON allows parsing without regex; include timestamp, level, traceId, service, message, correlation fields.

### Architecture
~~~text
Spring Boot (stdout JSON)
  → Container runtime (node log)
  → DaemonSet agent (Fluent Bit / Vector / Alloy)
  → Enrichment (namespace, pod name, labels)
  → Storage (Elasticsearch / OpenSearch / Loki / ClickHouse)
  → Query / Dashboard (Grafana / Kibana)
~~~

### Trace across services
- Use {{Micrometer Tracing}} + {{W3C Trace Context}} (traceparent header).
- Each service extracts traceId from incoming header and puts it in MDC (Mapped Diagnostic Context), so logs automatically include it.
- In async messaging (Kafka), propagate via message headers or use a tracing interceptor.

### Query examples
- Elasticsearch: {{traceId: "abc-123"}} across indices.
- Loki: {{{traceId="abc-123"}}} (label-based stream selection).
- Aggregate into a single trace view with Jaeger / Tempo / Zipkin.

### Common wrong answers
- "Write to /var/log/app.log": file lost on pod restart; agent must tail, more complex.
- "Use one big Logstash filter for all services": service-specific fields require per-service parsers.
- "Only log at INFO in production": ERROR and WARN must be preserved; use DEBUG only temporarily with dynamic log level.

> Senior tip: For banks, log retention and access control are regulatory (PCI-DSS, GDPR). Store logs with encryption at rest, restrict query access by role, and never log sensitive card numbers or PINs. When a production issue spans 6 services, finding all related logs by traceId within seconds can reduce MTTR from hours to minutes.`,
    follow: [
      'How do you propagate trace context through Kafka messages and database queries?',
      'What is the best storage for high-cardinality traceId queries: Elasticsearch vs Loki vs ClickHouse?',
      'How do you prevent logging PII or payment data by mistake?'
    ],
  },
  'devops-013': {
    q: 'Nginx stands before 3 Spring Boot instances. Users report: uploading a 5 MB bank statement fails with 413, an API report export gets 504 after exactly 60 seconds, and occasionally a POST transaction is sent twice. Explain and reconfigure.',
    a: `**Summary:** 413 because {{client_max_body_size}} defaults to 1 MB. 504 after 60 seconds because {{proxy_read_timeout}} defaults to 60 s: Nginx cuts when backend takes too long to send the next byte. POST sent twice when Nginx (or another LB/client layer) retries to a different upstream after error/timeout; Nginx from 1.9.13 does not retry non-idempotent requests by default, but configuring {{proxy_next_upstream ... non_idempotent}} or retry at another layer causes duplication, so the payment API must have an idempotency key.

### Configuration example
~~~text
upstream spring_boot {
    server 10.0.0.11:8080;
    server 10.0.0.12:8080;
    server 10.0.0.13:8080;
}

server {
    listen 80;
    client_max_body_size 20M;
    proxy_connect_timeout 5s;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
    proxy_next_upstream error timeout http_502 http_503 http_504;
    proxy_request_buffering on;

    location / {
        proxy_pass http://spring_boot;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Trace-Id $request_id;
    }
}
~~~

### Idempotency
- Client generates {{idempotency-key}} (UUID or business key), sends it in header or body.
- Server stores processed keys (Redis / DB) with TTL; if key seen, return original response without processing.
- For POST payments, require the key; reject duplicates with 409 or return cached result.

### Timeout explanation
- 504 means backend exceeded {{proxy_read_timeout}}; increase to match worst-case report generation (up to 300 s for large PDF), but also optimize query/index.
- If backend is genuinely slow, add async processing with a job queue; return 202 Accepted with status endpoint.

### Duplicate request cause
- Client retry after timeout without receiving response (ambiguous: server may have processed).
- LB retries to a different instance when one fails (if {{proxy_next_upstream}} allows non-idempotent).
- Fix: disable retry for POST/PUT; use idempotency key; return response quickly or use 202.

### Interview notes
- What differences exist between 413, 502, 504, and 502/503 from the backend perspective?
- Why must idempotency be at API layer rather than only LB layer?
- How do you test timeout and retry behavior in a load test?

> Senior tip: For banks, 504 after exactly 60 s is often the first signal of a missing index or N+1 query that only appears under real load. Do not just raise the timeout; profile the SQL with EXPLAIN and check connection pool exhaustion (HikariCP metrics). Duplicate POST without idempotency can cause double debit; always implement at the payment gateway layer, not just client.`,
    follow: [
      'How do you implement idempotency for a batch payment endpoint that uses a file upload?',
      'What monitoring signals tell you a 504 is from backend slowness versus network loss between Nginx and the service?',
      'Compare using Nginx as a reverse proxy versus an API gateway (Kong, Envoy, Traefik) for a multi-service banking backend.'
    ],
  },
  'devops-014': {
    q: 'Your bank deploys on-premise, production network has no internet access, and every change must be approved. How do you organize dependency, image, deployment, and change management to still release quickly and safely?',
    a: `**Summary:** Everything from outside passes through a controlled "gate": Nexus/Artifactory proxies Maven Central and npm, Harbor acts as image registry (proxy cache or replication from external registry, vulnerability scanning, image signing), with an approved library list. The build pipeline runs once in the build zone; artifacts are promoted to production zone via promotion process, with approval and audit.

### Dependency management
- Internal Nexus/Artifactory mirrors Maven Central, npm, PyPI.
- Only approved libraries: maintain an allow-list; block new dependencies until security review.
- Use {{dependency-check}} / SCA in CI; block builds with new CVEs.

### Image management
- Harbor registry inside the network; pull from external registry via replication with scan and sign.
- Every image signed with Cosign / Notary; admission controller verifies signature and registry origin.
- Keep a base-image update cycle; do not use {{latest}}; pin digest.

### Deployment flow
- Pipeline builds once in build subnet (with limited access to source repo); artifact (jar + image digest) promoted to prod subnet through a gated promotion step.
- Change request (CAB) approved in ITSM (ServiceNow / Jira); deploy only after approval linked to artifact digest.
- Deploy via GitOps (Argo CD/Flux) inside prod network; cluster pulls from Harbor, not from internet.

### Change management
- All changes tracked in Git (infrastructure repo); rollback via revert and redeploy.
- Audit log: who promoted, who approved, which digest, which change request ID.
- Separation of duties: builder != deployer != approver.

### Network and security
- Air-gapped build nodes with proxy; no direct internet from prod nodes.
- Image scanning inside the registry (Trivy/Clair) before promotion.
- Use private CA for TLS inside the network; rotate certificates automatically.

### Interview notes
- How do you reconcile quick release with approval gates: canary deploy with automatic rollback?
- What is the role of SBOM when you must prove provenance to regulators?
- How do you handle emergency patches when CAB meets weekly?

> Senior tip: Banks often face audits asking "show the provenance of every binary in production". Keep a software bill of materials (SBOM) generated at build time (CycloneDX/SPDX), signed with the image, and linked to the change request. If a new CVE is discovered, SBOM lets you identify affected services in minutes rather than searching manually through hundreds of deployments.`,
    follow: [
      'How do you handle an urgent security patch when the CAB approval cycle is weekly?',
      'What is the difference between image promotion by tag and by digest in an air-gapped environment?',
      'How do you verify image signature and provenance without internet access from the cluster?'
    ],
  },
  'devops-015': {
    q: 'A Spring Boot service runs in a Pod with CPU limit 2 and memory limit 4Gi. As load increases, average CPU is only ~40% but p99 spikes sharply and GC logs get thick. Check whether JVM reads container limits correctly, then configure MaxRAMPercentage, GC threads, and ActiveProcessorCount.',
    a: `**Summary:** JVM 17/21 reads CPU and RAM limits from cgroup, but how it converts them to {{availableProcessors}}, heap, and GC threads creates very different traps. With a 2 CPU / 4 Gi Pod, set {{MaxRAMPercentage}} to about 75, keep CPU request equal to limit for latency-sensitive services, and verify with GC logs and CFS throttling metrics rather than only average CPU.

### How JVM sees resources
- **CPU**: JVM reads {{cpu.max}} (cgroup v2) or quotas (v1). With {{-XX:+UseContainerSupport}} (default in 17+), it sets available processors accordingly.
- **RAM**: JVM reads {{memory.limit_in_bytes}} (v1) or {{memory.max}} (v2) and calculates heap automatically unless {{-XX:MaxRAMPercentage}} is set.
- Without container awareness, JVM uses the host’s CPU count (e.g., 64) and memory (e.g., 128 Gi), creating wrong GC threads, wrong heap sizing, and poor performance.

### Recommended settings
- {{-XX:MaxRAMPercentage=75}}: leaves room for metaspace, thread stacks, native memory, direct buffers.
- {{-XX:InitialRAMPercentage=50}}: avoid resize overhead at startup.
- {{-XX:+UseG1GC}} or {{-XX:+UseZGC}} for low-latency; with 4 Gi, G1 is safer; if latency is critical and heap < 4 Gi, ZGC is possible with recent JDK.
- {{-XX:ActiveProcessorCount=2}}: explicitly match container CPU if automatic detection is off (older JVM or misconfigured cgroup).
- Keep CPU request = limit to avoid CFS throttling and noisy-neighbor issues.

### Verification
- GC log: check {{Pause Full}} frequency and duration; thick logs mean frequent GC.
- Metrics: {{container_cpu_cfs_throttled_seconds_total}} should be near zero; if high, either limit is too low or request is too low.
- JVM metrics: {{jvm_memory_used_bytes}} / {{jvm_memory_max_bytes}}; if close to limit, increase or reduce heap ratio.

### Why average CPU is misleading
- Average 40% can hide 100% spikes lasting seconds; p99 latency reveals them.
- GC pauses cause latency spikes even when CPU average is low; GC thread count misconfigured worsens this.
- If CFS throttling is high but average CPU low, the container is being limited by quota, not by load.

### Common wrong answers
- "Set -Xmx exactly to 4 Gi": forgets non-heap memory, leading to OOMKilled by kernel.
- "Use default GC threads": JVM may create 64 threads on a 64-core host, wasting CPU and increasing context switches.
- "Only look at CPU average": misses GC and throttling problems.

> Senior tip: In production, set {{MaxRAMPercentage}} experimentally: start at 75%, observe GC behavior and memory usage over a week, then adjust. For latency-sensitive banks, do not run with CPU request < limit; CFS throttling causes unpredictable latency spikes during market-open hours. Use metrics (Prometheus + Grafana) to correlate GC pauses with p99 latency.`,
    follow: [
      'How do you confirm whether JVM is reading the correct container limits?',
      'What GC settings would you choose for a 4 Gi heap with a latency-sensitive trading service?',
      'Why is CFS throttling more dangerous for latency than average CPU utilization?'
    ],
  },
  'devops-016': {
    q: 'Design liveness, readiness, and startup probes for a Spring Boot service that starts in 90 seconds and depends on PostgreSQL and Kafka. Why should all three not point to /actuator/health? How do you configure Actuator health groups so a DB failure does not cause a cascading restart?',
    a: `**Summary:** The three probes have different jobs: startup protects slow initialization, liveness restarts when the process hangs, readiness removes the Pod from traffic when it cannot serve. Use Actuator health groups to separate them completely: liveness checks only internal state, readiness may check dependencies. Pointing liveness to the combined /actuator/health is the fastest way to turn a DB failure into a chain of restarts across the system.

### Probe roles
- **Startup**: gives Kubernetes time for slow initialization (e.g., 90 s for DB connection pool + Kafka consumer start). Once startup passes, Kubernetes starts liveness/readiness checks.
- **Liveness**: restarts the container if the process is dead or hung (infinite loop, deadlock). Must be lightweight and independent of external dependencies.
- **Readiness**: removes the Pod from Service endpoints when it is not ready to serve (DB down, Kafka not connected, warm-up incomplete). Does not restart; only stops sending traffic.

### Health groups in Actuator
~~~yaml
management:
  endpoints:
    health:
      group:
        readiness:
          include: db, kafka, diskSpace, ping
        liveness:
          include: ping
  endpoint:
    health:
      probes:
        enabled: true
~~~

- Liveness group: only {{ping}} (or a lightweight internal check). If DB is down, liveness passes; container is NOT restarted.
- Readiness group: {{db}}, {{kafka}}, {{diskSpace}}. If DB fails, readiness fails; Pod is removed from traffic, but runs until recovery.
- Startup group: can include DB, Kafka, and a custom check that verifies initialization complete.

### Configuration example
~~~yaml
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 10
  failureThreshold: 3
readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
  failureThreshold: 2
startupProbe:
  httpGet:
    path: /actuator/health/startup
    port: 8080
  failureThreshold: 30
  periodSeconds: 10
~~~

### Why not one /actuator/health for all
- If DB is down and liveness checks DB, Kubernetes restarts all Pods; with many replicas, this creates a cascading failure because restarts overload the remaining DB connections.
- Liveness should only detect process health; readiness detects service health.
- Startup is temporary; after it passes, Kubernetes ignores it.

### Interview notes
- How do you handle a service that takes 90 s to start without blocking other probes?
- What is the difference between a readiness failure and a liveness failure in terms of recovery?
- How do you test probe behavior with simulated DB downtime?

> Senior tip: For banks, cascading restarts during a DB maintenance can cause a full outage. Always separate health groups; use a dedicated startup probe with a long failure threshold; and test with chaos engineering (e.g., temporarily block DB connections) to verify that readiness drops but liveness stays up, preventing unnecessary restarts.`,
    follow: [
      'How do you configure a startup probe for a service with long initialization?',
      'Why should readiness include DB but liveness should not?',
      'How do you test probe behavior under simulated dependency failure?'
    ],
  },
  'devops-017': {
    q: 'You enabled server.shutdown=graceful but every deploy still sees Pods getting SIGKILL after 30 s and losing Kafka messages. Explain the full Kubernetes pod shutdown sequence, what Spring Boot graceful shutdown does not handle, and correct settings so neither requests nor messages are lost.',
    a: `**Summary:** Pod shutdown is a parallel sequence, not sequential: endpoint removed, preStop runs, SIGTERM sent, then after grace period SIGKILL. {{server.shutdown=graceful}} only handles HTTP: stops accepting new requests and waits for running requests; it does not wait for self-created executors, scheduled tasks, Kafka consumers, or non-daemon threads. To avoid data loss, drain every component and set total time shorter than {{terminationGracePeriodSeconds}}.

### Kubernetes shutdown sequence
1. Endpoint removed from Service endpoints (traffic stops to Pod).
2. {{preStop}} hook runs (if configured); useful for connection draining or notifying external systems.
3. SIGTERM sent to PID 1 (container process).
4. Spring Boot graceful shutdown starts (if enabled): stops accepting new HTTP, waits for active requests.
5. After {{terminationGracePeriodSeconds}} (default 30 s), SIGKILL sent; process dies immediately.
6. Container stops; volume unmount; Pod removed.

### What graceful shutdown does not do
- It does not wait for custom {{ExecutorService}} threads that are not part of Spring’s thread pool.
- It does not wait for @Scheduled tasks or async methods not tracked by Spring.
- It does not wait for Kafka consumer @KafkaListener threads unless specifically configured with a graceful stop listener.
- It does not stop database connection pools automatically if not integrated with Spring’s lifecycle.

### Correct configuration
- {{terminationGracePeriodSeconds: 60}} or more (match worst-case drain time).
- {{preStop: { exec: { command: ["/bin/sh","-c","sleep 10"] } } }}: gives time for endpoint removal to propagate and connections to finish.
- Spring Boot: {{server.shutdown=graceful}}, {{spring.lifecycle.timeout-per-shutdown-phase=30s}}.
- Kafka: add a shutdown hook or use {{@KafkaListener}} with container factory that stops on context close; commit offsets before exit.
- Custom executors: register as {{DisposableBean}} or use {{TaskExecutor} with graceful termination.

### Verification
- Check Kubernetes events for SIGTERM to SIGKILL delay; if 30 s, increase {{terminationGracePeriodSeconds}}.
- Check application logs for graceful shutdown start/end; if missing, check property name and version.
- Monitor Kafka consumer lag during deploy; if lag increases during deploy, consumer is not draining properly.

### Interview notes
- What differences exist between liveness, readiness, and startup probes for a 90-second startup service?
- Why should readiness include DB/Redis but liveness should not?
- How do you prevent a DB failure from causing cascading restarts across all services?

> Senior tip: In banks, a deploy that loses a payment message can cause financial discrepancy. Always verify graceful shutdown with a real load test: trigger deploy while processing messages, monitor for uncommitted offsets, and measure time from SIGTERM to complete exit. If your total drain time can exceed 30 s, set {{terminationGracePeriodSeconds}} accordingly; but do not make it infinite—use 60–90 s, with alerts if shutdown exceeds expected time.`,
    follow: [
      'How do you design a graceful shutdown that covers HTTP, Kafka, and database connections?',
      'What is the difference between preStop and graceful shutdown, and when do you need both?',
      'How do you verify that no message is lost during a rolling deploy with 3 replicas?'
    ],
  }
});
