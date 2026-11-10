/*
 * English translation of js/data/q-devops.js — task T976. Format: js/core/i18n.js (content overlay).
 * ids: devops-093 devops-094 devops-095 devops-096 devops-097 devops-098 devops-099 devops-100 devops-101 devops-102 devops-103
 */
App.i18n.content({
  'devops-093': {
    q: 'At large scale, how do rolling updates with maxSurge/maxUnavailable, readiness/liveness/startup probes, preStop, and terminationGracePeriodSeconds interact? How would you design a zero-downtime deployment strategy and what guardrails would you put in place?',
    a: `**Summary:** A rolling update replaces Pods gradually according to {{maxSurge}} (extra Pods created) and {{maxUnavailable}} (Pods allowed to be missing). Zero-downtime requires: a new Pod only receives traffic when it is truly ready (after startup/warm-up), an old Pod leaves traffic gently before it shuts down (preStop + graceful shutdown), and it is not SIGKILLed mid-flight (a sufficient grace period). At large scale you also need PDB, minReadySeconds, progressDeadline/automatic rollback, canary for high-risk changes, and schema/config backward compatibility because two versions run side by side.

### Terms (explained for beginners)
- **maxSurge / maxUnavailable**: surge is the number of Pods above the desired count; unavailable is the number of Pods allowed to be not ready during the update.
- **Readiness/Liveness/Startup probe**: readiness decides whether a Pod receives traffic; liveness restarts it when it is "stuck"; startup gives it time to boot before liveness/readiness become strict.
- **preStop hook**: runs before SIGTERM; often uses {{sleep}} to wait for the endpoint to be removed from the proxy.
- **terminationGracePeriodSeconds**: the maximum time before SIGKILL; it must be enough for preStop + graceful shutdown.
- **PDB (PodDisruptionBudget)**: limits how many voluntary disruptions (drain/upgrade) can happen at the same time.

### How the mechanics interact (step by step)
1. **New Pod**: scaled up according to surge. After startup passes and then readiness passes, it becomes Available and enters the EndpointSlice.
2. **Old Pod**: when a new Pod becomes Available, the Deployment scales the old Pod down. Two flows run in parallel:
   - The Endpoint controller removes the Pod from the EndpointSlice -> the proxy updates (with propagation delay).
   - Kubelet runs preStop, then sends SIGTERM; the app (Spring {{server.shutdown=graceful}}) stops accepting new requests and waits for in-flight ones.
3. **Race that causes 502s**: without preStop the app closes the socket while the proxy still routes to it. A short grace period -> SIGKILL cuts requests.

~~~text
Old Pod Terminating
  t0: endpoint removed (propagates gradually)  ||  preStop sleep 10s (still serving)
  t10: SIGTERM -> graceful drain of in-flight requests
  t40: done
  t60: terminationGracePeriod expires -> SIGKILL (if still running)
~~~

### Example configuration
~~~yaml
strategy:
  type: RollingUpdate
  rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }
minReadySeconds: 15
template:
  spec:
    terminationGracePeriodSeconds: 60
    containers:
    - name: payment
      lifecycle:
        preStop: { exec: { command: ["sh","-c","sleep 10"] } }
      readinessProbe:
        httpGet: { path: /actuator/health/readiness, port: 8080 }
      livenessProbe:
        httpGet: { path: /actuator/health/liveness, port: 8080 }
      startupProbe:
        httpGet: { path: /actuator/health/liveness, port: 8080 }
        failureThreshold: 30
~~~
Spring: {{server.shutdown=graceful}}, {{spring.lifecycle.timeout-per-shutdown-phase=30s}}.

### The role of each probe (avoid restart storms / receiving traffic too early)
| Probe | Mistake | Consequence |
|---|---|---|
| startup | Liveness is too aggressive for an app that takes 90s to start | Liveness kills it -> CrashLoop, rollout stuck |
| readiness | Only checks that the TCP port is open, DB/cache not warmed | New Pod receives traffic -> errors/latency |
| liveness | Checks the DB/external dependency | Slow DB -> mass restarts |

Principle: liveness checks "is the process still alive"; readiness checks "should it receive traffic".

### Guardrails at large scale (lead)
- **PDB**: always keep a minimum number of Pods during a drain; coordinate with replicas.
- **minReadySeconds**: a Pod must stay Ready and stable before advancing a step.
- **progressDeadlineSeconds** + automatic rollback/canary (Argo Rollouts/Flagger/CI).
- **Backward compatibility**: DB schema expand-contract, backward-compatible API (old/new versions run side by side).
- **Sufficient grace period**: > preStop + shutdown timeout + buffer.

### In production
- **Symptoms**: 502/503 during deploy; per-version spike; Kafka consumers reprocessing due to SIGKILL before commit.
- **How to measure**: continuous load test during the deploy (error budget must not be exceeded), error rate/latency per version, rollout events, actual shutdown time.
- **Tuning**: preStop 5-15s depending on the LB; increase the grace period for long requests but support idempotency/retry; distroless images use the sleep action/httpGet drain.

### Common wrong answers
- "Rolling updates are zero-downtime by default": no, not if probes/shutdown are wrong.
- "preStop sleep alone is enough": you still need graceful shutdown and a sufficient grace period.
- "maxUnavailable 0 is always best": it costs surge capacity; a small cluster may not have room.

### Common pitfalls
1. **Liveness checks an external dependency**: mass restarts when the DB is slow. Prevention: keep liveness internal.
2. **Grace period < processing time of a long request**: SIGKILL cuts it off. Prevention: measure P99 processing time, increase the grace period.
3. **Breaking schema while two versions run**: business errors. Prevention: expand-contract, feature flags.

### Interview answer (lead)
"Zero-downtime is coordination: the rolling update controls speed (usually maxUnavailable 0, modest surge), startup/readiness ensure the new Pod is ready, and preStop + graceful SIGTERM + a sufficient terminationGracePeriod let the old Pod leave gently and finish in-flight work. At large scale I add PDB, minReadySeconds, progressDeadline, automatic rollback/canary, and backward compatibility. I do not trust configuration by gut feel: I run a continuous load test during deploys on staging with error rate/latency thresholds as a gate."

> Senior tip: Treat a deploy as a controlled experiment: measure error rate per version, roll back automatically when thresholds are exceeded, and rehearse the runbook. Many "zero-downtime" failures come from DB migrations or slow dependencies, not just YAML — guardrails must cover the data layer too.`,
    follow: [
      'How would you design a deploy when requests can run for 2-5 minutes (long-running) without cutting them off?',
      'How does a PDB interact with node drain and rolling updates, and when can a PDB block both?',
      'When would you choose canary/blue-green over a pure rolling update for a payment service?'
    ]
  },
  'devops-094': {
    q: 'What formula does the HPA (Horizontal Pod Autoscaler) use to compute the number of replicas? How does the stabilization window work, and when scaling on a custom metric (e.g. RPS, queue depth) via the Prometheus Adapter, how does the data pipeline flow? How do you avoid scaling oscillation (flapping)?',
    a: `**Summary:** HPA (v2) reads metrics from the Metrics API, computes {{desiredReplicas = ceil(currentReplicas * currentMetric / targetMetric)}} for each metric, then picks the appropriate value (usually the max to satisfy the most constrained metric), within min/max. The stabilization window keeps a history of recommendations to avoid flapping: scale down looks back 300s by default. Custom metrics flow through Prometheus -> Adapter -> Custom/External Metrics API -> HPA. You need the right metric (per-pod when appropriate), noise resistance, and an understanding of pipeline latency.

### Terms (explained for beginners)
- **HPA**: a controller that automatically increases/decreases a workload's replicas based on metrics.
- **Metrics API**: the API that provides CPU/memory (usually via metrics-server).
- **Custom/External Metrics API**: the API for custom/external metrics, usually provided by the Prometheus Adapter.
- **Prometheus Adapter**: reads metrics from Prometheus and "translates" them into an API the HPA understands.
- **Stabilization window**: the time window in which the HPA considers previous recommendations to reduce oscillation.
- **Flapping**: scaling up and down repeatedly due to noisy metrics or unsuitable configuration.

### The replica formula (step by step)
1. Read {{currentMetricValue}} (e.g. average CPU 90% of the request) and {{target}} (60%).
2. {{desired = ceil(currentReplicas * currentMetricValue / target)}}. Example: ceil(4 * 90 / 60) = 6.
3. Apply a tolerance (default ~10%) to avoid reacting to small fluctuations.
4. Multiple metrics -> compute desired for each metric and pick the **highest**.
5. Clamp to {{minReplicas}}..{{maxReplicas}}, then apply behavior (stabilization, policies).

~~~text
4 replicas, CPU avg 90%, target 60%  -> ceil(4*90/60)=6
6 replicas, RPS/pod avg 120, target 100 -> ceil(6*120/100)=8
=> HPA picks 8 (max of the proposals)
~~~

### Stabilization window (mechanics)
- {{scaleDown.stabilizationWindowSeconds}} defaults to 300: the HPA looks at desired values in the window and picks the **highest** when scaling down -> it keeps Pods longer, avoiding cutting too early.
- Scale up usually has a window of 0 to react quickly.
- {{policies}} limit the rate (e.g. at most +100%/30s, decrease 1 Pod/60s).

~~~yaml
behavior:
  scaleUp:
    stabilizationWindowSeconds: 0
    policies: [{ type: Percent, value: 100, periodSeconds: 30 }]
  scaleDown:
    stabilizationWindowSeconds: 300
    policies: [{ type: Pods, value: 1, periodSeconds: 60 }]
~~~

### Custom metric pipeline (Prometheus Adapter)
~~~seq
title: HPA custom metric (RPS)
actors: App | Prometheus | Adapter | API Server | HPA
App -> Prometheus: scrape /metrics
Prometheus -> Prometheus: recording rule rate()
Adapter -> Prometheus: PromQL query
Adapter -> API Server: custom.metrics.k8s.io
HPA -> API Server: GET custom metric
HPA -> HPA: compute desiredReplicas
~~~
Cumulative latency (scrape, eval, adapter, HPA sync ~15s) can be 30-60s+ -> the HPA reacts on the order of minutes.

### In production
- **Symptoms**: slow scale-up; flapping; scaling to the maximum due to a misconfigured metric; low CPU but bad latency (I/O-bound).
- **How to measure**: {{kubectl describe hpa}} (current metric, desired, events), inspect the source metric in Prometheus and the adapter mapping.
- **Tuning**: choose a metric close to the load (lag/queue for consumers, RPS/in-flight for I/O-bound APIs). Use the correct per-pod average metric type. Scale up fast/scale down slowly. minReplicas high enough for baseline; maxReplicas constrained by downstream (DB connections = pool * replicas). For Java: correct readiness to avoid artificial CPU due to JIT.

### Common wrong answers
- "HPA scales instantly when the target is exceeded": there is a sync cycle + pipeline latency.
- "More metrics is always better": it may pick the max and over-scale if one metric is noisy.
- "CPU is enough for every service": I/O-bound services can have low CPU but high latency.

### Common pitfalls
1. **Misconfigured custom metric (label/PromQL)**: the HPA reads 0 or a wrong value -> wrong scaling. Prevention: inspect the custom metrics API.
2. **Confusing a total metric with a per-pod metric**: wrong formula. Prevention: use the correct type (Pods/AverageValue).
3. **Flapping because the target sits close to noise**: increase stabilization, smooth (rate window).
4. **maxReplicas exceeds the number of Kafka partitions**: wasted Pods, rebalances. Prevention: maxReplicas <= partitions.

### Interview answer
"HPA computes desired = ceil(currentReplicas * currentMetric / target) for each metric, applies a tolerance, and picks the value that satisfies the most constrained metric within min/max. The stabilization window (scale down defaults to 300s) keeps a history of recommendations to avoid flapping. A custom metric flows from the app -> Prometheus -> Adapter -> Custom Metrics API -> HPA, so there is tens of seconds of latency. I choose a metric close to the load (RPS/lag) over CPU for I/O-bound services, scale up fast/scale down slowly, and always check downstream limits such as DB connections when setting maxReplicas."

> Senior tip: Always run {{kubectl describe hpa}} to see the metric the HPA actually observes — many autoscaling incidents come from an adapter/PromQL returning a value different from what you expect. Do not forget that maxReplicas * connection pool can self-DDoS the database.`,
    follow: [
      'When the HPA uses multiple metrics, how do you debug a case where replicas are pushed up by a secondary metric?',
      'How do you design a stable per-pod RPS metric (noise-resistant) for the HPA?',
      'How does KEDA differ from plain HPA and when would you choose KEDA for a queue/cron?'
    ]
  },
  'devops-095': {
    q: 'How do HPA, PodDisruptionBudget (PDB), and the Cluster Autoscaler interact during a sudden traffic spike and when a node is maintained/drained? How would you design disruption and capacity policies to scale quickly without breaking the SLO?',
    a: `**Summary:** HPA increases/decreases replicas based on metrics (minutes); the Cluster Autoscaler (CA) adds/removes nodes when Pods are Pending due to insufficient resources or nodes are underutilized (minutes to tens of minutes). A PDB limits how many voluntary disruptions can happen at once (drain, upgrade). Interaction: HPA scales up -> Pods Pending -> CA adds a node (slow); a node drain respects the PDB so it can be blocked if the PDB is too tight/there are too few replicas. The design needs balanced minReplicas/PDB/maxUnavailable, headroom for bursts, maxReplicas constrained by downstream, and a maintenance process with a checklist.

### Terms (explained for beginners)
- **Cluster Autoscaler (CA)**: adds nodes when Pending Pods cannot be scheduled due to insufficient resources; removes nodes when they are safely underutilized.
- **PDB (PodDisruptionBudget)**: "always keep at least X Pods" ({{minAvailable}}) or "at most Y Pods disrupted" ({{maxUnavailable}}) for **voluntary** disruptions (drain).
- **Drain node**: evict Pods from a node for maintenance; it respects the PDB.
- **SLO (Service Level Objective)**: a service-level target (e.g. 99.9% success, p99 < 300ms).

### Interaction (step by step)
#### Sudden traffic spike
1. The metric rises -> HPA increases desired replicas -> new Pods are created.
2. Enough resources: the scheduler places Pods -> startup/readiness -> they receive traffic.
3. Not enough resources: Pods become Pending ({{Insufficient cpu/memory}}).
4. The CA sees Pending Pods that can be resolved by adding a node -> scales the node pool (cloud API). **Latency**: several minutes (provision + join + image pull).
5. The new node becomes Ready -> Pods are placed -> warm-up. A short spike may pass before it catches up.

#### Node maintenance/drain
1. A drain evicts Pods voluntarily.
2. The Eviction API checks the PDB: if violated -> the eviction is denied/deferred.
3. Pods are recreated on other nodes; if there is no room -> Pending -> the CA may add a node.
4. A PDB that is too tight (minAvailable = replicas) or too few replicas -> the drain gets stuck.

~~~text
HPA: increase replicas -> Pods Pending -> CA: add node (minutes)
Drain: evict Pod -> PDB allows? -> no: drain blocked
~~~

### Policy design (lead, trade-offs)
| Goal | Mechanism | Trade-off |
|---|---|---|
| Absorb bursts quickly | High minReplicas, headroom/overprovisioning | Cost |
| Flexible scaling | HPA + CA | Latency to add nodes, Java cold start |
| No drop during maintenance | Reasonable PDB, enough replicas | A too-tight PDB blocks drain/upgrade |
| Protect downstream | maxReplicas * pool <= DB limit | Caps scaling |

~~~yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: payment-pdb }
spec:
  maxUnavailable: 1
  selector: { matchLabels: { app: payment } }
~~~
With small replica counts (2-3), be careful with an absolute {{minAvailable}}; ensure at least 1 Pod can always be evicted during a drain.

### In production
- **Symptoms**: a drain hangs (PDB block); HPA scales but Pods stay Pending for a long time (slow CA/cloud quota); SLO drops after maintenance.
- **How to measure**: {{kubectl get/describe pdb}} (Allowed disruptions), FailedScheduling events, CA logs, node provisioning time, SLO/error budget.
- **Tuning**: minReplicas based on baseline load; scheduled scaling for predictable peaks. A PDB of {{maxUnavailable: 1}} so drains make progress; increase replicas before a large upgrade. Configure the CA node pool, consider image pre-pull/buffer. Compute maxReplicas including DB connections. "Game day": drain a node, burst test, verify PDB/CA.

### Common wrong answers
- "A PDB prevents any Pod from being killed": it only applies to **voluntary** disruptions; node death/OOMKilled/preemption are not blocked by a PDB in that way.
- "CA makes HPA scale instantly": CA adds nodes slowly; it does not replace app warm-up.
- "The tighter the PDB the safer": too tight causes operational deadlock and delays security patching.

### Common pitfalls
1. **Replicas = 1, PDB minAvailable 1**: the node cannot be drained. Prevention: >=2 replicas for HA + a reasonable PDB.
2. **maxReplicas is large but the DB only handles N connections**: scaling takes down the DB. Prevention: end-to-end capacity planning.
3. **Slow CA + Java cold start**: SLO violation. Prevention: buffer capacity, reduce startup time.
4. **Not checking Allowed disruptions**: surprises during a drain. Prevention: {{kubectl describe pdb}} in the runbook.

### Interview answer (lead)
"HPA decides replicas from metrics, CA decides nodes when Pending Pods lack resources — two loops with different speeds. A PDB protects the minimum number of Pods during voluntary disruptions (drain), so it can block eviction if it is too tight. I design for: enough minReplicas for baseline, HPA scales up fast/scale down slowly, maxReplicas constrained by downstream (DB pool), a PDB that lets drains make progress (maxUnavailable 1) and always enough replicas to make the PDB feasible. For hard-to-predict bursts I accept headroom/scheduled scaling; for maintenance I scale up replicas first and check Allowed disruptions. A PDB does not protect against node crashes or OOMKilled — that is the job of HA and fault-tolerant design."

> Senior tip: Before a node pool upgrade: enough replicas, {{kubectl describe pdb}} shows Allowed disruptions remaining, CA/cloud quota is sufficient, and the SLO dashboard is ready. Many "drain stuck for 2 hours" incidents happen simply because PDB minAvailable equals the exact current replica count.`,
    follow: [
      'How do you compute minAvailable/maxUnavailable for a PDB when the service replicas change with HPA?',
      'What criteria does the Cluster Autoscaler use to decide to scale a node down, and which Pods can block that?',
      'During a traffic spike, how do you choose between reacting with HPA, a static buffer, or overprovisioning?'
    ]
  },
  'devops-096': {
    q: 'Compare GitFlow and trunk-based development for a Java backend team: when would you choose each, and what branch/commit/MR rules apply?',
    a: `**Summary:** **Trunk-based** (one main branch, short-lived feature branches under 1-2 days, unfinished work hidden behind feature flags) fits a backend service that deploys continuously. **GitFlow** (develop, release, hotfix) fits when you must release in batches and maintain multiple versions in parallel, such as a mobile app or software installed at customer sites. For a Java backend team building SaaS/microservices, I choose trunk-based with small-MR rules, a required green CI, and branch protection.

### Why you need a branching convention
Without a convention, everyone keeps their own branch for weeks -> large merge conflicts, 2,000-line reviews nobody reads carefully, and release day becomes a risky "integration" day. A branching convention is an agreement about **how changes reach production**.

### How GitFlow works
- {{main}} only contains released code (tagged); {{develop}} is where integration happens.
- {{feature/*}} branches from develop; {{release/*}} branches off to stabilize before shipping; {{hotfix/*}} branches from main and merges back into both main and develop.
- Pros: clear release control, supports multiple versions. Cons: many long-lived branches, easy to forget to merge both ways, long delay from commit to production.

### How trunk-based works
- Everyone integrates into {{main}} at least daily via small MRs; CI runs on every commit; main is always deployable.
- Work in progress is hidden behind a **feature flag** (configuration, Unleash, LaunchDarkly, ...), rolled out gradually to user groups.
- Hotfix: fix on main and deploy like any other change; if you must patch an old version, cherry-pick to a short-lived release branch.

| Criterion | GitFlow | Trunk-based |
|---|---|---|
| Release frequency | In batches (weeks/months) | Multiple times per day |
| Long-lived branches | Many | Almost none |
| Merge conflicts | Large, piled up at the end | Small, continuous |
| Feature flags | Not required | Required for unfinished work |
| Fits | Mobile, on-premise, multiple versions | SaaS, microservices |

### MR/commit rules I apply
- MRs under about 400 changed lines, one purpose; include a description of "why" and how to test.
- Branch protection: no direct pushes to main, at least 1 review, green CI (build, test, scan) required to merge, branch must be up to date with main.
- Commits follow Conventional Commits ({{feat:}}, {{fix:}}, {{chore:}}) to generate a changelog and auto-bump versions.
- Every feature flag has an **owner and an expiry date**; remove the flag a few weeks after it reaches 100%.

### Real-world example
An 8-dev backend team used GitFlow: releases every 2 weeks, and release day often took a whole afternoon resolving conflicts from 10-15 feature branches that lived an average of 9 days; 1/3 of releases needed a hotfix within 24 hours. They switched to trunk-based: branches lived an average of 1.2 days, MRs averaged 180 lines, 3-5 deploys per day, large features hidden behind flags. After 3 months, lead time from commit to production dropped **from 8 days to under 1 day**, and the share of deploys causing incidents fell from 30% to about 8% (measured by deploys needing rollback/hotfix).

### Pitfalls
- Calling it trunk-based while branches still live for a whole week.
- Feature flags that are never removed -> code full of dead if branches, flag combinations nobody tests.
- Trunk-based but CI takes 40 minutes or tests are flaky -> main is often red, people are afraid to merge.
- Using GitFlow for a service that has only one production version -> adding ceremony without adding value.

### Interview answer
"I choose based on how the product is released. If you must release in batches and maintain multiple versions in parallel, like a mobile app or software installed at customer sites, GitFlow makes sense because it has clear release and hotfix branches. For a backend service that deploys continuously, I choose trunk-based: everyone integrates into main at least daily via small MRs, CI runs on every commit, main is always deployable, and unfinished work is hidden behind feature flags. The accompanying rules are MRs under about 400 lines, branch protection with required review and green CI, Conventional Commits to generate the changelog, and every feature flag has an owner and an expiry date. At my previous team, moving from GitFlow to trunk-based cut lead time from commit to production from about 8 days to under 1 day, and release day was no longer a conflict-resolution day."

> Senior tip: Measure two numbers before arguing about a branching model: the average branch age at merge and the average MR size. Branches older than 3 days or MRs over 800 lines are a problem, regardless of what the team calls its process.`,
    follow: [
      'Where should feature flags be managed and what should their lifecycle look like?',
      'How do you handle hotfixes in trunk-based development?',
      'What are the minimum branch protection rules?'
    ]
  },
  'devops-097': {
    q: 'In GitLab CI, how do stages, jobs, cache vs artifacts, shell/docker runners, and masked/protected secret variables work?',
    a: `**Summary:** GitLab CI runs a pipeline by stages (sequential) and jobs (parallel within a stage); cache reuses dependencies between runs, artifacts pass files between stages; runners (shell/docker) execute jobs; masked/protected variables hide secrets.

### Stages & jobs
- Stages are declared in .gitlab-ci.yml, e.g. build, test, deploy; a later stage runs only if the previous one passes.
- Jobs in the same stage run in parallel; each job has script, image, rules, timeout.
- Use needs for a DAG: a deploy job does not need to wait for the whole test stage if it only depends on build.

### Cache vs artifacts
- cache: dependency directories (Maven .m2, npm node_modules) stored on the runner/storage, reused between pipelines to speed up builds; key it by the lock file (pom.xml hash).
- artifacts: build outputs/test reports that must be passed to a later stage or downloaded; set expire_in (default 30 days) to save storage.
- Mistake: caching a large artifact (target/) slows things down; artifacts containing secrets.

### Runners
- Shared runner (provided by GitLab) vs a specific runner (self-hosted) for heavy or sensitive workloads.
- Shell executor: runs on the host machine, fast but dirty (state leaks).
- Docker executor: each job runs in a clean container, with a specified image (maven:3.9-eclipse-temurin-17).
- Kubernetes executor: scales pods per job.

### Secret variables
- CI/CD Variables: masked (the value is not printed in logs, replaced by [MASKED]), protected (only injected into protected branches/tags).
- Secrets should come from Vault/external secrets, not be hard-coded.
- Predefined variables: CI_COMMIT_SHA, CI_REGISTRY_IMAGE.

### Deploying by environment
- environment: name, url; GitLab creates a deployment record and a rollback UI.
- when: manual + rules to gate production behind approval.
- Canary/blue-green via kubectl/helm in the script.

### Example .gitlab-ci.yml
~~~yaml
stages: [build, test, deploy]
variables:
  MAVEN_OPTS: "-Dmaven.repo.local=.m2/repository"
cache:
  key: \${CI_COMMIT_REF_SLUG}
  paths: [.m2/repository]
build:
  stage: build
  image: maven:3.9-eclipse-temurin-17
  script: mvn -B package -DskipTests
  artifacts:
    paths: [target/*.jar]
    expire_in: 1 week
test:
  stage: test
  script: mvn -B test
deploy:
  stage: deploy
  environment: { name: production, url: https://app.example.com }
  when: manual
  script: kubectl set image deployment/app app=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
~~~

### In production
- Mistakes: cache containing secrets or oversized artifacts; a shared runner hit by noisy neighbors.
- Check: pipeline duration, cache hit rate (GitLab metrics), artifact storage.
- Security: protected variables, restrict by runner tag, audit log.

> Senior tip: Use needs for a DAG pipeline to reduce time; set artifact expiry to save storage; separate build/test/deploy images to make layer caching effective.`,
    follow: [
      'How should you design a cache key for Maven/Gradle?',
      'How do you avoid leaking secrets in logs?',
      'How do you roll back a pipeline when a deploy fails?'
    ]
  },
  'devops-098': {
    q: 'In a declarative Jenkinsfile: how do agent, stages, and shared libraries work; and how does Jenkins compare to GitLab CI/GitHub Actions?',
    a: `**Summary:** Jenkins is a self-hosted CI server; the pipeline is declared in a Jenkinsfile (declarative/scripted); the agent specifies where to run; shared libraries reuse logic; compared to GitLab CI/GitHub Actions it is an integrated SaaS service vs. self-managed.

### Declarative Jenkinsfile
- pipeline { agent any; stages { stage('Build'){ steps { sh 'mvn -B package' } } } }
- agent: any, label, docker, kubernetes; decides where the job runs.
- post: always/success/failure/unstable for cleanup/notify.
- environment, credentials(), options (timeout, retry).

### Shared library
- A repo containing vars/ (global functions) and src/ (classes); loaded with @Library('lib') _.
- Versioned by branch/tag; reused across repos, avoiding copy-paste.
- Unit test the library with Jenkins Pipeline Unit.

### Comparison
| Criterion | Jenkins | GitLab CI | GitHub Actions |
|---|---|---|---|
| Hosting | Self-managed (controller + agent) | SaaS/self-managed | SaaS |
| Config | Jenkinsfile | .gitlab-ci.yml | .github/workflows/*.yml |
| Plugins | Very many (plugin hell risk) | Rich built-ins | Marketplace actions |
| Secrets | Credentials store + binding | CI/CD Variables | Repository/Org Secrets |
| Scale | Controller bottleneck if not distributed | Managed runners | Hosted runners + self-hosted |

### Example Jenkinsfile
~~~groovy
pipeline {
  agent { docker { image 'maven:3.9-eclipse-temurin-17' } }
  stages {
    stage('Build') { steps { sh 'mvn -B package -DskipTests' } }
    stage('Test') { steps { sh 'mvn -B test' } }
    stage('Deploy') {
      when { branch 'main' }
      steps { sh 'kubectl apply -f k8s/' }
    }
  }
  post { always { junit 'target/surefire-reports/*.xml' } }
}
~~~

### In production
- Mistakes: Jenkins controller bottleneck, plugin conflicts/version drift, agents offline.
- Check: queue time, agent utilization, plugin update cadence.
- Security: least-privilege credentials, RBAC, audit.

> Senior tip: Jenkins fits legacy/complex on-prem enterprise setups; for greenfield prefer GitHub Actions/GitLab CI to reduce operations; if you use Jenkins, keep plugins minimal and version-locked.`,
    follow: [
      'When would you choose a self-hosted runner?',
      'How do you version a shared library?',
      'Blue Ocean vs the classic UI?'
    ]
  },
  'devops-099': {
    q: 'How does a SonarQube quality gate work (coverage, code smells, blocking merges when not met); and how do you configure it for Maven/Gradle?',
    a: `**Summary:** The SonarQube scanner analyzes code and sends a report to the server; the quality gate applies conditions on metrics (coverage, bugs, vulnerabilities, smells); a failed gate blocks merges via PR decoration + a required status check.

### How it works
- The scanner (Maven/Gradle/CLI) runs in CI and sends a report + source to the SonarQube server.
- The server computes metrics and compares them to the quality gate profile.
- PR decoration: posts a result comment + link; the required check fails if the gate fails.
- Distinguish "Overall code" vs "New code" (leak period) so legacy debt does not block delivery.

### Maven
- mvn sonar:sonar -Dsonar.projectKey=app -Dsonar.host.url=... -Dsonar.token=...
- Coverage: jacoco agent (prepare-agent) + report; sonar.jacoco.reportPaths.
- Fail the build if the gate fails: sonar.qualitygate.wait=true.

### Gradle
- plugin org.sonarqube; gradle sonarqube.
- jacoco plugin generates the report; sonar.coverage.jacoco.xmlReportPaths.

### Blocking merges
- GitLab: require pipeline success + external status check "SonarQube" on the protected branch.
- GitHub: branch protection required checks; SonarCloud PR decoration.
- Typical thresholds: new code coverage >= 80%, 0 new blocker/critical.

### Maven example
~~~bash
mvn -B verify sonar:sonar \\
  -Dsonar.projectKey=myapp \\
  -Dsonar.host.url=https://sonar.example.com \\
  -Dsonar.token=$SONAR_TOKEN \\
  -Dsonar.qualitygate.wait=true
~~~

### In production
- Mistakes: starting with a coverage threshold of 0 and never raising it; the gate only warns and does not block.
- Check: gate pass rate, new code coverage trend, false positive count.
- Security: masked token, SonarQube over HTTPS, RBAC.

> Senior tip: Use a "new code" period (leak period) so legacy debt does not block delivery; raise the coverage threshold gradually quarter by quarter.`,
    follow: [
      'How do you handle false positives?',
      'Should coverage be measured by unit or integration tests?',
      'SonarLint in the IDE?'
    ]
  },
  'devops-100': {
    q: 'How do you build a Java image in a pipeline: multi-stage Dockerfile, layer cache, tagging by commit SHA, pushing to a registry, and scanning for vulnerabilities with Trivy?',
    a: `**Summary:** Build a Java image with a multi-stage Dockerfile (a Maven/Gradle build stage, a slim JRE runtime stage) to reduce size; leverage layer cache by copying the pom before downloading deps; tag by commit SHA; push to Harbor/ECR; scan with Trivy for CVEs and fail the pipeline on critical findings.

### Multi-stage Dockerfile
- Build stage: a maven/gradle image, compile + package.
- Runtime stage: eclipse-temurin slim JRE or distroless; COPY --from=build target/*.jar app.jar.
- The resulting image contains only the JRE + jar, no Maven/source.

### Layer cache
- Copy pom.xml/build.gradle first, RUN mvn dependency:go-offline, then copy source -> reuse the cache when only code changes.
- BuildKit cache mounts: --mount=type=cache,target=/root/.m2 to cache the Maven repo across builds.
- Instruction order: least-changing first, most-changing last.

### Tagging
- image:tag = short commit SHA (7-8 chars) + semantic version (1.2.3).
- latest is for dev only; production always uses a specific tag so you can roll back.
- Reproducible: build args (BUILD_DATE, VCS_REF) for OCI labels.

### Registry
- Harbor/ECR/GitLab Registry; docker login with a robot account/token (masked variable).
- Retention policy: keep the N most recent versions, delete untagged ones.
- Image signing: Cosign (sigstore) for supply chain security.

### Trivy
- trivy image --severity HIGH,CRITICAL --exit-code 1 image:tag.
- Scans both OS packages and Java dependencies (via the Trivy Java analyzer).
- Fail the pipeline on critical CVEs; maintain a time-limited exception list with justification.

### Example Dockerfile
~~~dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
USER 1000
ENTRYPOINT ["java","-jar","app.jar"]
~~~

### In production
- Mistakes: running as root, secrets in a layer (ENV password), an outdated base image.
- Check: image size, scan report, no secrets (trivy secret scan).
- Base image update strategy: rebuild periodically against the base image digest.

> Senior tip: Use a distroless JRE to reduce the attack surface; tag by SHA for 1:1 traceability to the commit; enable image signing + verify at deploy time.`,
    follow: [
      'How do you cache Maven in a Docker build?',
      'Image signing with Cosign?',
      'Base image update strategy?'
    ]
  },
  'devops-101': {
    q: 'Semi-automated vs fully automated deployment and fast rollback on failure?',
    a: `**Summary:** Semi-automated (semi-auto) requires manual approval for production; fully automated (full CD) deploys every commit after tests; fast rollback via the previous image tag, Helm rollback, or kubectl rollout undo; DB migrations must be backward-compatible.

### Semi-automated
- Auto deploy to dev/staging; production requires approval (when: manual or environment approval).
- Fits regulated environments (finance, healthcare) that need audit/change advisory board.
- Reduces risk but slows feedback.

### Fully automated
- The CD pipeline deploys to production after tests pass + gates; every commit = a deploy.
- Requires feature flags, monitoring, and auto rollback to be safe.
- DORA elite: high deploy frequency, low lead time.

### Rollback
- Kubernetes: kubectl rollout undo deployment/app; or set the image back to the previous tag.
- Helm: helm rollback release revision.
- ArgoCD: sync back to the previous git commit.
- Database: expand/contract migrations so a code rollback does not break the schema (add a nullable column first, drop later).

### Rollback example
~~~bash
# Kubernetes
kubectl rollout undo deployment/app -n prod
kubectl rollout status deployment/app -n prod

# Helm
helm history app -n prod
helm rollback app 42 -n prod
~~~

### In production
- Mistakes: no rollback runbook, DB migrations not compatible, never testing rollback.
- Check: rollback time (MTTR), SLO, deploy success rate.
- Feature flag vs deploy rollback: a flag turns a feature off faster than rolling back an image.

> Senior tip: Use expand/contract migrations for safe rollback; always keep the previous image tag and test rollback in staging; target a rollback time under 5 minutes.`,
    follow: [
      'Database migration rollback strategy?',
      'Feature flag vs deploy rollback?',
      'Canary vs blue-green?'
    ]
  },
  'devops-102': {
    q: 'Release management: release branches, hotfixes, SemVer versioning, and coordinating multiple services?',
    a: `**Summary:** Use SemVer for libraries/APIs (MAJOR.MINOR.PATCH); a release branch stabilizes before release; hotfix from main; coordinate multiple services via versioned APIs, contract tests, and an automated changelog.

### SemVer
- MAJOR: breaking change (API incompatible).
- MINOR: new feature, backward-compatible.
- PATCH: bug fix.
- Pre-release (1.2.3-rc.1) and build metadata.

### Release branch
- release/1.2.0 from develop/main when features are frozen.
- Only bug fixes are cherry-picked into the release branch; merge back into main.
- Tag v1.2.0 when releasing.

### Hotfix
- hotfix/* from main (production), minimal fix, merge into main and develop.
- Patch version bump (1.2.1).
- Triggers an automated release pipeline.

### Multi-service coordination
- Independent deploys with versioned APIs (URL /v1, /v2) to avoid lock-step releases.
- Contract testing (Pact) between consumer/provider to catch breaking changes before deploy.
- Automated changelog from conventional commits (semantic-release).
- API deprecation policy: announce, set a sunset date, monitor usage.

### Conventional commit + release example
~~~bash
# commit
feat(order): add cancel endpoint
fix(payment): handle timeout retry

# semantic-release auto-bumps minor/major and publishes
npx semantic-release
~~~

### In production
- Mistakes: a long-lived release branch causing drift; a hotfix not merged back.
- Check: release frequency, hotfix count, lead time.
- Trunk-based + feature flags reduce the need for release branches.

> Senior tip: Trunk-based development + feature flags for most teams; keep release branches only for regulated products; contract tests are mandatory for multi-service.`,
    follow: [
      'How do you communicate a breaking change?',
      'Deprecation policy?',
      'Release notes automation?'
    ]
  },
  'devops-103': {
    q: 'Pipeline security: secret scanning, dependency scanning, SAST/DAST, and policy as code?',
    a: `**Summary:** A secure pipeline includes secret scanning (gitleaks), dependency scanning (OWASP/Snyk + SBOM), SAST (SonarQube/Semgrep), DAST (OWASP ZAP); policy as code (OPA/Conftest) enforces rules; least-privilege runners; scans must block, not just report.

### Secret scanning
- gitleaks/trufflehog scan commits and the working tree for API keys, tokens, passwords.
- A pre-commit hook blocks committing secrets before they are pushed.
- If leaked: revoke the key, rotate it, scrub history (git filter-repo) + notify.

### Dependency scanning
- OWASP Dependency-Check, Snyk, Trivy fs; compare CVEs against the NVD.
- Store an SBOM (CycloneDX/SPDX) as an artifact for audit.
- Fail on critical/high CVEs that have not been accepted (time-limited exceptions).

### SAST/DAST
- SAST: SonarQube, Semgrep analyze source to find SQL injection, XSS, insecure deserialization.
- DAST: OWASP ZAP scans the running app (staging) for runtime vulnerabilities.
- IAST: an agent inside the app combining SAST+DAST.

### Policy as code
- OPA/Conftest check Dockerfiles/K8s manifests: no root user, signed image, resource limits.
- Enforced at the CI gate; policies are version-controlled.
- An admission controller (Kyverno/Gatekeeper) enforces at runtime.

### Example security pipeline
~~~yaml
security:
  stage: test
  script:
    - gitleaks detect --source . --exit-code 1
    - trivy fs --severity HIGH,CRITICAL --exit-code 1 .
    - semgrep ci --config auto
  allow_failure: false
~~~

### In production
- Mistakes: scans only report and do not block; alert fatigue; permanent exceptions.
- Check: findings trend, MTTR, % of pipelines blocked.
- Shift-left: scan early in PRs, not only on the main pipeline.

> Senior tip: Secret scanning + dependency scanning are a mandatory baseline; policy as code turns security into an automated gate; review the exception list regularly.`,
    follow: [
      'Where should the SBOM be stored?',
      'Image signing verification at runtime?',
      'Compliance audit?'
    ]
  }
});
