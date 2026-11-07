/*
 * English translation of js/data/q-devops.js — task T737. Format: js/core/i18n.js (content overlay).
 * ids: devops-079
 */
App.i18n.content({

  'devops-079': {
    q: '(lead) You are asked to plan a phased migration of 40 on-prem applications to the cloud (AWS). How would you apply the 7R framework, build wave planning and dependency mapping, run weekend cutovers, and define go/no-go criteria? (Related to aws-030, do not repeat it.)',
    a: `**Summary:** Migrating 40 apps is not "40 separate moves" but a **wave-based program** driven by dependencies and risk. Use **7R** to decide the strategy for each app (rehost/replatform/refactor/repurchase/retire/retain/relocate), **dependency mapping** to group apps that are connected into the same wave and to determine order, and for each wave define a **weekend cutover runbook** plus clear **go/no-go/rollback** criteria. The foundation (landing zone, connectivity, observability, security) must be ready before wave 1. (For the technical details of moving databases with DMS/CDC and database cutover, see **aws-030**; this answer focuses on planning a 40-app program.)

### Real-world context
A bank has 40 on-prem apps (VMs, a few mainframe-adjacent systems, Oracle/SQL Server databases) and wants to move to AWS over 12-18 months to reduce legacy infrastructure risk and speed up feature delivery. Constraints: some apps connect to core banking, change windows are limited (weekends), there are compliance/audit requirements, and the operations team is not yet familiar with the cloud. A "big bang" (move everything at once) is not feasible because of risk and overlapping dependencies.

### Terms (explained on first use)
- **7R**: seven migration strategies — **Retire** (remove an app that no longer has value), **Retain** (keep it on-prem temporarily), **Rehost** (move it as-is, "lift-and-shift"), **Relocate** (move an entire infrastructure cluster), **Repurchase** (replace with SaaS), **Replatform** (change the platform with minimal code changes, e.g. VM to container/ECS), **Refactor** (rewrite/re-architect to be cloud-native).
- **Wave**: a group of apps migrated within the same time window, with its own goals and runbook. Later waves learn from earlier ones.
- **Dependency mapping**: listing which app calls which app, which DB/queue/DNS/system it uses, and who is upstream/downstream — to avoid moving one app while its "wires" still live on-prem.
- **Cutover**: the moment you switch users/traffic to the new environment.
- **Go/no-go**: a meeting/decision at checkpoints to decide whether to **continue (go)** or **stop/postpone (no-go)** based on quantitative criteria agreed in advance.
- **Runbook**: a step-by-step document for an operation (here, cutover/rollback) that states who does what, how long it takes, what failure looks like, and how to roll back.

### Step 1 — Inventory and assign a 7R to each app
For 40 apps, build a portfolio table: name, business owner, technology, integrations, sensitive data, change frequency, current cost/pain, and the **proposed 7R** plus rationale. Avoid refactoring everything (expensive, slow) unless there is a clear benefit.

| 7R | When to choose (example) | Note for a 40-app program |
|---|---|---|
| Retire | Low usage, duplicates functionality | Move 0 lines of code, reduces how many apps you must migrate — do this early |
| Retain | Depends on core/mainframe not yet moved, or is about to be replaced | Have a plan/conditions to revisit, do not "forget" it |
| Repurchase | A SaaS fits (HR, internal CRM) | Assess integration/data/compliance |
| Rehost | Stable, needs to move fast, little value in changing it | Fast but does not leverage the cloud; often a temporary step |
| Replatform | Spring Boot/Java can already be packaged; you want to stop managing OS/patching | Often the "sweet spot" for Java apps (VM to container/EKS/ECS) |
| Refactor | Needs major scale/reliability, and you are ready to invest | Only 1-2 critical apps, not all at once |

### Step 2 — Dependency mapping and wave planning
- **Collect dependencies**: interview teams, read integration diagrams, inspect configuration (endpoints, DNS, connection strings), and review logs/network flows. Draw a graph: app to app/DB/queue/DNS/on-prem system.
- **Wave planning principles**:
  - Wave 0 (foundation): landing zone, network (VPN/Direct Connect), IAM/security, CI/CD, observability, registry — without a foundation, app waves become chaotic.
  - Wave 1: **low dependency, low risk**, can be replatformed quickly — use it to "rehearse" the process, runbooks, and the team.
  - Middle waves: group apps in the **same dependency cluster** into the same wave (avoid moving one app to the cloud while it still calls 5 on-prem apps over a slow path). Handle circular dependencies by splitting an interface or using a temporary strangler/adapter.
  - Final waves: apps **tightly coupled to core banking/heavy on-prem systems** or high risk — by then the team has experience and you may have stable connectivity in place.
- **Temporary hybrid management**: during the transition, accept some cross-calls between on-prem and cloud, but **measure latency** and set a goal to reduce it over time (related to aws-030 on routing/latency; devops-078 on causes of latency in hybrid setups).

~~~text
Wave 0  Foundation: landing zone, DX/VPN, IAM, CI/CD, observability
   |
Wave 1  3-5 independent, low-risk apps  (replatform)  -> rehearse runbook
   |
Wave 2  cluster apps A,B,C (depend on each other) + cluster DB  -> migrate in same wave
   |
Wave 3  ... clusters in dependency-map order ...
   |
Wave N  apps tied to on-prem core / high risk  (after connectivity + team are ready)
Each wave: prepare -> rehearsals -> weekend cutover -> hypercare -> lessons learned
~~~

### Step 3 — Weekend cutover (each wave)
Cutover happens on weekends because traffic is low and you have a maintenance window; banks typically also require a formal change approval process. The **runbook** (written from rehearsal, not from theory) includes:
- **T-1/T-2 weeks**: rehearsal in a prod-like environment; freeze versions and block unrelated changes.
- **Before the window**: confirm backup/restore, notify stakeholders, verify network/certs/DNS, and prepare rollback commands.
- **During the window (example T0 22:00 to 04:00)**: each step has a time, an owner, and a communication channel (bridge). Deploy in dependency order; run business smoke tests after each cluster.
- **After cutover**: heightened monitoring (hypercare for 3-5 days) and keep the rollback path for the agreed period. (For database cutover/rollback with DMS/CDC, see aws-030.)

### Step 4 — Go/no-go criteria
Agree on them **before** cutover day, make them measurable, and assign a decision owner. Example:
| Checkpoint | Go if | No-go if |
|---|---|---|
| Rehearsal go/no-go (T-1 week) | Rehearsal passes, duration fits the window, checklist complete | A critical step fails and there is no mitigation |
| Pre-window go/no-go (day T) | Team ready, backup OK, no open P1 incident, change approved | Key person missing, incident in progress, dependency not ready |
| In-window go/no-go (after smoke test) | Error rate/latency within thresholds, sample transactions correct, checksum matches (if applicable) | Severe business errors, data mismatch, root cause not quickly identified |
| Rollback decision | A pre-agreed rollback trigger has occurred | Trying to "patch" past the window end without a clear root cause |

### Pitfalls (common mistakes)
- **Big bang of 40 apps**: one failure cascades across many flows and nobody knows where the cause is. Fix: split into waves, keep wave 1 small to learn.
- **Planning waves by department instead of by dependency**: you move app A while B (still on-prem) depends on A, causing slow/error-prone cross-calls. Fix: dependency mapping is a required input to wave planning.
- **Refactoring everything**: the team burns out and the program slips. Fix: apply 7R by value/risk; most Java apps are a good fit for replatforming.
- **No foundation (Wave 0)**: each wave improvises security/network/CI, creating debt and gaps. Fix: landing zone plus guardrails before wave 1.
- **Subjective go/no-go**: arguments during the cutover night. Fix: quantitative criteria plus a decision owner agreed in advance.
- **Ignoring people and process**: the operations team is not used to the cloud or to the new on-call. Fix: training, runbooks, hypercare, and updated incident processes.

### Interview answer (lead)
"For 40 apps I would treat it as a wave-based program, not a big bang. I would build a portfolio and assign a 7R to each app: retire/repurchase to reduce the count, replatform most Java apps, and refactor only with a clear reason. In parallel I would do dependency mapping (integrations, DBs, DNS, on-prem flows) to group dependency clusters into the same wave; Wave 0 builds the landing zone/connectivity/IAM/observability, and Wave 1 picks low-dependency, low-risk apps to rehearse the process. Each wave has a rehearsal, a weekend cutover runbook with clear roles/times, and hypercare. Go/no-go and rollback are quantitative criteria agreed in advance (after rehearsal, before the window, after smoke tests). For the technical part of database move/cutover I would use DMS full load plus CDC, with lag back to zero and checksum checks — details as in aws-030."

> Senior tip: Two things decide a 40-app program: (1) **real dependency mapping** (do not trust diagrams alone — verify with logs/network flows) and (2) **a runbook derived from rehearsal**, not from a document. Measure the share of "cross-calls to on-prem" after each wave and treat it as a hybrid-architecture health metric; the goal is to drive it down over time. Keep a 7R decision log (why app X was replatformed rather than refactored) for audit and so later waves do not re-argue from scratch.`,
    follow: [
      'How would you discover hidden dependencies between apps that are not documented? (hint: flow logs, tracing, DNS/query logs)',
      'When a cluster of apps has circular dependencies (A calls B, B calls A), how would you plan the wave and the cutover?',
      'Which metrics would you report to leadership after each wave to show the program is safe and on track?'
    ]
  },

});
