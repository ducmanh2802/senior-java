/*
 * English translation of js/data/q-devops.js — task T980. Format: js/core/i18n.js (content overlay).
 * ids: devops-124 devops-125 devops-126 devops-127 devops-128
 */
App.i18n.content({

  'devops-124': {
    q: 'Compare Deployment strategies RollingUpdate and Recreate. Explain maxSurge/maxUnavailable and how to use rollout undo. What is PodDisruptionBudget (PDB) and why is it needed when draining a node for maintenance? Give a manifest example and a production scenario.',
    a: `**Summary:** RollingUpdate gradually replaces old Pods with new ones (the default), controlling speed via {{maxSurge}} (number of extra Pods created) and {{maxUnavailable}} (number of Pods allowed to be missing); Recreate deletes all old Pods first then creates new ones — causes downtime but avoids two versions running side by side. {{kubectl rollout undo}} reverts to the previous ReplicaSet revision. PodDisruptionBudget (PDB) sets the minimum number of Pods that must remain when a **voluntary disruption** occurs (draining a node, autoscaler removing a node), so maintenance does not bring down the service.

### Quick understanding
Upgrading a restaurant with 4 servers: **RollingUpdate** brings in one new server to shadow, once trained one old server leaves — the restaurant always has enough staff (no downtime), but sometimes old and new work side by side (two versions running at once). **maxSurge** is "allowed to hire at most how many temporary hands", **maxUnavailable** is "allowed to be short by at most how many". **PDB** is the owner's rule: "even while renovating the building (draining a node), at least 3 servers must keep serving" — the maintenance crew may not evict anyone if it breaks that rule.

### Terms
- **RollingUpdate**: default update strategy; creates new Pods gradually, deletes old ones gradually, keeps service available (if configured correctly).
- **Recreate**: deletes all old Pods before creating new ones; accepts interruption.
- **maxSurge**: number of Pods (or %) allowed to exceed the desired {{replicas}} during rollout. Example replicas=4, maxSurge=1 → at most 5 Pods.
- **maxUnavailable**: number of Pods (or %) allowed to be not Ready compared to {{replicas}}. maxUnavailable=0 → always enough Ready replicas.
- **ReplicaSet revision**: Deployment keeps a history of ReplicaSets ({{revisionHistoryLimit}}, default 10) for rollback.
- **Drain node**: {{kubectl drain}} evicts Pods off a node for maintenance/upgrade — this is a **voluntary disruption** (intentional disruption).
- **PodDisruptionBudget (PDB)**: limits the number of Pods disrupted at the same time by voluntary disruptions; uses {{minAvailable}} or {{maxUnavailable}}.

### Comparing strategies
| Criteria | RollingUpdate | Recreate |
|---|---|---|
| Downtime | None (if probe + config correct) | Yes (time between deleting old and new Ready) |
| Two versions side by side | Yes — code/DB must be backward compatible | No |
| Extra temp resources | Needed (maxSurge) | Not needed (may need enough space when recreating) |
| Use when | API/stateless service, most cases | App cannot run 2 versions (exclusive DB schema lock, exclusive port/volume RWO), single-instance batch, migration breaks compatibility |

### Manifest: RollingUpdate with control + PDB
~~~yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: payment, namespace: payment }
spec:
  replicas: 4
  revisionHistoryLimit: 10        # keep 10 revisions for rollback
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1                 # create at most 1 extra Pod
      maxUnavailable: 0           # always keep 4 Pods Ready (zero-downtime)
  selector: { matchLabels: { app: payment } }
  template:
    metadata: { labels: { app: payment } }
    spec:
      containers:
        - name: payment
          image: harbor.bank.local/core/payment:1.4.7
          readinessProbe:         # required for maxUnavailable=0 to make sense
            httpGet: { path: /actuator/health/readiness, port: 8080 }
            periodSeconds: 5
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: payment-pdb, namespace: payment }
spec:
  minAvailable: 3                 # always keep at least 3 Pods during voluntary drain/evict
  selector: { matchLabels: { app: payment } }
~~~

### Rollout and rollback
~~~bash
kubectl apply -f deploy.yaml                    # update (create new revision if spec changes)
kubectl rollout status deploy/payment -n payment # wait for rollout to complete / report error
kubectl rollout history deploy/payment -n payment  # see revisions
kubectl rollout undo deploy/payment -n payment     # revert to revision right before
kubectl rollout undo deploy/payment -n payment --to-revision=2  # revert to a specific revision
~~~
Note: rollout stops in a failed-progress state (new Pod not Ready) after {{progressDeadlineSeconds}} (default 600s) but **does not roll back automatically** — pipeline/Argo Rollouts must handle it.

### PDB when draining a node
- {{kubectl drain <node> --ignore-daemonsets}} evicts Pods to empty the node. Without PDB, drain may evict many Pods of one service at once → reduces capacity or crashes the service.
- PDB {{minAvailable: 3}} (4 replicas) means eviction is **rejected** if it would make available Pods < 3; drain waits (or hangs) until Pods are scheduled elsewhere and become Ready.
- **PDB does not protect against involuntary disruption**: node suddenly dies, kernel panic, node OOM — these do not go through the eviction API.
- Trap: PDB too strict ({{minAvailable}} = {{replicas}}) makes drain **never finish**. Balance: always leave at least 1 Pod allowed to be disrupted, or use {{maxUnavailable: 1}}.

### On production
~~~bash
kubectl get pdb -n payment                        # ALLOWED DISRUPTIONS must be >= 1 when draining
kubectl describe pdb payment-pdb -n payment
kubectl drain node-3 --ignore-daemonsets --delete-emptydir-data --timeout=15m
kubectl get events -n payment --sort-by=.lastTimestamp
~~~
- **Incident:** (1) Drain hangs forever because PDB {{minAvailable}} = replicas (or remaining Pods cannot be placed on nodes) → check {{kubectl get pdb}}, add nodes temporarily or loosen PDB under control. (2) Using Recreate for a service at peak traffic → outage for several minutes. (3) RollingUpdate but DB migration breaks compatibility → old version fails after the new one migrated; must use expand-contract strategy. (4) Large {{maxSurge}} + cluster short on resources → new Pods Pending, rollout slow and may get stuck.

> Senior tip: For an important Java service, set {{maxUnavailable: 0}} + PDB {{maxUnavailable: 1}} (or {{minAvailable: N-1}}) and **require** a meaningful readinessProbe — without readinessProbe, Kubernetes considers a Pod "ready" as soon as the container runs, so maxUnavailable=0 is meaningless. When maintaining a node, always check {{ALLOWED DISRUPTIONS}} first; combine with Cluster Autoscaler/PDB-aware scheduling so new nodes can receive Pods before old nodes are fully drained.`,
    follow: [
      'How do maxSurge and maxUnavailable interact? Can both be set to 0, and why not?',
      'What kind of disruption does PDB protect against, and what does it NOT protect against? Give an example of each.',
      'When do you choose blue-green or canary (Argo Rollouts) instead of default RollingUpdate?'
    ]
  },

  'devops-125': {
    q: 'What is a Kubernetes Namespace for? When multiple teams or multiple environments (dev/staging/prod) share one cluster, how do you use Namespace combined with ResourceQuota and LimitRange to isolate and avoid one team consuming all resources of another?',
    a: `**Summary:** Namespace is a way to divide a cluster into multiple logical "spaces" to group resources, apply policies (RBAC, quota, network policy) and avoid name collisions. **ResourceQuota** limits the total resources/objects a namespace may use (total CPU/RAM requests, number of Pods). **LimitRange** sets defaults and min/max for each Pod/container in a namespace (especially default request/limit when the user forgets to declare). Combining all three lets multiple teams/environments share a cluster without starving each other.

### Quick understanding
Think of a Kubernetes cluster as a large office building. **Namespace** divides the building into separate floors/areas (Payroll team floor, Card team floor, staging zone, prod zone): each area has its own sign and access card (RBAC). **ResourceQuota** is the lease contract for a zone: "Payroll floor may use at most 20 CPU, 64 GB RAM, 50 Pods" — exceeding it means no more. **LimitRange** is the rule for each room: "each employee (container) must declare minimum/maximum needs; if someone forgets, default to 250m CPU, 512 MB RAM" — preventing one room from hogging all power for the whole floor. Without quota/limit, one team deploying a runaway Pod-creating loop could drain the whole cluster's resources.

### Terms
- **Namespace**: logical scope for naming and isolating resources (Pod, Service, ConfigMap...). Some resources are cluster-scoped (Node, PersistentVolume) and do not belong to a namespace. Service DNS name has the form {{<svc>.<namespace>.svc.cluster.local}}.
- **RBAC (Role-Based Access Control)**: defines who can do what; Role/RoleBinding usually attached to a namespace so teams can only operate in their own namespace.
- **ResourceQuota**: object limiting total resources ({{requests.cpu}}, {{limits.memory}}, {{pods}}, {{services.loadbalancers}}...) within a namespace.
- **LimitRange**: object setting constraints defaults/min/max for each container/Pod/PVC in a namespace ({{default}}, {{defaultRequest}}, {{max}}, {{min}}).
- **Request vs Limit**: request is the part "reserved" for the scheduler to place Pods and for quota calculation; limit is the actual usage ceiling (CPU throttled, exceeding memory → OOMKilled).

### Example: namespace + quota + limit for a team
~~~yaml
apiVersion: v1
kind: Namespace
metadata:
  name: team-payment-dev
  labels: { team: payment, env: dev }
---
apiVersion: v1
kind: ResourceQuota
metadata: { name: rq-payment-dev, namespace: team-payment-dev }
spec:
  hard:
    requests.cpu: "8"        # total CPU request for the whole namespace
    requests.memory: 16Gi
    limits.cpu: "16"         # total CPU limit
    limits.memory: 32Gi
    pods: "40"               # max 40 Pods
    services.loadbalancers: "0"  # dev not allowed to create public LB
---
apiVersion: v1
kind: LimitRange
metadata: { name: lr-payment-dev, namespace: team-payment-dev }
spec:
  limits:
    - type: Container
      default:               # default limit if container does not declare
        cpu: 500m
        memory: 512Mi
      defaultRequest:        # default request if not declared
        cpu: 100m
        memory: 128Mi
      max:                   # ceiling per container
        cpu: "2"
        memory: 2Gi
~~~
When a namespace has a ResourceQuota limiting CPU/memory, **every new Pod must declare** {{requests}}/{{limits}} for containers — otherwise the API server rejects creating the Pod. LimitRange helps fill in defaults to reduce hassle, but teams should still declare according to actual needs.

### Namespace sharding strategy
| Approach | Example | Pros | Cons |
|---|---|---|---|
| By environment | {{payment-dev}}, {{payment-staging}}, {{payment-prod}} | Clear, easy to apply different quota/policy | Prod and non-prod share a cluster → blast radius risk (many organizations use separate prod clusters) |
| By team | {{team-payment}}, {{team-card}} | Easy to attach RBAC by ownership | Multiple environments in one namespace easy to mix up without label discipline |
| By team + environment | {{team-payment-prod}} | Clearest isolation | Many namespaces, need automation |

### On production
~~~bash
kubectl get ns --show-labels
kubectl describe quota rq-payment-dev -n team-payment-dev   # see Used vs Hard
kubectl describe limitrange lr-payment-dev -n team-payment-dev
kubectl get pods -n team-payment-dev
# Creating a Pod exceeding quota gives error: "exceeded quota: rq-payment-dev, requested: pods=1, used: pods=40, limited: pods=40"
~~~
- **Incident:** (1) Forgot to set LimitRange and dev did not declare requests → scheduler lacks info to place Pods properly, HPA by CPU also does not run (utilization calculated on request). (2) ResourceQuota set too low vs deploy needs (rolling update needs maxSurge to create extra Pods) → rollout stuck because no new Pod can be created. Calculate quota with room for surge. (3) Using namespace {{default}} for everything → hard RBAC, hard quota, easy to delete by mistake. (4) Namespace isolates logic but **does not isolate network by default**: a Pod in namespace A can still call a Pod in namespace B unless there is a NetworkPolicy.

> Senior tip: Namespace + ResourceQuota + LimitRange is the "minimum trio" for a multi-team cluster; add NetworkPolicy to isolate traffic and RBAC to isolate access. For banks, production is usually separated into its own cluster (or at least separate node pool) from non-prod to reduce blast radius; quota should be managed like code (GitOps) and alerts set when {{Used}} approaches {{Hard}} (e.g. 80%) so you can scale out before rollout is blocked in the middle of the night.`,
    follow: [
      'Does ResourceQuota count requests or actual usage? How does this affect capacity planning?',
      'Does Namespace isolate network between teams? If not, what do you use to block cross traffic?',
      'How do you automatically create the standard namespace + quota + limitrange + RBAC set each time you onboard a new team?'
    ]
  },

  'devops-126': {
    q: 'You are the lead of a platform running dozens of Spring Boot services on Kubernetes. Design the deployment standard: how to use Ingress/TLS, a standard Helm chart, managing ConfigMap/Secret, probes for Java apps, rollout strategy + PDB. How do you balance team autonomy with platform guardrails, and how do you handle production incidents (certificate expired, rollout causing mass errors, secret leaked)?',
    a: `**Summary:** The platform standardizes "safe rails" instead of letting each team reinvent: one Ingress controller + cert-manager for centralized TLS, one golden Helm chart with sensible probe/readiness/resource/PDB defaults, configuration via ConfigMap + secrets synced from vault (ESO), {{RollingUpdate}} rollout with {{maxUnavailable: 0}} and automatic guardrails. Lead balances via "safe defaults, controlled override" (policy-as-code) and runbooks for incidents (cert, faulty rollout, leaked secret). Goal: teams ship fast without shooting themselves in the foot.

### Quick understanding
Think of managing a market with 30 stalls (30 services). If each stall pulls its own electricity, makes its own sign, keeps its own money, someone forgets the circuit breaker, signs break the rules, money left exposed. The platform is the market management: providing standard electrical system with auto-shutoff circuit breakers (probe + resource limit), main gate with guards checking tickets and cameras (Ingress + TLS + WAF), shared safe (secret manager), and a process to open/close one stall at a time during repairs (rolling update + PDB). Stalls still decide what to sell (business logic) but must plug into the right socket and safe. When incidents happen (power out at gate, safe leaking), there is a shared playbook so no one panics.

### Terms
- **Golden path / golden chart**: standard sample (Helm chart, template) provided by the platform; teams use by default, only allowed values overridden.
- **Policy-as-code**: infrastructure policy written as code/machine-checkable (OPA Gatekeeper, Kyverno) to block violating manifests (missing probe, running root, missing resources).
- **Guardrail**: automatic barrier preventing common errors, different from a "gate" that blocks everything; a good guardrail still allows controlled exceptions.
- **GitOps**: desired state lives in Git; controller (Argo CD/Flux) syncs to cluster, helping audit and rollback.
- **Drift**: difference between declared state (Git/chart) and actual state (cluster) from manual changes.
- **Blast radius**: scope of impact when a component fails (one service, one namespace, one node).

### Proposed deployment standards
| Item | Default standard (golden chart) | Reason |
|---|---|---|
| Ingress/TLS | 1 LoadBalancer Service for ingress-nginx; each app declares Ingress via values; TLS from cert-manager (internal ClusterIssuer Let's Encrypt or corporate ACME); annotation timeout/body-size with safe defaults | Saves LB, TLS auto-renews, consistent config |
| Helm | {{helm upgrade --install --atomic --timeout}}; versioned charts; {{helm template/diff}} in CI; ban {{latest}} tag | Repeatable deploys, auto-rollback on fail |
| Config/Secret | ConfigMap for non-sensitive config; real secrets via External Secrets Operator from vault; checksum annotation forces rollout on change | Don't commit passwords to Git; controlled updates |
| Probe (Java) | startupProbe long enough (p99 start), readiness {{/health/readiness}}, liveness {{/health/liveness}} (do not check DB); enable Spring Boot Actuator probe | Avoid restart loop, real zero-downtime |
| Rollout/PDB | RollingUpdate {{maxUnavailable: 0, maxSurge: 1}}, PDB {{maxUnavailable: 1}}, {{terminationGracePeriodSeconds}} > preStop + shutdown | No dropped requests during deploy/drain |
| Resources | Mandatory {{requests/limits}} (LimitRange default + Kyverno enforces); JVM {{MaxRAMPercentage}} 70–75% | Correct scheduling, avoid noisy neighbor |

### Balancing team autonomy vs platform guardrails
- **Safe defaults, override with reason:** golden chart sets safe values; teams override via values (replica, timeout, host). Overrides beyond thresholds (disable liveness, run privileged, skip resource limit) blocked by policy or require exception with ticket + owner + expiry.
- **Platform owns "rails", team owns "cargo":** platform maintains chart/controller/policy/observability; team owns image, business config, SLO. Avoid platform becoming a bottleneck via self-service (catalog chart, docs, CI template).
- **Measurement:** compliance rate of probe/PDB/resource, deploy time, rollback rate, number of misconfiguration incidents (root cause classified).

### Handling production incidents
### 1) TLS certificate expired (cert-manager error)
~~~bash
kubectl get certificate -A                        # READY=False?
kubectl describe certificate shop-tls -n shop
kubectl describe certificaterequest,challenge -A  # ACME error (DNS, port 80, rate limit)
kubectl logs -n cert-manager deploy/cert-manager --tail=200
~~~
- **Short-term:** if cert about to/already expired causing disruption, issue a temporary cert from corporate CA and update TLS Secret manually (note drift, time-limited). Check chain: {{openssl s_client -connect shop.bank.vn:443 -servername shop.bank.vn | openssl x509 -noout -dates}}.
- **Root:** fix ACME cause (DNS not pointing, firewall blocking HTTP-01, wrong {{ClusterIssuer}}), verify cert-manager can create solver Ingress, set alert "cert expires in 14/7 days".

### 2) Rollout causes mass errors (new version broken)
~~~bash
kubectl rollout status deploy/payment -n payment
kubectl rollout undo deploy/payment -n payment    # revert to good revision
kubectl get pods -n payment -o wide               # new Pod CrashLoop/Error?
kubectl logs -l app=payment -n payment --tail=100 --prefix
~~~
- **Short-term:** {{rollout undo}} immediately; if using Helm {{--atomic}}, failure already auto-rolled back. Reduce blast radius: temporarily reduce traffic (scale/circuit breaker) if error spreads.
- **Root:** require real readinessProbe (don't mark Ready before serving), {{progressDeadlineSeconds}} + canary/Argo Rollouts for high-risk services, smoke test after deploy, expand-contract for DB changes so old app version still runs with new schema.

### 3) Secret leaked (committed to Git, log, dump)
- **Short-term (minutes/hours):** treat secret as compromised → **rotate** credential at source (change DB password, revoke token), update vault/ESO, force rollout so Pods receive new secret. Check for unusual access.
- **Cleanup:** remove secret from Git (filter history with dedicated tool), but already-leaked history cannot be reversed → rotation still mandatory. Scan repo with secret scanning.
- **Prevention:** ban plaintext Secret in Git (ESO/Sealed Secrets), pre-commit/CI secret scanning, RBAC to restrict Secret reads, protect actuator endpoints, encryption at-rest.

> Senior tip: Treat deployment standards as a **platform product** with version, roadmap and team feedback — guardrails are disliked when they block late and don't explain; good policy blocks early in CI with "what's wrong, how to fix". Two metrics leads should track: (1) rollout rate without manual intervention, (2) MTTR when cert/rollout/secret incidents occur. For banks, every security exception (disable probe check, loosen policy) must be time-limited and audited — a permanent exception is risk debt.`,
    follow: [
      'Which mechanism do you use (OPA Gatekeeper or Kyverno) to require every Deployment to have probe and resource limit? What is the trade-off?',
      'How do you implement canary release (Argo Rollouts) for a payment service to reduce mass rollout risk?',
      'When a team requests an exception "disable liveness because app restarts often", how do you handle it to help them without breaking the guardrail?'
    ]
  },

  'devops-127': {
    q: 'Multiple teams (Payments, Cards, Digital Channel, Data) share one Kubernetes cluster. How do you design governance: namespace and network isolation, ResourceQuota strategy per team/environment, large-scale Secret management, standard Helm/GitOps, and handling config drift? Give the operating model and trade-offs.',
    a: `**Summary:** Multi-team cluster governance based on "layered isolation + automation + audit": namespace per team/environment with RBAC + ResourceQuota + LimitRange + NetworkPolicy default-deny cross-traffic; Secrets centralized in vault synced via External Secrets Operator (each team reads only their own path); standardized deployment via golden Helm chart and GitOps (Git is source of truth, controller reconciles drift). Lead defines the ownership model (who is responsible for what), time-limited exception process, and metrics (quota usage, policy violations, drift) to govern by data not gut feel.

### Quick understanding
A shared cluster is like an office tower: each company rents a floor (namespace) with its own lock (RBAC), power/water limit (quota), device rules (LimitRange), and a rule forbidding running wires to other floors (NetworkPolicy). Each company's safe is at a bank outside (vault), employees only withdraw with their floor's key (ESO + policy). Every furniture change must submit an approved blueprint and be filed (GitOps) — anyone drilling walls (manual edits) is detected and reported (drift). The building management (platform team) sets common rules and offers self-service; each company is responsible for what happens inside its own floor.

### Terms
- **Multi-tenancy**: multiple "tenants" (teams) share infrastructure; isolation can be soft (namespace) or hard (separate cluster/node pool).
- **NetworkPolicy**: K8s network rule controlling which Pods can talk to which Pods/addresses (ingress/egress). K8s **allows all by default** if no policy.
- **GitOps**: every infrastructure/application change via Git commit; Argo CD/Flux continuously reconciles (compares and applies) cluster state against Git.
- **Config drift**: actual state differs from Git (due to {{kubectl edit/apply}} manually, hotfix outside flow). Drift makes rollback and audit untrustworthy.
- **Self-service**: teams create/deploy within allowed guardrails without opening tickets to wait for platform manual work.
- **Blast radius**: scope of impact when an error/attack occurs; separate namespace/node/cluster to reduce.

### Layered isolation model
| Layer | Mechanism | Goal | Note |
|---|---|---|---|
| Identity/access | Namespace + RBAC (Role/RoleBinding per team), dedicated ServiceAccount | Team operates only in own namespace | {{cluster-admin}} for platform only; API server audit log |
| Resources | ResourceQuota + LimitRange + (optional) PriorityClass | No team hogs resources; scheduler has info | Leave room for surge during rolling update |
| Network | NetworkPolicy default deny, allow only needed (ingress controller → app, app → DB allowed) | Reduce lateral movement when a Pod is compromised | CNI must support (Calico/Cilium); test carefully or block wrongly |
| Secret | Vault + External Secrets Operator, team-scoped path ({{kv/team-payment/*}}) | No cross-leak, centralized key rotation, audit access | Pod mounts only needed Secret; ban reading Secret from another namespace |
| Compute (advanced) | Node pool/taint by environment or sensitivity (prod, PCI) | Reduce hardware/kernel blast radius | Costs more; use when compliance requires |

### ResourceQuota strategy per team/environment
- **By environment:** dev broad on quantity but cost-limited (lower CPU/RAM, ban LoadBalancer), staging close to prod, prod per committed capacity (from load test). Avoid sharing prod/non-prod in one "quota bucket".
- **By team:** grant initial baseline + quota increase process via Git (PR) with data (usage, peak, reason). Set alert at 80% {{Used/Hard}}.
- **Quota for objects:** beyond CPU/RAM, limit {{count/services.loadbalancers}}, {{count/persistentvolumeclaims}}, {{pods}} to avoid costly or exploding resources unintentionally.
~~~bash
kubectl get resourcequota -A
kubectl describe quota -n team-payment-prod        # Used/Hard per type
# Script/Grafana alert when used/hard > 0.8
~~~

### Secrets at scale
- Each team gets a vault "space" (path/policy). ESO {{SecretStore/ClusterSecretStore}} + {{ExternalSecret}} references correct path; Git only contains reference names, not values.
- **Key rotation:** secrets have TTL/rotation schedule; after rotation at vault, ESO syncs K8s Secret → needs rollout mechanism (checksum annotation) so Pods receive new value.
- **Ban:** commit base64 secret, share secrets between namespaces by manual copy, use one ServiceAccount reading every secret. Enable vault access audit and K8s Secret audit.

### Standard Helm/GitOps and fighting config drift
- **Git is source of truth:** chart + environment values in repo; Argo CD/Flux reconciles. Ban direct {{kubectl apply/edit}} to prod (except emergency incident with record and backport to Git).
- **Anti-drift:** enable Argo CD drift detection (OutOfSync) and alert; for mature environments consider {{selfHeal/prune}} but understand risk (manual hotfixes will be overwritten). Always backport hotfix to Git immediately.
- **Helm standard:** golden chart versioned; teams use common chart, override values; scan manifest ({{kubeconform}}, {{helm template}}) and policy (Kyverno) in CI before merge.
~~~bash
# Argo CD: see app drift from Git
argocd app diff payment-prod
argocd app sync payment-prod          # sync back to Git state (careful)
kubectl get events -A --sort-by=.lastTimestamp | head
~~~

### Operating model and trade-offs
| Decision | Benefit | Trade-off |
|---|---|---|
| One cluster multi-namespace | Cheap, better resource use, centralized ops | Bigger blast radius (control plane/CNI error hits many teams); noisy neighbor if quota/policy weak |
| Separate prod cluster | Strong isolation, lower compliance risk | Double cost and ops; complex when sharing common services |
| NetworkPolicy default deny | Security, reduce lateral movement | Effort to declare legitimate flows; easy to block wrongly causing outage |
| GitOps self-heal | Drift auto-fixed, consistent | Emergency hotfix may be overwritten if forgetting to commit Git |

### On production
- **Drift incident:** someone {{kubectl set image}} hotfixes prod at 2 AM, forgets commit → next morning Argo sync/self-heal overwrites back to old image → incident repeats. Prevention: hotfix process requires immediate PR, temporary auto-sync disable time-limited, audit kubectl commands.
- **Quota incident:** Card team rolls out more replicas exactly when quota full → new Pods Pending, rollout stuck midway. Check {{kubectl describe quota}}, temporarily loosen with approval or reclaim dev resources; long-term: 80% alert and self-service quota increase process.
- **Network isolation incident:** enable NetworkPolicy default-all-deny but forget to allow DNS (kube-dns/coredns port 53) → all Pods cannot resolve Service names. Always have baseline policy allowing DNS and test on a test namespace first.

> Senior tip: Successful multi-team governance succeeds or fails at **defaults**: if the safe path (golden chart, namespace self-provisioned via Git, secrets via ESO) is easier than shortcuts (manual edits, hardcoded secrets), teams comply naturally. Measure with leading metrics: time to onboard a new team, % of changes via Git, policy violations blocked at CI (not prod), drift frequency. For banks, treat RBAC + audit + NetworkPolicy as compliance requirements, not optional — and drill "one namespace compromised" to verify blast radius truly reduced.`,
    follow: [
      'How do you design the NetworkPolicy baseline (default-all-deny + allow DNS + allow ingress controller) without breaking existing services?',
      'When should you split into multiple clusters instead of continuing multi-tenancy by namespace? Give decision thresholds.',
      'How do you handle a 2 AM emergency hotfix in GitOps without creating drift and without slowing recovery?'
    ]
  },

  'devops-128': {
    q: 'How do StorageClass, PV and PVC work in Kubernetes? What is dynamic provisioning and how do access modes RWO/RWX/RWOP differ?',
    a: `**Summary:** Container filesystem disappears when Pod is recreated, so durable data needs external volumes. **PersistentVolume (PV)** is a real disk in the cluster (EBS, cloud disk, NFS...); **PersistentVolumeClaim (PVC)** is a Pod "requesting" a disk with certain capacity and access mode; **StorageClass** describes how to **automatically create** PVs when there is a PVC (dynamic provisioning) via CSI driver. Access mode decides how many nodes can attach the disk at once: **RWO** (one node), **RWX** (many nodes), **RWOP** (exactly one Pod).

### Dynamic provisioning mechanism, step by step
1. You create PVC: 20Gi, {{ReadWriteOnce}}, {{storageClassName: gp3}}.
2. Controller sees PVC has no matching PV → calls **CSI driver** of StorageClass (e.g. {{ebs.csi.aws.com}}) to create a new disk on cloud.
3. A PV is created representing that disk and **binds** one-to-one with PVC.
4. When Pod using PVC is scheduled onto a node, kubelet attaches + mounts the disk to the node then into the container.
~~~yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata: { name: gp3 }
provisioner: ebs.csi.aws.com
parameters: { type: gp3 }
reclaimPolicy: Retain                      # keep disk when PVC deleted (important data)
volumeBindingMode: WaitForFirstConsumer    # wait to know Pod node/zone before creating disk
allowVolumeExpansion: true
~~~
Static provisioning: admin creates PV in advance (e.g. pointing to existing NFS), PVC binds to — used when disk already exists or storage has no CSI auto-create.

### Access modes
| Mode | Meaning | Example storage |
|---|---|---|
| ReadWriteOnce (RWO) | Read-write attach on **one node** (many Pods on same node can still use) | EBS, Persistent Disk |
| ReadOnlyMany (ROX) | Many nodes read-only | NFS, some disks |
| ReadWriteMany (RWX) | Many nodes read-write at once | EFS, NFS, CephFS, Azure Files |
| ReadWriteOncePod (RWOP) | Exactly **one Pod** in the whole cluster (GA from Kubernetes 1.29) | CSI-supported |
Block storage (EBS) is almost always RWO only; need RWX → use file storage (EFS) and accept higher latency.

### Reclaim policy and binding mode
- **Delete** (default of many StorageClasses): deleting PVC deletes the disk and data too. **Retain**: keeps disk, admin handles — use for important data.
- **WaitForFirstConsumer**: creates disk at the correct zone where Pod is scheduled. With {{Immediate}}, disk may be created in zone A while Pod only scheduled in zone B → Pod Pending due to "volume node affinity conflict" (EBS cannot attach across zones).

### Investigating PVC/Pod Pending
- {{kubectl describe pvc}}: provisioner events (wrong StorageClass name, out of quota, missing CSI driver IAM permission).
- {{kubectl describe pod}}: attach/mount error, zone conflict, RWO disk still attached to old node (Multi-Attach error when Pod moves to another node but old node hasn't released disk).

### Real-world example
A team ran Elasticsearch on EKS, StorageClass with {{volumeBindingMode: Immediate}}. After a node in zone ap-southeast-1a died, Pod was scheduled to 1b but EBS disk lay in 1a → Pod Pending for 3 hours. Changed to {{WaitForFirstConsumer}}, added topology spread for StatefulSet and changed {{reclaimPolicy}} to Retain (previously a mistyped namespace delete command had wiped 400 GB of data in staging). Next time a node died, Pod restarted in the same zone on another node within about 4 minutes.

### Pitfall
- Using reclaim Delete for important data.
- Thinking RWO means "one Pod" — actually one node; want exactly one Pod → use RWOP.
- Writing shared data via NFS RWX for high-IOPS workload → slow and unpredictable file locking.
- Forgetting {{allowVolumeExpansion}} → cannot expand PVC in place.

### Sample interview answer
"Container filesystem disappears when Pod is recreated, so durable data must be on external volumes. PV is a real disk in the cluster, PVC is a Pod's request about capacity and access type, and StorageClass describes how to automatically create PV via CSI driver when there is a PVC — that is dynamic provisioning. Access mode RWO means read-write attach on one node, RWX means many nodes writing at once, needs file storage like EFS or NFS, and RWOP means exactly one Pod. Two configs I always check: reclaimPolicy Retain for important data so deleting PVC doesn't lose data, and volumeBindingMode WaitForFirstConsumer so the disk is created in the Pod's zone. I once hit a Pod Pending for 3 hours because the EBS disk was created in zone A while the Pod was only schedulable in zone B; changing the binding mode fixed it."

> Senior tip: For important data on Kubernetes, combine three things: StorageClass Retain, regular snapshots via VolumeSnapshot or Velero, and a restore drill every quarter. Data loss on K8s is usually from accidental deletion, not disk failure.`,
    follow: [
      'When choose static provisioning instead of dynamic?',
      'How migrate PVC to a new StorageClass without downtime?',
      'Why is Pod Pending with error "volume node affinity conflict"?'
    ]
  },

});