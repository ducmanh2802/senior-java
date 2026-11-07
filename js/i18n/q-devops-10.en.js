/*
 * English translation of js/data/q-devops.js — task T670. Format: js/core/i18n.js (content overlay).
 * ids: devops-053 devops-054 devops-055
 */
App.i18n.content({
  'devops-053': {
    q: 'A Java service is deployed on Kubernetes. You configure an HPA (Horizontal Pod Autoscaler) but run into 3 problems: (1) scale-up is far too slow when traffic spikes, (2) scale-down is too fast and kills Pods that are still warming up, (3) the CPU metric does not reflect the real load because JVM GC eats CPU. How do you solve each problem? Explain stabilization window, custom metrics, and JVM warm-up.',
    a: `**Summary:** **HPA** automatically raises or lowers the number of Pods based on a metric (CPU, memory, or a custom metric). Three problems are common with Java: (1) scale-up is slow because HPA only re-evaluates every 15s and a new Pod needs 30–90s for the JVM to boot and for JIT to warm up → make {{behavior.scaleUp}} more aggressive, keep a minReplicas buffer, and optimize startup; (2) a fast scale-down kills Pods that just finished warming up → use a long {{stabilizationWindowSeconds}} for scaleDown and a sufficient {{terminationGracePeriodSeconds}}; (3) the CPU metric is polluted by GC pauses → use a custom metric that sits closer to real load (RPS, p99 latency, queue depth) through Prometheus Adapter or KEDA.

### Background terms

- **HPA (Horizontal Pod Autoscaler)**: a Kubernetes controller that adjusts the {{spec.replicas}} of a Deployment/StatefulSet based on a metric. Formula: {{desiredReplicas = ceil(currentReplicas × currentMetric / targetMetric)}}.
- **Stabilization window**: the look-back period over which HPA reviews its previous scale recommendations before acting. It prevents flapping — scaling up, then down, then up again continuously. Defaults: scale-down 300s, scale-up 0s.
- **Custom metric**: any metric that is not the Pod's CPU/memory, for example requests per second, Kafka lag, queue length. You need {{metrics-server}} for CPU/memory, and **Prometheus Adapter** or **KEDA** for custom/external metrics.
- **JVM warm-up**: right after the JVM starts, code runs slowly in interpreted mode. The JIT compiler (C1/C2) gradually compiles the hot paths into native code → throughput rises, latency drops. This takes anywhere from 30 seconds to a few minutes depending on the workload.
- **GC (Garbage Collection)**: the JVM reclaims memory by itself. GC consumes CPU — in particular a long GC pause (Full GC) makes CPU spike even though traffic did not increase.

### An everyday analogy

HPA is like an automatic air-conditioning system. The **CPU metric** is like a temperature sensor placed next to the kitchen stove — when someone is cooking (GC running) the reading goes up even though no extra people entered the room (traffic did not go up). The **stabilization window** is like a timer: the air conditioner does not switch off the instant the temperature touches the threshold (that on/off cycling would wreck the compressor), it waits 5 minutes to confirm the temperature is genuinely stable. **JVM warm-up** is like a motorbike on a cold winter morning: right after you start it, it runs weakly and you have to blip the throttle for a few minutes before it smooths out — if you load it with heavy cargo immediately (route traffic to a Pod that has not warmed up), it lags (high latency).

### Problem 1: scale-up is too slow

**Combined cause**:
- HPA checks metrics only every 15s ({{--horizontal-pod-autoscaler-sync-period}}).
- After it decides to scale, a new Pod still needs: scheduling (1–5s) + image pull (0s if already cached) + JVM start (10–30s) + Spring context init (10–30s) + JIT warm-up (30–120s) + readiness probe pass.
- Total: 1–3 minutes between the moment traffic rises and the moment the new Pod actually serves well.

**Fix**:

~~~yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: payment-api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: payment-api
  minReplicas: 3              # buffer: always enough replicas to carry normal load
  maxReplicas: 20
  metrics:
    - type: Pods
      pods:
        metric:
          name: http_server_requests_per_second
        target:
          type: AverageValue
          averageValue: "50"   # 50 RPS per Pod
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0     # react as soon as the metric crosses the threshold
      policies:
        - type: Percent
          value: 100                    # allow doubling the replica count each time
          periodSeconds: 60
        - type: Pods
          value: 4                      # or add at most 4 Pods per 60s
          periodSeconds: 60
      selectPolicy: Max                 # take the policy that scales fastest
    scaleDown:
      stabilizationWindowSeconds: 600   # wait 10 minutes before scaling down
      policies:
        - type: Percent
          value: 10                     # drop at most 10% per 60s
          periodSeconds: 60
      selectPolicy: Min
~~~

**Java startup optimizations**:
- A long enough **startup probe**: {{initialDelaySeconds: 10, periodSeconds: 5, failureThreshold: 24}} (allows 130s). This keeps kubelet from killing a Pod that is still booting.
- The **readiness probe** should pass only when the app is genuinely ready (DB connected, cache warmed). Do not use the default {{/actuator/health}} if it reports UP too early.
- **CDS (Class Data Sharing)**: {{java -Xshare:auto -XX:SharedArchiveFile=app.jsa}} cuts class-loading time. Spring Boot 3.3+ supports {{-Dspring.context.exit=onRefresh}} to build the CDS archive.
- **GraalVM native image**: startup ~50ms, but the trade-offs are lower peak throughput than JIT, slow builds, and reflection that must be configured. A good fit for serverless / scale-to-zero; think twice for a long-running service.

### Problem 2: scale-down too fast kills Pods that are warming up

**Scenario**: traffic spikes → HPA scales up from 3 to 8 Pods → the 5 new Pods are booting, still warming up → traffic dips slightly → HPA scales down after 15s (if stabilization = 0) → it kills the 2 Pods that had just finished warming up → latency spikes → HPA scales up again → flapping.

**Fix**:
- {{stabilizationWindowSeconds: 600}} for scaleDown: HPA looks back over 10 minutes and only scales down if the metric stayed low across the whole 10 minutes.
- {{terminationGracePeriodSeconds: 120}}: a Pod that receives SIGTERM gets 120 seconds to finish the requests it is still holding (drain).
- **PreStop hook**: {{sleep 10}} so the load balancer / endpoint controller has time to remove the Pod from the endpoint list before the app stops accepting requests.

~~~yaml
# In the Pod spec
terminationGracePeriodSeconds: 120
containers:
  - name: app
    lifecycle:
      preStop:
        exec:
          command: ["sh", "-c", "sleep 10"]
~~~

- **PodDisruptionBudget** (PDB): {{minAvailable: 50%}} guarantees that scale-down and rolling updates cannot kill too many Pods at the same time.

### Problem 3: the CPU metric does not reflect real load

**Scenario**: the Java service is I/O-bound (waiting on the DB, making HTTP calls). CPU sits at 20% even though RPS is high and latency is climbing, so HPA never scales. Conversely, a Full GC spikes CPU to 90% for 2 seconds → HPA wants to scale up even though traffic is completely normal.

**Fix: a custom metric closer to real load**

| Metric | When to use | How to collect it |
|---|---|---|
| RPS (requests/second per Pod) | API service, load proportional to request count | Prometheus Adapter: rate of {{http_server_requests_seconds_count}} |
| p99 latency | SLA-driven, latency is what users actually feel | Prometheus Adapter, but be careful (latency rising because of a downstream dependency → scaling does not help) |
| Queue depth / consumer lag | Workers, Kafka consumers | KEDA scaler or Prometheus Adapter |
| Active connections / thread pool usage | Services with a bounded thread pool | Micrometer gauge → Prometheus → Adapter |

~~~yaml
# Prometheus Adapter config (ConfigMap) — map a PromQL expression to a custom metric
rules:
  - seriesQuery: 'http_server_requests_seconds_count{namespace!="",pod!=""}'
    resources:
      overrides:
        namespace: { resource: "namespace" }
        pod: { resource: "pod" }
    name:
      matches: "^(.*)_count$"
      as: "http_requests_per_second"
    metricsQuery: 'sum(rate(<<.Series>>{<<.LabelMatchers>>}[2m])) by (<<.GroupBy>>)'
~~~

**Note**: the CPU metric is still useful as a **floor** — put 2 metrics in the HPA (CPU + RPS) and HPA uses the higher of the two results (i.e. it scales more). This covers the case where RPS is low but a single request is consuming 100% of CPU.

### Real-world traps

- **Not setting {{requests.cpu}}**: CPU-based HPA computes {{currentMetric / targetMetric}} relative to {{requests}}. No request declared → HPA reports {{<unknown>}} → it never scales.
- **{{stabilizationWindowSeconds: 0}} for both scaleUp and scaleDown**: severe flapping. Always set a long scaleDown window (300–600s).
- **Target RPS set too high**: one Java Pod handles 200 RPS when warm but only 50 RPS when cold → HPA computes against 200 and creates too few Pods → the new cold Pods receive traffic → latency spikes. Set the target from the **average of cold and warm** throughput, not from a peak benchmark.
- **Custom metric lag**: Prometheus scrapes every 15–30s and the Adapter query adds delay → HPA decides based on data from 30–60 seconds ago. Combine it with a {{minReplicas}} buffer to absorb bursts.
- **The readiness probe returns 200 as soon as the Spring context is up**: traffic floods Pods that have not been JIT-warmed → p99 spikes 5–10x during the first 1–2 minutes. Use a custom readiness check: report UP only after the Pod has served N warm-up requests or after a delay.

> Senior tip: For Java on Kubernetes, HPA is **necessary but not sufficient**. The practical formula: (1) {{minReplicas}} enough to carry baseline load plus a 30% buffer, (2) HPA scales on **RPS or a custom metric** (not CPU alone), (3) fast scaleUp + slow scaleDown (10-minute stabilization), (4) optimize startup (CDS, a readiness probe that means something), (5) PDB + graceful shutdown. Measure it with a load test: ramp traffic from baseline to 3x in 2 minutes and watch whether p99 spikes and how long HPA takes to settle — that number is the system's real reaction time, not the 15s sync period.`,
    follow: [
      'You configure HPA with 2 metrics: CPU target 70% and RPS target 50/Pod. Right now CPU = 40% and RPS = 80/Pod. Which metric does HPA use to compute desiredReplicas, and why?',
      'Startup probe, liveness probe, readiness probe — how does each one affect HPA and traffic routing? A Java Pod needs 60s to warm up: how would you configure these 3 probes?',
      'When would you pick KEDA instead of HPA + Prometheus Adapter? Give a concrete workload that plain HPA cannot handle.'
    ]
  },
  'devops-054': {
    q: 'The team deploys a Java service with Argo Rollouts using a canary strategy: 5% → 25% → 50% → 100%. How do you configure an AnalysisTemplate that uses Prometheus metrics to promote or roll back automatically? When does the canary roll back wrongly (false positive), and when does it miss a real defect (false negative)?',
    a: `**Summary:** **Argo Rollouts** is a progressive delivery tool for Kubernetes that replaces the Deployment with a CRD called {{Rollout}} supporting canary and blue-green. An **AnalysisTemplate** defines the "checks" (metric query, threshold) that run inside each canary step — if a metric breaches the threshold (for example error rate > 1%) the rollout **aborts** automatically and the canary scales back to 0. Conversely, if every analysis passes it **promotes** to the next step automatically. The risks: **false positive** (a rollback that was not warranted) when traffic is low, the metric is noisy, or the baseline itself is unstable; **false negative** (a missed defect) when the sample at the 5% step is too small, the metric does not actually measure the bug, or the observation window is too short.

### Background terms

- **Progressive delivery**: releasing a new version gradually (1% → 5% → 25% → 100%) instead of replacing everything at once. It shrinks the blast radius (the scope of impact) when there is a defect.
- **Canary**: the new version receives a small slice of real traffic as a "trial". The name comes from canaries carried in coal mines — if the bird passed out, the miners knew there was gas.
- **Argo Rollouts**: a Kubernetes controller (CRD) that extends the Deployment concept. It manages 2 ReplicaSets (stable + canary), drives the traffic weight, and runs analyses.
- **AnalysisTemplate / AnalysisRun**: the {{AnalysisTemplate}} is a reusable "test" (Prometheus query, web hook, Job…). The {{AnalysisRun}} is the instance actually executed during a rollout. Possible results: {{Successful}}, {{Failed}}, {{Inconclusive}}.
- **Promote / Abort**: promote = the canary passed, move to the next step or finish (the canary becomes stable). Abort = the analysis failed, roll back (canary scales to 0, stable takes 100% again).
- **Baseline comparison**: compare the canary's metric with the stable version's metric at the same moment, instead of comparing against a fixed threshold. This avoids false positives when the whole system is already degraded (not because of the canary).

### An everyday analogy

It is like opening a new restaurant branch. Instead of changing the entire menu (deploy 100%) and only then discovering that customers complain, you trial the new dish on 5% of customers (canary 5%) and watch: does the complaint rate rise? Do customers come back? If that first 5% is happy, extend to 25%. If the complaint rate doubles → pull the new dish (abort). But if only 10 people tried it (a tiny sample), one complaint = 10% — it sounds alarming, yet it is not enough evidence to conclude anything (false positive). Conversely, a subtle defect in the new dish that only 2% of customers would notice — with 10 tasters, maybe nobody hits it at all (false negative).

### Rollout + AnalysisTemplate configuration

~~~yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: payment-api
spec:
  replicas: 10
  strategy:
    canary:
      canaryService: payment-api-canary   # Service pointing at the canary Pods
      stableService: payment-api-stable   # Service pointing at the stable Pods
      trafficRouting:
        nginx:
          stableIngress: payment-api-ingress
      steps:
        - setWeight: 5
        - pause: { duration: 5m }          # wait 5 minutes to collect metrics
        - analysis:
            templates:
              - templateName: error-rate-check
            args:
              - name: service
                value: payment-api-canary
        - setWeight: 25
        - pause: { duration: 10m }
        - analysis:
            templates:
              - templateName: error-rate-check
              - templateName: latency-check
            args:
              - name: service
                value: payment-api-canary
        - setWeight: 50
        - pause: { duration: 10m }
        - analysis:
            templates:
              - templateName: error-rate-check
              - templateName: latency-check
        - setWeight: 100
      # Roll back automatically when the analysis fails
      abortScaleDownDelaySeconds: 30
~~~

~~~yaml
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: error-rate-check
spec:
  args:
    - name: service
  metrics:
    - name: error-rate
      interval: 60s                  # run the check every 60 seconds
      count: 5                       # run it 5 times
      failureLimit: 2                # failing 2 out of 5 times → abort
      successCondition: result[0] < 0.01   # error rate below 1%
      failureCondition: result[0] >= 0.05  # error rate at or above 5% → fail immediately
      inconclusiveLimit: 3           # 3 inconclusive runs → inconclusive
      provider:
        prometheus:
          address: http://prometheus.monitoring.svc:9090
          query: |
            sum(rate(http_server_requests_seconds_count{
              service="{{ args.service }}", status=~"5.."
            }[5m]))
            /
            sum(rate(http_server_requests_seconds_count{
              service="{{ args.service }}"
            }[5m]))
~~~

~~~yaml
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: latency-check
spec:
  args:
    - name: service
  metrics:
    - name: p99-latency
      interval: 60s
      count: 5
      failureLimit: 2
      successCondition: result[0] < 500    # p99 below 500ms
      provider:
        prometheus:
          address: http://prometheus.monitoring.svc:9090
          query: |
            histogram_quantile(0.99,
              sum(rate(http_server_requests_seconds_bucket{
                service="{{ args.service }}"
              }[5m])) by (le)
            ) * 1000
~~~

### The canary flow with analysis

~~~seq
title: Argo Rollouts canary with automated analysis
actors: Argo Rollouts | Canary Pod | Stable Pod | Prometheus | SRE
Argo Rollouts -> Canary Pod: Deploy canary, setWeight 5%
Argo Rollouts -> Argo Rollouts: Pause for 5 minutes
Argo Rollouts -> Prometheus: Query error-rate (5 runs, every 60s)
Prometheus --> Argo Rollouts: result = 0.003 (OK)
Argo Rollouts -> Canary Pod: setWeight 25%
Argo Rollouts -> Prometheus: Query error-rate + p99
Prometheus --> Argo Rollouts: error-rate = 0.08 (FAIL)
Argo Rollouts -> Canary Pod: Abort — scale to 0
Argo Rollouts -> Stable Pod: 100% of traffic back to stable
Argo Rollouts -> SRE: Notification (Slack/webhook)
~~~

### False positive: an unwarranted rollback

| Cause | Example | Mitigation |
|---|---|---|
| **Sample too small** at the 5% step | 5% of 100 RPS = 5 RPS. One error = a 20% error rate | Set {{count}} large enough, increase the {{pause}} duration, use {{inconclusiveLimit}} (not enough data → wait, do not abort) |
| **JVM cold start** of the canary Pod | A fresh Pod spends 60s warming up, p99 spikes 3x → the latency check fails | Warm up first: use {{setCanaryScale}} to add Pods before {{setWeight}}, or use a readiness gate plus a delayed analysis start |
| **Noisy metric** (noisy baseline) | The service already oscillates between 0.5–2% error rate | Use **baseline comparison** (canary vs stable at the same time) instead of a fixed threshold |
| **A dependency failure blamed on the canary** | The DB slows down → both stable and canary error out | Baseline comparison: canary error rate / stable error rate < 1.5 |
| **{{failureLimit}} too twitchy** | 1 failure out of 5 runs → abort, even though the other 4 were fine | Set {{failureLimit: 2}} or 3, and pair it with an explicit {{successCondition}} |

**Baseline comparison** (supported by Argo Rollouts through an {{AnalysisTemplate}} with 2 queries, or via Kayenta/Datadog):

~~~yaml
metrics:
  - name: canary-vs-stable
    interval: 60s
    count: 5
    failureLimit: 2
    provider:
      prometheus:
        query: |
          (
            sum(rate(http_server_requests_seconds_count{service="{{args.canary}}",status=~"5.."}[5m]))
            / sum(rate(http_server_requests_seconds_count{service="{{args.canary}}"}[5m]))
          ) - (
            sum(rate(http_server_requests_seconds_count{service="{{args.stable}}",status=~"5.."}[5m]))
            / sum(rate(http_server_requests_seconds_count{service="{{args.stable}}"}[5m]))
          )
    successCondition: result[0] < 0.005    # the canary may be at most 0.5% worse than stable
~~~

### False negative: a real defect slips through

| Cause | Example | Mitigation |
|---|---|---|
| **Sample too small** at 5% | A bug that only hits 1% of requests (an edge case) → 5% traffic × 1% = 0.05% → you may never see it | Increase total traffic, lengthen the pauses, add a 10% step |
| **The metric does not measure that bug** | The canary returns HTTP 200 but the response body is wrong (a logic bug) | Add a **business metric** (successful order rate, checksum) or a **synthetic test** (a Job running test cases) |
| **Observation window too short** | A memory leak: fine for the first 5 minutes, OOM 30 minutes later | Add a longer-running analysis at the final step, watch the memory trend |
| **The bug only appears under a specific traffic pattern** | It only triggers when a user posts a payload larger than 1MB, and the 5% canary never received such a request | Traffic mirroring (shadow traffic) before the canary, or header-based routing so you can replay specific traffic |
| **Threshold too loose** | {{successCondition: result[0] < 0.05}} (a 5% error rate still passes) | Set thresholds from the real SLO and review them periodically |

### Real-world traps

- **No {{failureCondition}}**: with only a {{successCondition}}, a metric returning a "middle" value (neither a clear pass nor a clear fail) produces repeating {{Inconclusive}} results. Define both a {{failureCondition}} (abort fast when things are clearly bad) and an {{inconclusiveLimit}}.
- **Prometheus query divides by zero**: the canary was just deployed and has received no request yet → denominator = 0 → the query returns NaN/Inf → the analysis ends {{Inconclusive}} or {{Error}}. Add an {{or vector(0)}} clause and handle empty results inside the query.
- **Canary and stable share a DB migration that is not compatible**: the canary runs new code that needs a new column while stable still runs the old code — the migration must be **backward-compatible** (expand-contract pattern). The canary analysis will pass, but a rollback afterwards can break.
- **{{abortScaleDownDelaySeconds}} too short**: once the abort happens the canary Pods are deleted immediately → you lose the logs/metrics you need to debug. Set 30–60s, or keep the Pods in the {{Paused}} state so you can investigate.

> Senior tip: Canary analysis is only as good as the metrics you measure. Start with 2 metrics: **error rate** (5xx) and **p99 latency** — compare against the baseline (canary vs stable), do not use fixed thresholds. Add business metrics (conversion, success rate) once that is stable. Always keep a **manual gate** (a {{pause}} step with no duration, waiting for {{kubectl argo rollouts promote}}) at the step before 100% for a critical service — full automation is the goal, but reaching it takes many tuning iterations. Record every false positive and false negative and adjust {{failureLimit}}, {{count}}, {{interval}}: an analysis template is a "production test suite" and needs maintenance just like test code.`,
    follow: [
      'Why is baseline comparison (canary vs stable at the same moment) better than a fixed threshold? Give a concrete case where a fixed threshold causes a false positive even though the canary has no defect.',
      'The 5% canary step runs on a service with 20 RPS. The analysis runs 5 times, once every 60s. On average how many requests does each query cover? Is that enough to conclude anything about a 1% error rate? What would you adjust?',
      'The canary passes every analysis and is promoted to 100%. Two hours later you find a memory leak (OOMKilled every 3 hours). The analysis missed it — what analysis would you add, and at which step?'
    ]
  },
  'devops-055': {
    q: 'A company has 20 teams, and each team builds its own CI/CD pipeline for its Java services. The result: 20 different ways to deploy, onboarding a new developer takes 2 weeks just to understand the pipeline, and incidents caused by broken pipelines keep rising. How would you design an Internal Developer Platform (IDP) with a "golden path"? How do you get teams to adopt it voluntarily without it being seen as a top-down mandate?',
    a: `**Summary:** An **Internal Developer Platform (IDP)** is a self-service layer built by a platform team so product teams can ship code fast without understanding the infrastructure in depth. The **golden path** is "the default way of working that is best supported" — for example: create a new service from a template and it already has CI/CD, observability, security scanning, and a Kubernetes deploy — everything works in 30 minutes instead of 2 weeks. The golden path is not mandatory (teams may still take another route), but it is designed to be good enough that teams **want** to use it. Success depends on: solving real pain, co-designing with the teams, measuring adoption, and running the platform like an internal product.

### Background terms

- **IDP (Internal Developer Platform)**: the collection of tools, templates, APIs and UI that a platform team provides so developers can help themselves (create a service, deploy, read logs, provision a DB) without filing a ticket to ops. Example tools: Backstage (Spotify), Port, Humanitec.
- **Platform team**: the team dedicated to building and operating the IDP. Its customers are the product teams (internal developers), not end users.
- **Golden path**: the default, documented, supported process that covers 80% of common use cases. A "paved road" — driving on it is smooth; going off it is allowed, but you own the consequences.
- **Self-service**: the developer performs actions (create a service, provision a DB, deploy) through a UI/CLI/API without waiting for anyone to approve manually. Automated guardrails (limits, policies) sit underneath.
- **Cognitive load**: the amount of knowledge a developer has to hold in their head to get work done. 20 different pipelines = high cognitive load whenever a developer moves between teams.

### An everyday analogy

Think of the road system in a city. **Without an IDP**: every residential district builds its own dirt road to the city centre — some wide, some narrow, some muddy; someone who moves in spends 2 weeks just learning the routes. **With a golden path**: the city builds a standard paved road (template) connecting every district to the centre, with signs (docs), traffic lights (CI/CD stages) and surveillance cameras (observability). Anyone can still dig their own private road if they need to, but 90% of people take the paved one because it is faster and safer. The **platform team** is like the department of transport: they do not drive for you, they build and maintain the roads.

### Golden path design for a Java service

~~~text
Golden Path: "Create a new Java service → Production within one day"

Step 1: The developer runs a command (or uses the Backstage UI)
  $ platform create-service --name order-service --type java-spring --team checkout

Step 2: The template automatically creates:
  ├── Git repo (order-service/)
  │   ├── src/                    (Spring Boot skeleton)
  │   ├── Dockerfile              (multi-stage, standard base image)
  │   ├── pom.xml                 (internal parent POM, standard dependencies)
  │   ├── .gitlab-ci.yml          (standard pipeline: build → test → scan → deploy)
  │   ├── k8s/                     (Helm chart or Kustomize base)
  │   │   ├── deployment.yaml     (probes, resources, security context)
  │   │   ├── service.yaml
  │   │   └── hpa.yaml
  │   ├── catalog-info.yaml       (Backstage metadata)
  │   └── README.md               (team-specific instructions)
  ├── CI/CD pipeline (pre-configured, runs immediately)
  ├── Argo CD Application (GitOps, deploys to staging)
  ├── Grafana dashboard (RED metrics, generated from a template)
  ├── PagerDuty/OpsGenie service (on-call routing)
  └── Slack channel #alerts-order-service

Step 3: The developer pushes code → the pipeline runs → automatic deploy to staging
Step 4: Promote to production through a merge request (with an approval gate)
~~~

### IDP architecture (the components)

| Component | Example tooling | Function |
|---|---|---|
| **Service catalog** | Backstage, Port | An inventory of every service, its owner, docs and status. "Who owns service X?" |
| **Scaffolding/templates** | Backstage Software Templates, Cookiecutter | Create a new service from a standard template |
| **Standard CI/CD** | Shared pipeline library (GitLab CI includes, GitHub reusable workflows) | One consistent pipeline: build, test, SAST, container scan, deploy |
| **GitOps** | Argo CD, Flux | Declarative deploys, audit trail kept in Git |
| **Observability by default** | OTel SDK auto-instrumentation, Grafana dashboard templates | Metrics, traces and logs exist the moment the service is created |
| **Secret management** | ESO + AWS Secrets Manager | Self-service secret creation, automatic rotation |
| **Infrastructure self-service** | Crossplane, Terraform modules | Developers create their own DB, queue, bucket through a PR/YAML (with guardrails) |

### How to get teams to adopt it voluntarily (no mandate)

**1. Solve a real pain, not an imagined one**

Before building anything, interview 5–8 teams: "Where do you spend the most time when shipping code?" The answers are usually: "setting up CI takes 3 days", "I do not know how to configure Kubernetes", "every production deploy needs help from ops". The golden path must solve exactly these pains — not ship a pretty portal nobody needs.

**2. Co-design, do not hand off**

Invite developers from 2–3 teams to help design the templates and the pipeline. They know the real edge cases. Once they have contributed to building it, they become "champions" who push their own team to use it. The platform team does **not** finish building it and then throw it over the wall.

**3. A golden path, not a golden cage**

- Teams **are allowed** to take a different route (custom pipeline, their own config) — but they then own operating it.
- The golden path should be **easy to opt out of**, not hard to opt into. Default = golden path; stepping outside = you have a reason and you support it yourself.
- Provide **extension points**: the template allows overrides (for example adding your own build step) without forking the whole pipeline.

**4. Measure adoption by value, not by command**

| Metric | What it means | Target |
|---|---|---|
| Time to first deploy (new service) | From repo creation to a staging deploy | < 1 day (previously: 2 weeks) |
| Deployment frequency | Deploys per week per team | Rising (easy to deploy = more deployments) |
| Lead time for changes | Commit → production | Falling |
| Adoption rate | % of services on the golden path | Track the trend, do not set a hard quota |
| Developer satisfaction (survey) | Internal NPS/CSAT | > 7/10 |

Do not impose a KPI like "100% of teams must be on the golden path by Q3" — that is a mandate. Instead show the numbers: "teams on the golden path deploy 5x faster, pipeline-caused incidents down 60%."

**5. Run the platform like an internal product**

- The platform team has a **roadmap, backlog, sprints** — prioritised by what product teams actually need.
- There is a **support channel** (Slack #platform-help) with a response SLA.
- **Docs, examples, a migration guide** for teams moving off an old pipeline.
- A **changelog**: announce template/pipeline updates, with a migration path.
- Collect feedback regularly (quarterly survey, office hours).

### Real-world traps

- **Building the platform before understanding the problem**: 6 months building a beautiful Backstage portal, while the teams' real pain is "waiting 2 weeks for ops to provision a DB" — the portal does not solve it. Talk to the teams first, build the most painful thing first.
- **A golden path that is too rigid**: the template allows no overrides → teams with special needs (a gRPC service, a batch job, an ML pipeline) get squeezed into the mould → they fork the template and never come back. Design extension points.
- **The platform team becomes the bottleneck**: every pipeline change must be reviewed/merged by the platform team → teams wait, the platform team is overloaded. Let teams contribute to the templates (inner-source model); the platform team reviews but is not the only one who can change things.
- **Not maintaining the templates**: a template from a year ago, outdated dependencies, a base image with a CVE → every service born from it starts in technical debt. Schedule periodic template updates, automate dependency-bump PRs.
- **A "big bang" forced migration**: requiring 20 teams to switch pipelines within one month → resistance, failures, burnout. Migrate gradually: new teams use the golden path by default, existing teams migrate when there is an occasion (a refactor, a new feature). Set soft deadlines and provide migration support.

> Senior tip: An IDP succeeds when developers **stop thinking about the platform** — they only see "creating a new service takes 10 minutes, deploys are easy, the dashboard is already there". Measure success by "time to first deploy" and "developer satisfaction", not by "how many features the platform has". Start small: one golden path for the single most common service type (a Spring Boot REST API), make it genuinely good, get 3–5 teams using it successfully and talking it up — only then expand. A 2–3 person platform team serving 20 teams is viable if the golden path removes 80% of ops tickets, but only when the scope is tightly controlled.`,
    follow: [
      'One team wants to use Quarkus instead of Spring Boot, and the golden path only supports Spring Boot. How do you handle it — extend the golden path, let the team build its own, or refuse? What are the deciding criteria?',
      'How would you measure that "cognitive load" actually dropped after the IDP arrived? Which metrics specifically, and how do you collect that data?',
      'The platform team has 3 people and 20 product teams. Six months later the platform team has become the bottleneck (every request waits on them). How do you restructure how it operates?'
    ]
  }
});
