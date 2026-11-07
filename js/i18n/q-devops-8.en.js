/*
 * English translation of js/data/q-devops.js — task T668. Format: js/core/i18n.js (content overlay).
 * ids: devops-042 devops-043 devops-044 devops-045 devops-046 devops-047 devops-048
 */
App.i18n.content({
  'devops-042': {
    q: 'The team wants an automated canary: 5% of traffic → watch the error rate for 10 minutes → 25% → 50% → 100%, and it must stop by itself as soon as errors rise. How does Argo Rollouts actually do that, and what does a Java service need to watch out for regarding warm-up, the database and samples that are too small?',
    a: `**Summary:** Argo Rollouts replaces Deployment with a CRD called **Rollout**: it orchestrates two ReplicaSets (stable + canary) according to a list of **steps** — setWeight, pause, run an **AnalysisTemplate**. That template periodically queries Prometheus (5xx ratio, p99…); if the metric breaches the {{failureLimit}} threshold enough times, the rollout is **aborted** and the canary scales back to 0. Traffic is split either by Pod ratio (no special ingress support needed) or through an NGINX ingress / service mesh using {{canary-weight}} and {{canary-by-header}}.

### Reading the sample Rollout
~~~yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
spec:
  replicas: 20
  strategy:
    canary:
      canaryService: payment-canary
      stableService: payment-stable
      trafficRouting:
        nginx:
          stableIngress: payments-nginx
      canaryAnalysis:
        maxWeight: 50
        steps:
        - setWeight: 5
        - pause: {}                      # indefinite pause: a human looks first, then the machine continues
        - setWeight: 25
        - pause: { duration: 10m }
        - analysis:
            templates:
            - templateName: error-rate
      scaleDownDelaySecondsOnScaleUp: 60 # keep old Pods 60s so in-flight requests can drain
~~~
{{setWeight: 5}} means 5% of traffic goes to the canary; in Pod-ratio mode 20 replicas → 1 canary Pod, which is approximately 5%.

### AnalysisTemplate — the measuring instrument
~~~yaml
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: error-rate
spec:
  metrics:
  - name: http-5xx-ratio
    intervalSeconds: 60
    failureLimit: 2                # abort after 2 consecutive failures
    successCondition: result[0] < 0.01   # 5xx below 1%
    provider:
      prometheus:
        address: http://prometheus.observability:9090
        query: |
          sum(rate(http_server_requests_seconds_count{job="payment",status=~"5.."}[5m]))
            / sum(rate(http_server_requests_seconds_count{job="payment"}[5m]))
~~~
Take the metric from {{Micrometer}} (http_server_requests) — the same source your SLO dashboard uses; do not invent a new number.

### The three ways to split traffic
| Method | Requirement | Notes |
|---|---|---|
| Pod ratio (no trafficRouting) | no ingress support needed | coarse: 1 Pod = 5% when there are 20 Pods; latency depends on the busiest Pod |
| NGINX ingress {{canary-weight}} | requires ingress-nginx | exact by percentage; {{canary-by-header}} lets internal testers send 100% of their calls to the canary |
| Service mesh (Istio/Linkerd) | VirtualService/DestinationRule | gives you weight + header + mirror |

### Three things only Java people remember
1. **A cold JVM**: a fresh canary Pod has not warmed its JIT, so p99 is high for the first few minutes — that can make the analysis fail on something that is not a real regression. Use {{warmupDurationSecs}}, and only start measuring after the pause window.
2. **The database is shared state**: a canary cannot isolate the schema — an incompatible migration hurts stable and canary exactly the same; expand-contract is still the prerequisite.
3. **Small samples at low traffic**: 10 RPS × 5% = 0.5 RPS, so p99 there is pure noise; you need a minimum request count condition inside the query, or an indefinite pause at 5% so a human presses promote.

### Abort and manual promote
On abort: the canary scales to 0, the rollout stops in the aborted state, and the metrics remain in the UI for investigation. Operators run {{kubectl argo rollouts promote}}/abort when they want to move forward — a script can resume the rollout step by step while an incident is still running.

### Common mistakes
- An over-optimistic readiness probe → the canary Pod takes traffic before it is warm, the 5xx are real but caused by the infrastructure, the analysis aborts unfairly and nobody fixes the probe.
- Canary-by-header: a broken tester run → the abort misleads you, because the analysis does not count test traffic (routing follows the header, weight stays 0).
- Running the canary at the same time as the DB migration coalesce phase → there is no "old code path" left to retreat to.
- An indefinite pause that gets forgotten: the rollout hangs for 3 days at 5%, both ReplicaSets exist at the same time, and devs think the release is finished.

> Senior tip: for a payment service, start the analysis with **5xx error rate + business error rate (gateway rejections)** instead of p99 — these two metrics are much less noisy on small samples. Keep the first pause indefinite so a human reads canary logs for 10 minutes; only trust the machine after you have watched it correctly catch 2–3 real incidents.`,
    follow: [
      'Traffic is very low (under 1 RPS): how do you design the analysis so the canary does not fail unfairly?',
      'How does mirroring 10% of production traffic to the canary (shadow traffic) work, and what are the risks for write APIs?',
      'After an abort the canary Pods are dead — how do you keep a heap dump and logs for the investigation?'
    ]
  },
  'devops-043': {
    q: 'Each Spring Boot service runs 10 replicas with maximumPoolSize 20; PostgreSQL max_connections is 200 and is frequently overloaded, and every rolling update makes it noticeably worse. How do you solve the connection pooling problem at the app tier, the pool tier and the DB tier?',
    a: `**Summary:** a PostgreSQL connection is not a lightweight socket — every connection is a **server process** that costs memory and CPU; DB throughput does not grow with the number of open connections, and past a certain point it actually drops because of contention. 10 pods × 20 = 200 counts **one** service only; add migrations, cron jobs, other services, and the rollout window that temporarily doubles the Pod count. The strategy has three tiers: an app pool that is **small and follows a formula**, **PgBouncer** multiplexing in the middle, and a DB connection budget with reserve headroom; plus protection against a **connection storm** when Pods all start at once.

### Why opening more connections buys you nothing
A bank branch with 2 counters and 200 customers queuing: the number of transactions the DB can serve simultaneously ≈ the number of CPU cores. Every Postgres connection is a process (fork) costing a few MB, and each query can consume {{work_mem}} for a sort or a hash; 200 connections running at once is 200 times all of that, plus lock contention, plus delayed vacuum. The throughput curve: it climbs to a peak at roughly 2× the core count, and adding more pushes it down. HikariCP gives the classic starting formula: {{connections = core_count * 2 + effective_spindle_count}} — a big pool only makes sense when your queries wait on I/O for a long time.

### Setting the connection budget (with real numbers)
~~~text
DB max_connections          = 200 (minus superuser reserved ~10, monitoring ~5)
Left for allocation         ≈ 185
payment-svc: 10 pod × pool 8  = 80
order-svc:   10 pod × pool 6  = 60
Flyway job + CronJob           = 6
Incident buffer / rollout surge = ~40  ← the number most people forget
~~~

And remember that rollouts add surge: maxSurge 25% means 12–13 Pods temporarily — 13 × 8 = 104 for that one service.

### The connection storm at deploy time
By default Hikari opens {{minimumIdle}} = maximumPoolSize when the pool is initialised → 10–13 Pods come up within 60 seconds and each rushes the DB asking for 8 connections: the DB has to accept new connections (fork a process, run authentication) while still carrying the old queries → timeouts cascade, Pods fail readiness, restarts make the storm bigger (a death spiral).
Reduce it: keep {{minimumIdle}} small (open connections on demand), set {{connectionTimeout}} to 2–3 seconds so you fail fast and retry with backoff at the service tier, set {{initializationFailTimeout = -1}} so the app can still boot while the DB is momentarily congested and reconnect gradually, and put a shield in front of the DB (see PgBouncer).

~~~yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 8
      minimum-idle: 2
      connection-timeout: 3000
      initialization-fail-timeout: -1
      leak-detection-threshold: 60000   # log a stacktrace if the app holds a connection for 60s without returning it
~~~

### PgBouncer — multiplexing at the middle tier
The idea: the app keeps hundreds of **fake** connections on the PgBouncer side; PgBouncer keeps about 50 **real** connections to the DB, lends one out per transaction and then takes it back — the DB server processes get shared.
| Mode | How it works | Consequence for Java |
|---|---|---|
| session | one server connection hard-assigned to one client | saves no memory, rarely used |
| transaction (the common one) | lends a server connection **per transaction** | saves the most, but throws away everything that depends on the "session" |
| statement | multiplexes per individual statement | fragile, avoid it |

Transaction-mode traps with JDBC/Postgres: driver prepared statements (the Postgres JDBC driver caches them after 5 executes by default) do not work with old PgBouncer builds — PgBouncer 1.21+ supports server prepared statements (configure {{max_prepared_statements}}), while older builds need the driver-side cache disabled ({{prepareThreshold=0}}); {{SET}} of session variables (search_path, timezone) no longer "sticks" for the whole session → set the defaults at role/db level with {{ALTER ROLE ... SET search_path}} instead of on every connection; advisory locks, {{LISTEN/NOTIFY}} and temporal session state cannot run at all. AWS RDS Proxy is the managed option built on the same idea.

### Leaks and long transactions — the code side
- {{@Transactional}} wrapping a 3-second HTTP call to a partner → you hold the connection for 3 seconds instead of 20 ms; p99 pool exhaustion arrives much sooner. Narrow the transaction to the DB operations and make external calls outside it.
- A report that runs 200 seconds: give it its own DataSource, a pool of 2–3, a readonly user and a per-role {{statement_timeout}} — do not let reports feed on the transactional pool.

### Answering in 30 seconds
"First I compute the real connection budget (total Pods × pool + surge) instead of scaling the pool by feel; I keep the app pool small following the core-count formula; if the client count is large I put PgBouncer/RDS Proxy in front to multiplex and check prepared statements plus session variables; the deploy-time storm is handled with a small minimumIdle and fail-fast with backoff; and finally I alert on both sides, hikari_pending and pg_stat_activity."

> Senior tip: a correct dashboard shows **both sides**: {{hikaricp_connections_active/pending}} (Micrometer) placed next to {{pg_stat_activity}} counted by application_name. 90% of the "the app hangs at peak" cases are one long transaction holding a connection plus a small pool — leak-detection-threshold is your evidence button instead of guessing.`,
    follow: [
      'PgBouncer transaction mode + Spring Data JPA lazy loading outside the transaction: why does it break, and where do you fix it?',
      'Why can a 50-connection limit be faster than 200? Explain it through the throughput curve.',
      'A rolling update pushes the DB to max_connections: do you change the rollout strategy or the pool first?'
    ]
  },
  'devops-044': {
    q: 'Your Spring Boot Pod takes 90–120 seconds to become Ready. Why is that dangerous on Kubernetes rather than merely "slow", how do you measure which stage is wasting the time, and when are the startup-reduction options (AppCDS, trimming the context, CRaC, native image) worth adopting?',
    a: `**Summary:** a Pod\'s startup = **image pull + JVM + Spring context + warm-up**. On Kubernetes these 90 seconds make HPA react late — after the overload has already happened — they stretch rollouts so two versions run side by side longer (and rollback is exactly as slow), and when a node dies the "only way to serve again" waits those same 90 seconds. Before optimising anything, **measure phase by phase**; then pick levers along the impact/effort curve: AppCDS and doing less work at startup give the best return per unit of effort, while CRaC and native image are only worth it when slow startup is the core problem you are solving.

### Where those 90 seconds go
~~~text
Image pull 210 MB      ~6s (node has cache) / 20–40s (brand new node)
JVM boot               ~0.5–1s
Spring context         ~60s: autoconfig + package scan, bean creation,
                       JPA entity scan, DB authentication + migration, pool
                       opening, Kafka listener registration, cache warm-up
JIT warm-up            p99 stays high for another 30–60s **after** Ready
~~~

### Why slow is an **operational** problem, not a politeness problem
- **HPA**: the load signal rises → HPA decides to add Pods → the Pod becomes Ready after 90s. During those 90 seconds requests pile onto the existing Pods: p99 collapses exactly when the crowd is largest. A slow-starting service must keep minReplicas above what it actually needs — that costs money.
- **Slow rollback**: the new version has a bug, you "go back to the old one", but the old one also needs 90s per Pod to come up.
- **Incident recovery**: a node is lost, the Deployment recreates a Pod on another node — it has to pull from scratch.
- **startupProbe**: failureThreshold × period must be large enough to cover the whole startup plus pull on a new node, otherwise the Pod is killed unfairly before it finishes → CrashLoopBackOff for the reason of… being too slow.

### Measuring: which bean eats the time
Boot 3 ships an endpoint built on **BufferingApplicationStartup**:

~~~java
SpringApplication app = new SpringApplication(PaymentApp.class);
app.setApplicationStartup(new BufferingApplicationStartup(4096)); // buffer startup events
app.run(args);
// GET /actuator/startup → a timeline of every step: how long each bean took to create, flyway, kafka listener...
~~~

Add the timestamps from {{kubectl get events}} (Scheduled → Pulling → Created → Started → Ready) to separate the pull part from the app part.

### Reducing phase by phase
1. **Pull**: a smaller image (layered jar + JRE/distroless), a registry in the same VPC/region; some teams run a DaemonSet that pre-pulls the image onto every node.
2. **Class loading — AppCDS (App Class Data Sharing)**: every startup the JVM reads and **verifies** tens of thousands of classes; CDS stores the verification result in an **archive** built ahead of time in CI, so at runtime it only maps it in:

~~~bash
# Once in CI (or locally): run the app until exit, record which classes were loaded, write the archive
java -XX:ArchiveClassesAtExit=app-cds.jsa -jar payment.jar
# Every later startup uses the archive — typically 10–40% less JVM time
java -XX:SharedArchiveFile=app-cds.jsa -jar payment.jar
~~~

The archive is tied to that exact jar → regenerate it on every build and copy it into the image. The risk is close to zero.
3. **Doing less work at startup**: {{spring.autoconfigure.exclude}} the autoconfigurations you never use; narrow the component/entity package scan (scanning the whole repository root is a very common habit); move Flyway to a **separate Job that runs before the deploy** (app Pods no longer wait for migrations); warm caches / defer Kafka listeners so they run **after** readiness rather than blocking readiness indefinitely. Consider lazy-initialization=true only if you accept this: a misconfigured bean does not kill the boot but dies when a user finally touches it.
4. **CRaC (Coordinated Restore at Checkpoint)**: start fully once, "photograph" the already-hot process into a checkpoint, and each new Pod only **restores** it — about 1–3 seconds. JDK 21 + Spring Boot 3.2 have support. The trade-off: reopening sockets/connections after restore (DB pool, Kafka) must be handled correctly — maturity differs per library, and the build infrastructure gets more complicated.
5. **Native image (GraalVM)**: compiled ahead of time, ~50–200 ms startup, low RAM; but it is closed-world (reflection must be declared), you lose the JIT\'s peak throughput, debug/profiling tooling is limited, and many Java libraries need their own configuration. Good for functions/CLIs/sidecars that must scale extremely fast; not for a 600-bean app that uses JAXB in every corner.

| Lever | How much it saves | Price you pay |
|---|---|---|
| AppCDS | 10–40% | negligible |
| Fewer autoconfig/scan, migration moved to a Job | up to several tens of % | effort reviewing the configuration |
| CRaC | down to seconds | toolchain complexity, restore hooks |
| Native image | down to 0.1s | reflection, throughput, library constraints |

### Common mistakes
- startupProbe period × failureThreshold smaller than the worst case (new node + pull) — it only fits an already-warm node.
- Cutting startup but ignoring warm-up: Ready comes fast yet p99 still limps for the first minute → you need gradual traffic (Argo Rollouts\' warmupDurationSecs) or enough minReplicas.
- Lazy init makes a configuration error appear at 20:00 instead of at deploy time — fail-fast is a feature.

> Senior tip: set an SLO for startup itself, for example "a new Pod is Ready under 45s p95, even on a node whose image cache is empty", and **measure it on every rollout** rather than in a bench run on your laptop. After you get it down to ~20s, lower minReplicas on the HPA-bound services as well — the money saved by fast startup is usually bigger than the money saved by a smaller image.`,
    follow: [
      'Separate the roles of startupProbe / livenessProbe / readinessProbe when the app takes 2 minutes to start; what is the formula for choosing failureThreshold × period?',
      'Moving Flyway to a pre-deploy Job: what is the safe ordering with K8s and the pipeline, and what are the risks?',
      'Why can a native image be SLOWER than the JVM at peak throughput for a long-running app?'
    ]
  },
  'devops-045': {
    q: 'A new version of the payment service changes the amount field from number to string, deletes the old fee field and tightens validation. During the rolling update old and new Pods run together; two mobile app versions are still calling in. How do you "evolve" this API, and what must CI guarantee so you do not break consumers?',
    a: `**Summary:** a published API is a **contract** — you do not control when consumers upgrade, so a breaking change cannot be "deploy once and be done with it"; it must follow **expand-contract at the API tier**: roll out the compatible extension first, migrate consumers gradually, and only contract once usage of the old field is near zero; for big changes, add a version that runs in parallel with a published sunset schedule. CI must block breaking changes **before merge** with **contract testing** (Pact or Spring Cloud Contract): a provider may only deploy when it satisfies the contract of every registered consumer.

### The allowed/forbidden table — memorise it for interviews
| Change | Type | Safe way to do it |
|---|---|---|
| Add an optional field to the response | safe | consumers are **tolerant readers**: they ignore unknown fields |
| Add an endpoint / add enum values | nearly safe | a client that parses enums strictly will crash — ask first |
| Relaxing validation (accepting more) | safe | — |
| Renaming a field, changing its data type | **breaking** | add the new field in parallel, keep the old one with an expiry date |
| Deleting a field / an endpoint | **breaking** | deprecate + monitor usage, only then delete |
| Tightening validation, changing a status code, changing a date format | **silently breaking** | migrate consumers one by one, or introduce a new version |

amount number→string and deleting fee: both are breaking → you have to go through three phases.

### Three phases for this exact case
1. **Expand**: return **both** {{amount}} (number, behaviour unchanged) and {{amountDecimal}} (string, exactly 2 decimal places, no float error); validation still accepts the old input. The rolling update is safe because both the old and the new Pod honour the old contract.
2. **Migrate + measure**: publish a changelog, attach {{Deprecation}}/{{Sunset}} headers; tag metrics with {{X-Client-Version}} so you can see what percentage of traffic still reads the old field, broken down by app version.
3. **Contract**: once old-field usage is under the threshold (and the sunset schedule has passed), delete the field in a dedicated "retirement" release, announced one cycle in advance.

### Versioning: what to choose
| Approach | Example | Comment |
|---|---|---|
| URI | {{/v1/payments}} | explicit, easy to route/canary, easy to cache |
| Header | {{Api-Version: 2}} | clean URLs but harder to debug and harder to cache |
| Media type | {{Accept: application/vnd.bank.v2+json}} | theoretically correct REST, few teams actually use it |
The pragmatic decision: **cumulative compatible changes do not need a version bump**; bump only for breaking changes; v1 and v2 are served in parallel from the same codebase (two routes pointing at the same handler through an adapter) so you do not maintain two services.

### Contract testing — what CI actually proves
- **Pact (consumer-driven)**: each consumer (mobile app, partner) writes tests describing the part of the response it uses → publishes a **pact file** to a Pact Broker; the provider\'s CI **replays every pact** of every consumer against the real API. The **can-i-deploy** gate asks: "does this version break app 3.2, which has not upgraded yet?" — if it does, promotion is blocked.
- **Spring Cloud Contract**: the opposite direction — the provider defines contracts in its own repository and generates (a) verification tests for the provider and (b) a **WireMock stub** so consumers can test independently. It fits when you own both sides.
- External consumers (partners): keep a **sandbox + stub** that mirrors the current contract, together with a changelog carrying effective dates.

### Tolerant reader — the other half
When your app **consumes** somebody else\'s API: configure Jackson so it does **not** fail on unknown fields ({{FAIL_ON_UNKNOWN_PROPERTIES = false}}); skip new fields instead of crashing; treat an unknown enum value as unknown and raise a warning rather than throwing an exception. This is the shield against every partner API change at 3 a.m.

### Common mistakes
- "Only my own frontend uses that field" — forgetting the real consumers: internal cron jobs, partners, webhooks, old app builds that were never forced to upgrade.
- A breaking change sneaks in through a refactor commit inside a 40-commit release → it only surfaces during the incident. Contract verification in CI catches exactly that commit.
- Tightening validation "to block dirty data" kills off older clients that still send null as before, all at once.
- gRPC/protobuf: **never reuse a field number that was deleted** — on the wire there is no name left to negotiate with.

> Senior tip: turn "what percentage of traffic still uses the old API" into a permanent panel; deleting an endpoint without that number is like pulling up a bridge without knowing there are still people on the other side. And keep the iron rule: every PR that changes the schema must come with pact-verify results — red means no merge; a discussion with product cannot replace a machine check.`,
    follow: [
      'A partner in the EU calls your API and will not upgrade on your schedule: how do you design the version support policy?',
      'The contract test found a breaking change but product wants to ship urgently — what does your escape-hatch process look like?',
      'The API still returns 200 but the meaning of a field changed (fee is always 0): which tools catch this kind of "silent" breaking change?'
    ]
  },
  'devops-046': {
    q: 'The platform team proposes Istio for 30 microservices in order to get automatic mTLS, retries and traffic dashboards; the Java team answers that it already uses Resilience4j and configures its own HTTP clients. What does a service mesh actually do, where does it run, what is the real price — and how do you decide?',
    a: `**Summary:** a service mesh is an **infrastructure tier that handles east–west traffic** (services calling each other): a proxy (Envoy) runs beside every Pod and **intercepts every request going in and out**, so the platform can switch on automatic mTLS encryption + per-service identity, apply L7 policy (timeout, retry, traffic split, fault injection) and collect metrics per src→dst pair **without changing a single line of code**. Resilience4j does similar work but **inside the JVM** — it understands the business case, it is cheap, and it needs no infrastructure. The mesh wins when the problem belongs to the **platform** (unifying 30 polyglot services, compliance requiring encrypted traffic, identity auditing); it loses when the problem is only retry/fallback with business logic.

### How it works (enough to have a conversation with the platform team)
- **Sidecar**: an init container configures iptables inside the Pod so every packet in/out passes through Envoy; the app simply calls {{http://order-svc:8080}} and Envoy takes care of the rest.
- **mTLS**: each workload gets an identity from its ServiceAccount (the SPIFFE standard), the mesh signs and rotates the certificates by itself and encrypts **every hop** inside the cluster → you satisfy "encrypted in transit + knowing exactly which service calls which" without anyone writing any TLS code.
- **Policy as CRDs**: VirtualService (routing, retry, timeout, percentage split), DestinationRule (outlier ejection, connection pool), AuthorizationPolicy (who may call whom) — declared in Git, synced with GitOps, applied uniformly by the platform.
- **Telemetry**: RED metrics + traces per src/dst pair and status code, entirely automatic.

### Mesh vs Resilience4j — not either/or
| | Mesh (Istio/Envoy) | Library inside the app (Resilience4j) |
|---|---|---|
| Where it runs | a separate process beside the Pod | the same JVM |
| Configuration | CRDs, owned by the platform, changed without rebuilding the app | code/yml, owned by developers |
| What it knows | HTTP status, headers, latency | **context**: which method is idempotent, a fallback that returns a cached value, how to degrade gracefully |
| Retrying a non-idempotent POST | **dangerous** — the mesh does not know the business | controlled by the developer |
| Overhead | one extra proxy per hop | close to zero |
| Business-specific fallback | cannot do it | can do it |
The conclusion people usually land on: **the mesh for security + traffic shifting + telemetry, the in-app library for business fallback/timeout**; enable retries on **one** side only.

### The price you really pay
- Latency added per hop (from under 1 ms up to a few ms) and CPU/memory for Envoy in every Pod — a payment service with a tight p99 budget must be **measured before you decide**.
- Operational complexity: one more control plane to upgrade, one more layer to debug — a **503 can be produced by Envoy rather than by your app**; on-call has to learn to read proxy logs.
- Connections stacked on connections: the app\'s HTTP/JDBC pools plus Envoy\'s upstream pools → you have to recompute where the real limit sits.
- Injecting a sidecar means every Pod must restart; a namespace that is not injected calling a namespace in STRICT mTLS kills the request.

### Ambient and the other options
Istio **ambient mode**: a node agent (ztunnel) handles mTLS/L4 for every Pod, and L7 proxies (waypoint) are enabled only where they are needed — lower sidecar overhead, but still new; weigh maturity before committing it to production payments. Alternatives: Linkerd is lighter and focuses on mTLS + telemetry; or **no mesh at all**: cert-manager + TLS at the ingress, Spring Cloud Gateway — still fine if all 30 services are Java and the platform team is small.

### A safe path in (if you do decide to adopt it)
1. Pilot 1–2 non-core namespaces: enable mTLS in **PERMISSIVE** mode (it still accepts cleartext) → audit who is still calling unencrypted → only then switch to **STRICT**.
2. Turn on telemetry, compare p99 before/after at the same load level; run fault-injection tests in staging.
3. Perform one canary with a VirtualService (90/10 by header) — this is usually the feature that "sells" the mesh best to the dev teams themselves.
4. Write the runbook: "a Pod cannot come up because of its sidecar — what do we do".

### Common mistakes
- Switching on STRICT mTLS in one shot → CronJobs without a sidecar, monitoring systems outside the cluster, Pods moving between two nodes all fail at once.
- Automatic mesh retries on a write API → a debit is recorded twice; or a developer adds a Resilience4j retry **on top of** the mesh retry → a 3×3 request storm when a partner gets slow.
- The app binds ports that bypass the mesh (hostNetwork, calling an IP + original port directly) → you believe traffic is encrypted while it is not.

> Senior tip: do not decide the mesh with the question "which tool is more powerful", but with two auditor questions: **(1) do we need to prove that all traffic between services is encrypted and carries identity? (2) do we have enough people to operate one more control plane?** A bank with 30 services usually answers "yes" to (1) — the mesh is the short path; a 5-person startup answers "no" to (2) — libraries + TLS at the ingress is the right call.`,
    follow: [
      'A VirtualService retry of 2 plus a Resilience4j retry of 2 on the same call: what is the consequence, and how do you set the "who is allowed to retry" rule?',
      'Prove to an auditor that service A calling B carries identity — what does the mesh give you that a hand-rolled JWT cannot?',
      'STRICT mTLS kills a CronJob: analyse the root cause and redesign a safe rollout.'
    ]
  },
  'devops-047': {
    q: 'The production cluster is three versions behind on Kubernetes, and EKS only patches CVEs for the 3 newest versions; last cycle the team "jumped in one go", which broke ingress and left half the PDBs unapplied. As tech lead, how do you turn upgrading into a steady programme that runs every year instead of a project that happens once every three years?',
    a: `**Summary:** version lag is **debt**: every Kubernetes release removes more deprecated APIs, drags the addon matrix (ingress, Argo CD, cert-manager, CSI) towards configurations that are harder and harder to satisfy, and CVEs stop being patched. A proper upgrade programme is a **release train**: one minor version at a time, on a fixed calendar; tooling that scans for deprecated APIs in **your actual Git manifests** many months ahead; an immutable order — control plane → addons → node group; rehearsals on a staging that **copies production**; and app teams receiving a change bulletin early instead of receiving the consequences late.

### Why "three versions behind" costs many times more than "one behind"
- EKS only patches CVEs for the 3 most recent versions → being 3 behind means running a version **out of security support**.
- APIs are **removed** at milestones and your YAML does not convert itself: PodDisruptionBudget {{policy/v1beta1}} and CronJob {{batch/v1beta1}} were removed in 1.25; HPA {{autoscaling/v2beta1}} was removed in 1.26; PodSecurityPolicy was deleted outright in 1.25 (replaced by Pod Security Admission or OPA/Gatekeeper). Old manifests on 1.26+: {{kubectl apply}} fails, Argo CD reports OutOfSync, and worst of all a PDB **silently does not exist** → node drain kills more Pods than allowed.
- Jumping 3 versions at once = combining 3 rounds of breaking changes + 3 addon upgrade cycles → when the incident hits you cannot tell which culprit did it; and a control plane **cannot be downgraded**.

### The four legs of the programme
1. **A fixed cadence**: the target is "never more than 1–2 minors behind the newest EKS version"; one upgrade window per quarter, treated like a release with Go/No-Go and a freeze calendar (stay clear of the period before a sales campaign or a holiday).
2. **Automatic detection**: run {{kubent}} (or {{pluto}}) over the GitOps repository + helm charts every week → a bot opens PRs listing the apiVersions about to be removed **many months in advance**; moving a PDB to {{policy/v1}} becomes an ordinary PR, with no need to wait until upgrade day.
3. **Upgrade order**: control plane one minor at a time (EKS does not allow skipping) → addons (CRDs before controllers) → node groups **sequentially**, with drain protected by PDBs. Version constraint: the kubelet must **not be newer** than the apiserver; it is allowed to lag a few minors, but the goal is to catch up immediately.
4. **Real rehearsal**: staging built from the **same** GitOps repository/manifests as production; run the integration/e2e suite plus one session of "kill Pods and see whether PDB/HPA survive". If staging is not a copy of production, the rehearsal only tests your imagination.

### The part the Java team must do itself (the platform cannot do it for you)
- Work through your service\'s manifests using kubent\'s PRs: the apiVersion of PDB/HPA/CronJob, the SecurityContext after PSP was removed.
- New node images often switch to **cgroup v2**: an old JVM reads cgroup v2 limits incorrectly → verify that your JDK supports it (17/21 are fine, JDK 8/11 must be recent enough), and re-test {{MaxRAMPercentage}} and the GC thread count after the node image change.
- Pin images by immutable tag/digest — an upgrade makes nodes re-pull images, and a {{latest}} tag will expose all kinds of things.
- Upgrade the client libraries that talk to the cluster (the K8s Java client, the helm chart version of your service).

### Rollback and safety nets
- The control plane cannot be rolled back → the strategy is **reducing blast radius**: a "canary" node group running non-core workloads upgrades first, keep one pool on the old version for a few days as a lifeboat; the GitOps repository lets you revert addon manifests to an older commit.
- Before the window: snapshot PVs (especially a database running on the cluster), etcd backup if you are self-managed — and **test a real restore**; a backup that has never been restored is a backup that does not exist.
- Runbooks for the signature incidents: an ingress-nginx upgrade that breaks the admission webhook, a CSI driver version mismatch, CoreDNS.

### Measuring the health of the programme
KPIs: how many minors you are behind, the **average time to patch one runtime CVE**, total effort per upgrade (it must decrease cycle after cycle), the number of incidents in the 30 days after each upgrade. Upgrading is an internal product — it has a backlog and it has retrospectives.

> Senior tip: the difference between a team that "upgrades like hell" and a team that "upgrades like routine" is only two lines of discipline: (1) kubent runs **on a schedule**, not when you panic, (2) never jump more than one minor, even when it would be "convenient". After 3 cycles on schedule, one upgrade costs about the same as a normal release session — and you are in a position to answer an audit about CVEs on your runtime.`,
    follow: [
      'After upgrading to 1.25 the PDBs of 10 services have silently disappeared: how do you detect it, and what are the consequences at the next node drain?',
      'A canary node group: what criteria do you use to pick the "sacrificial" workload, and under what conditions do you let the whole cluster move?',
      'Your team still runs an unsupported version because it is "busy": how do you present the risk to management in order to win an upgrade window?'
    ]
  },
  'devops-048': {
    q: 'Infrastructure cost for 30 services tripled within a year while average CPU utilisation is very low; the CFO wants a 30% reduction without changing the SLA of the payment services. How do you lead a sustainable cost-optimisation programme: measuring, right-sizing requests, VPA, spot, autoscalers, and making teams accountable for the numbers?',
    a: `**Summary:** nodes are **sized by Σ requests**, not by usage — so the single biggest source of waste is Java services declaring requests 2–3 times what they actually use ("to be safe"). A sustainable programme: measure per namespace (OpenCost) → right-size requests to **p95 usage + buffer** → improve bin packing (Karpenter/cluster autoscaler) and cut what "costs money even while asleep" (minReplicas, dev/test running overnight) → spot wherever it is safe → trim surplus logs/metrics/storage/network → and **attach the bill back to each team** through quotas + showback. The number you present to the CFO is not the absolute total cost but **cost per 1,000 transactions**.

### Why request = money
The scheduler places a Pod by its **request**: if you ask for 4Gi, the node reserves 4Gi for you even when real RSS is only 1Gi; the instance keeps running and keeps billing. There are two leaks: (a) every individual service overprovisioning, (b) the whole cluster inflating because nobody packs near-empty Pods onto one node. A **limit** works the other way round — it does not influence Pod placement at all, only what happens when resources get squeezed.

### Step 0: measure before cutting anything
- OpenCost/Kubecost: allocation = request, adjusted by usage, broken down by namespace/environment/service. A common picture: **dev + test account for 30–40%** of the bill; the top 10 overprovisioned services could "feed" two other services.
- A baseline line: cost per 1,000 transactions per month. Without a baseline, every "-x%" figure is just storytelling.

### Right-sizing for Java — without cutting into pain
Collect 2–4 weeks of data: {{container_memory_working_set_bytes}} (the container\'s real resident memory: heap + metaspace + thread stacks + direct buffers) and CPU usage together with **CFS throttling** ({{container_cpu_cfs_throttled_periods_total}}):
- **Memory request ≈ p95 usage × 1.2**: memory cannot be compressed; set it too low and you get node-pressure eviction or OOMKilled exactly at peak. For a payment service, consider request = limit (Guaranteed QoS).
- **CPU request can sit below usage** when the Pod bursts (Burstable), but a p99-sensitive service should keep request = limit so it never gets throttled — decide with the throttling metric, not with your gut.
- Use VPA in **recommend** mode as a periodic review report; do **not** turn on auto-apply for a JVM app: a changing limit changes {{MaxRAMPercentage}} every time a Pod is recreated (heap behaviour becomes unstable), and VPA Pod restarts collide with HPA/rollouts.
- After each round of request changes: watch SLO + OOM/throttle for **2 weeks** before going another round.

### Cutting the "costs money while sleeping" layer
- **minReplicas**: 30 services × min 3 = an enormous fixed cost floor. Lower min for services that start fast (see the startup-optimisation article: Ready in 15s means HPA can chase a burst, so min 3 is not needed).
- **Karpenter/cluster autoscaler**: buy instances of the right size, pack Pods tightly, **consolidate** empty nodes — and when draining a node it must respect PodDisruptionBudgets.
- **dev/test**: a cron that scales to zero outside working hours, per-PR environments with a self-destruct TTL; dev needs no HA → run all of it on spot.
- **Spot for stateless workloads**: a pool spanning multiple instance types/AZs, PDB + HPA floor so that losing 1/3 of the nodes still leaves enough capacity; **never** spot for a 40-minute batch job without checkpointing; do not put the entire basket of payment Pods on spot at the same time.

### The hidden bills
Log retention 90d→14d (archive it if you are required to), trace sampling 100%→10% for noisy services, dashboards nobody opens; storage gp2→gp3 (cheaper, and the change needs no downtime); EBS volumes left "orphaned" after a migration; snapshots kept for a whole year; ECR without a lifecycle policy; **the NAT gateway** — traffic leaving your Java app towards S3/another AZ is charged in both directions: use a gateway endpoint for S3, place Pods in the same AZ as the DB/Redis, and send large uploads through presigned URLs.

### Making teams "own" the numbers — the key to sustainability
- ResourceQuota/LimitRange per namespace = a **hard budget**: a team that wants more has a conversation with the quota, not with the nodes.
- Showback: a cost-per-service dashboard for every team; cost becomes part of architecture review — when somebody chooses "3 min replicas to be safe", immediately ask whether the budget was approved.
- A steady rhythm: monthly right-sizing of the top-10 waste plus the cost/1,000-transactions report. A one-off "-30%" project that then thaws usually climbs back to its old peak after two quarters — accompanied by one incident caused by a hand cut.

### Common mistakes
- Cutting requests without looking at throttling/eviction → a Friday-afternoon payment incident; the cost programme loses credibility permanently.
- VPA auto + HPA managing the same resource → two control loops fighting each other.
- Counting "number of Pods" instead of "amount of reservation": 40 Burstable Pods with small requests are usually cheaper than 8 Pods with enormous limits.
- Cutting monitoring "to save money": the postmortem bill of one incident that was not detected early costs more than a full year of Grafana.

> Senior tip: the two highest-ROI levers almost everywhere: **reducing minReplicas + right-sizing requests** (an average service hides 3–10Gi of dead reservation) and **switching dev/test off at night and on weekends**. Present the CFO the cost/1,000-transactions curve — it proves you are reducing unit cost, not merely benefiting from a low-traffic season.`,
    follow: [
      'A CPU request below average usage: when is it safe, when does it kill p99 — which metric do you decide with?',
      'One team per namespace: how do you design quota and a "request a quota increase" process so it does not turn into politics?',
      'Payment services need 100% on-demand but 30% of the cost is batch: how do you separate the costs without trading away the SLA?'
    ]
  },
});
