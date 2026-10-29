/*
 * English translation of js/data/q-devops.js — task T404. Format: js/core/i18n.js (content overlay).
 * ids: devops-028 devops-029 devops-030
 */
App.i18n.content({
  'devops-028': {
    q: 'You are moving an end-of-day interest calculation job (Spring Boot, takes about 40 minutes) to a Kubernetes CronJob. Some days the job runs twice, some days it does not run, and once it kept running until morning. How would you configure schedule, timeZone, concurrencyPolicy, startingDeadlineSeconds, backoffLimit, and activeDeadlineSeconds, and write the Spring Boot app so it exits when finished?',
    a: `**Summary:** A CronJob creates a **Job**, and a Job creates a **Pod**; each layer has its own rules. Prevent overlapping runs with {{concurrencyPolicy: Forbid}}; handle a missed schedule sensibly with {{startingDeadlineSeconds}}; limit retries with {{backoffLimit}}; prevent infinite runs with {{activeDeadlineSeconds}}; and set {{timeZone: Asia/Ho_Chi_Minh}} to avoid UTC calculation mistakes. Kubernetes only promises that a CronJob runs **approximately** once per schedule—sometimes twice, sometimes not at all—so the job must be **idempotent** and have a "did not run" alarm. The Spring Boot app runs with {{web-application-type=none}} and exits with the correct exit code when its work is done.

### Quick mental model
A CronJob is like a **foreman with an alarm clock**: when the time comes, the foreman hands a work ticket (Job) to a crew, and the crew assigns a worker (Pod). If the worker fails, the crew assigns another worker to retry, up to a limited number of times (backoffLimit). **Forbid** means "if yesterday's work is not finished, do not hand out more work today." **startingDeadlineSeconds** means "if we are more than X minutes late, skip this shift." **activeDeadlineSeconds** means "stop and report if the work takes more than 2 hours." And because the foreman occasionally hands out duplicate tickets, the ticket must clearly say "interest for October 29" so the crew knows to stop if that work has already been done.

### Terminology
- **CronJob**: creates Jobs according to a cron schedule; {{timeZone}} selects the time zone (stable since Kubernetes 1.27).
- **Job**: runs Pods until the required number of successful completions is reached; {{backoffLimit}} (default 6) is the number of retries before the Job is considered failed.
- **concurrencyPolicy**: {{Allow}} (default—permits overlapping runs), {{Forbid}} (skips the new run if the previous one is still running), {{Replace}} (cancels the old run and starts the new one).
- **startingDeadlineSeconds**: if a Job cannot be created on time for some reason (busy controller, cluster upgrade), it is still created within this window; after that, the run is skipped.
- **activeDeadlineSeconds**: the maximum lifetime of a Job; once exceeded, all its Pods are stopped and the Job fails.
- **ttlSecondsAfterFinished**: automatically deletes a finished Job after a period of time.
- **restartPolicy**: a Job's Pod may only use {{OnFailure}} or {{Never}}.

### Step-by-step mechanism
1. At 23:00 (according to timeZone), the CronJob controller sees that the schedule is due → creates Job {{daily-interest-29029120}} (CronJob name + scheduled time).
2. The Job creates a Pod running the app image with the {{batch}} profile. If the Pod fails (exit code other than 0), the Job creates a new Pod with increasing delays, up to {{backoffLimit}} retries.
3. The next day's schedule arrives while the previous day's Job is still running: with {{Forbid}}, the new run is skipped; with the default {{Allow}}, **two interest calculation jobs run concurrently**—the source of the "ran twice" problem.
4. The controller is busy or stopped at 23:00 (control plane upgrade): if it returns within {{startingDeadlineSeconds}}, it creates the missed Job; if this field is not set, the controller counts missed schedules and stops scheduling that CronJob after more than 100 misses—the source of the "did not run" problem.
5. The Job hangs (DB deadlock, waiting for a lock) → {{activeDeadlineSeconds}} stops it, the Job becomes Failed → an alarm fires.
6. The Spring Boot app opens no web port, runs its logic in {{ApplicationRunner}}, then calls {{System.exit(SpringApplication.exit(ctx))}} so the exit code reflects the result; without exiting, the Pod runs forever.

### Manifest
~~~yaml
apiVersion: batch/v1
kind: CronJob
metadata: { name: daily-interest }
spec:
  schedule: "0 23 * * *"
  timeZone: Asia/Ho_Chi_Minh          # without this field, use the controller's time zone (usually UTC)
  concurrencyPolicy: Forbid           # never let two interest calculation jobs run simultaneously
  startingDeadlineSeconds: 1800       # still run a job missed by less than 30 minutes
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 5           # retain failed Jobs so their logs can be inspected
  jobTemplate:
    spec:
      backoffLimit: 2                 # at most 3 attempts (1 + 2), not 7 as by default
      activeDeadlineSeconds: 7200     # stop and report an error after 2 hours
      ttlSecondsAfterFinished: 86400
      template:
        spec:
          restartPolicy: Never        # each attempt uses a new Pod, making logs easier to inspect
          containers:
            - name: job
              image: registry.example.com/core-batch:3f9c2a1
              args: ["--spring.profiles.active=batch", "--spring.main.web-application-type=none"]
~~~

### Code: exit when the app finishes
~~~java
@Component
@Profile("batch")
class InterestRunner implements ApplicationRunner {
    public void run(ApplicationArguments args) {
        LocalDate day = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        if (runs.isDone(day)) return;          // idempotent: stop if this day has already been calculated
        interestService.accrue(day);           // write in batches, one transaction per batch
        runs.markDone(day);
    }
}
// main: exit the JVM with Spring's exit code (runner exception → nonzero → Job marked failed)
public static void main(String[] a) {
    System.exit(SpringApplication.exit(SpringApplication.run(BatchApp.class, a)));
}
~~~

### Common mistakes
- **Leaving concurrencyPolicy at its default (Allow).** Symptom: yesterday's job runs slowly, today's job overlaps it, and interest is calculated twice. Prevention: {{Forbid}} + idempotency by day.
- **Not setting startingDeadlineSeconds.** Symptom: after a prolonged incident, the CronJob reports too many missed schedules and stops creating Jobs. Prevention: set an explicit value (a few tens of minutes).
- **The app does not exit by itself.** Symptom: the Pod stays Running forever, and Forbid blocks the next run. Prevention: {{web-application-type=none}}, exit explicitly, and use {{activeDeadlineSeconds}} as a safety net.
- **Cron interpreted in UTC.** Symptom: interest is calculated at 6 AM. Prevention: {{timeZone}}.
- **Default backoffLimit of 6 with a non-idempotent job.** Every attempt restarts from the beginning and may write duplicates. Prevention: reduce backoffLimit and write in checkpointed batches.
- **Another Pod competes for resources and the Job's Pod is evicted.** Prevention: set sufficient requests and use a higher PriorityClass for critical batch jobs.

### One-minute spoken answer
"A CronJob creates a Job, a Job creates Pods, and Kubernetes only promises approximately one run per schedule, so I first design the job to be idempotent by business date. For configuration: timeZone Asia/Ho_Chi_Minh avoids UTC drift; concurrencyPolicy Forbid prevents a slow job from yesterday overlapping today's; startingDeadlineSeconds of about 30 minutes allows a missed run to catch up and avoids scheduling stopping after too many missed schedules; a small backoffLimit; and activeDeadlineSeconds prevents a hung job from running until morning. The Spring Boot app runs without a web server, puts its logic in ApplicationRunner, and finally calls System.exit with Spring's exit code so the Job knows whether it succeeded or failed. Finally, I alarm both when the job fails and when no successful run appears by its expected deadline."

> Senior tip: financial jobs should run **in checkpointed batches** (for example, 10,000 accounts per batch, recording the last completed batch) so that if stopped midway, a retry resumes from that batch instead of repeating 40 minutes of work. Also track **daily job duration**—a job growing from 40 to 90 minutes over three months is an early warning before it hits activeDeadlineSeconds on a month-end night.`,
    follow: [
      'When should you use Spring Batch instead of writing your own ApplicationRunner for a long-running job?',
      'What kinds of jobs are suitable for concurrencyPolicy Replace?',
      'How can you manually rerun a job for a specific date without modifying the CronJob?'
    ]
  },
  'devops-029': {
    q: 'Every time the platform team upgrades Kubernetes nodes (draining them one by one), the payment service with 3 replicas experiences several minutes of 503 errors, and sometimes all 3 Pods are on the same node. How would you use PodDisruptionBudget, topologySpreadConstraints, and anti-affinity so node maintenance does not interrupt the service?',
    a: `**Summary:** Drain uses the **Eviction API**, and the Eviction API honors the **PodDisruptionBudget (PDB)**: with {{minAvailable: 2}} (or {{maxUnavailable: 1}}), drain may only evict a Pod while enough Pods remain ready. But a PDB is useless if all 3 Pods are on the same node or in the same zone—so you must **spread the Pods** using {{topologySpreadConstraints}} across nodes and zones (or pod anti-affinity). Add a correct readiness probe and graceful shutdown, and drain becomes an event nobody notices.

### Quick mental model
A cluster is like **a hospital with many on-call rooms**, and Pods are the doctors on duty. Maintaining a room (draining a node) means asking the doctors in that room to move elsewhere. The **PDB** is the rule "at least 2 doctors must be on duty at all times"—the coordinator may only ask a doctor to leave if enough doctors remain. **Topology spread** is the rule "do not put all 3 doctors in the same room or on the same floor"—otherwise, closing one room removes everyone, and no rule can save you.

### Terminology
- **Voluntary disruption**: intentional disruption—draining a node, upgrading a cluster, an autoscaler removing a node. A PDB only protects against this type.
- **Involuntary disruption**: a node dies, power is lost, a kernel panic occurs—a PDB **cannot** prevent this; only spreading Pods and having enough replicas limit the damage.
- **Eviction API**: the "polite" way to evict a Pod; the request is rejected (HTTP 429) if it would violate the PDB, and {{kubectl drain}} retries.
- **PodDisruptionBudget**: {{minAvailable}} or {{maxUnavailable}} for a group of Pods selected by labels.
- **topologySpreadConstraints**: asks the scheduler to spread Pods evenly according to a **topology key** ({{kubernetes.io/hostname}} for nodes, {{topology.kubernetes.io/zone}} for zones), with {{maxSkew}} as the maximum allowed imbalance.
- **Pod anti-affinity**: "do not schedule me alongside a Pod with label X"; hard ({{required}}) or soft ({{preferred}}).

### Step-by-step mechanism when draining node-1
1. The platform team runs {{kubectl drain node-1}}: the node is **cordoned** (it accepts no new Pods).
2. For each Pod on node-1, drain calls the Eviction API. The API server checks the payment service's PDB: there are currently 3 ready Pods and {{minAvailable: 2}} → evicting 1 is allowed.
3. The evicted Pod receives SIGTERM, is removed from the endpoints, and performs graceful shutdown. The Deployment sees a missing replica → creates a new Pod on another node.
4. If node-1 has **2** payment Pods: eviction of the second Pod is rejected (429) until the new Pod on another node is **ready**—drain waits instead of breaking the service. Why readiness matters: the PDB counts **ready** Pods, so incorrect readiness makes the PDB count incorrectly.
5. If all 3 Pods are on node-1 and there is no PDB: drain evicts all 3 at nearly the same time → 503 errors until the new Pods finish starting (Spring Boot needs 30–60 seconds).
6. With topology spread by hostname: the 3 Pods always sit on 3 different nodes → draining one node removes only one Pod, which the PDB permits immediately.

~~~text
No spreading, no PDB:             Spread + PDB minAvailable=2:
node-1 [P1 P2 P3]  ← drain        node-1 [P1] ← drain: evict P1 (P2, P3 still ready)
node-2 [ ]                        node-2 [P2]
node-3 [ ]                        node-3 [P3]       P1' starts on node-4; continue only once ready
→ 0 ready Pods → 503              → always ≥ 2 Pods serving traffic
~~~

### Manifest
~~~yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: payment-pdb }
spec:
  minAvailable: 2                     # with 3 replicas: only 1 can be evicted at a time
  selector:
    matchLabels: { app: payment }
---
# in the payment Deployment's Pod template:
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone       # spread evenly across zones
    whenUnsatisfiable: ScheduleAnyway              # still schedulable if zones are insufficient
    labelSelector:
      matchLabels: { app: payment }
  - maxSkew: 1
    topologyKey: kubernetes.io/hostname            # do not share a node
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels: { app: payment }
~~~

### How to configure a PDB
| Replicas | Configuration | Consequence |
|---|---|---|
| 1 | {{minAvailable: 1}} | **Blocks drain indefinitely**—node upgrade gets stuck |
| 2 | {{maxUnavailable: 1}} | Drain can proceed, but only 1 Pod carries the load during drain |
| 3+ | {{maxUnavailable: 1}} or {{minAvailable}} = N-1 | Balances safety against upgrade speed |
| HPA changes replica count | Prefer {{maxUnavailable}} | No need to modify the PDB when scaling |

### Common mistakes
- **A PDB for a 1-replica Deployment with minAvailable 1.** Symptom: drain hangs for hours and the platform team has to force-delete the Pod—worse than having no PDB. Prevention: run critical services with at least 2–3 replicas; a 1-replica service must accept interruption or use maxUnavailable 1.
- **A PDB exists, but the Pods are concentrated on one node.** The PDB slows drain, but a sudden node failure removes everything. Prevention: topology spread by hostname and zone.
- **Assuming a PDB protects during a rolling update.** A Deployment rolling update uses its own {{maxUnavailable}}/{{maxSurge}}, not the PDB.
- **Readiness always returns UP.** The PDB counts a Pod as "ready" even though it cannot actually serve traffic → drain continues and users see errors. Prevention: readiness must reflect the real ability to accept requests.
- **DoNotSchedule by zone in a cluster that only has capacity in one zone.** New Pods remain Pending forever. Prevention: use {{ScheduleAnyway}} for zones and {{DoNotSchedule}} for nodes if there are enough nodes.

### One-minute spoken answer
"Node drain uses the Eviction API, and the Eviction API honors the PodDisruptionBudget, so I configure a PDB for the payment service, usually maxUnavailable 1 with 3 replicas: drain only evicts a Pod while enough Pods remain ready, and eviction of the second Pod must wait until its replacement is ready. But a PDB cannot help if all three Pods share one node, and it does not protect against sudden node failure, so I add topologySpreadConstraints by hostname and zone to keep the Pods spread out. Readiness must be correct because the PDB counts ready Pods, and graceful shutdown prevents an evicted Pod from dropping requests. I avoid PDB minAvailable 1 for a 1-replica Deployment because it blocks drain indefinitely."

> Senior tip: include **"drain an arbitrary node during business hours"** in a recurring test—if the error dashboard does not move, the configuration is correct. I also add a policy (Kyverno/Gatekeeper) warning about every production Deployment that lacks a PDB or has a PDB that blocks drain, because platform teams often discover these problems on the very night of a cluster upgrade.`,
    follow: [
      'Does the cluster autoscaler honor PDBs when removing nodes, and how does that affect cost?',
      'How does topologySpreadConstraints differ from podAntiAffinity, and when should you use each?',
      'For a StatefulSet such as Kafka or PostgreSQL, how should the PDB differ from that of a stateless service?'
    ]
  },
  'devops-030': {
    q: 'The company decides that 8 teams will share one Kubernetes cluster instead of each team having its own. As the platform tech lead, how would you design boundaries between teams (namespace, RBAC, ResourceQuota, LimitRange, NetworkPolicy, Pod Security) so one team cannot crash the cluster, read another team’s data, or consume all of another team’s resources?',
    a: `**Summary:** One **namespace** per team (and environment); **RBAC** grants teams permissions within their own namespaces, with no cluster-wide permissions; **ResourceQuota** caps total CPU/RAM/Pod count per namespace, while **LimitRange** sets default requests/limits so even a Pod without declarations cannot consume unlimited resources; **NetworkPolicy** denies all inbound traffic by default and then opens only the required paths; **Pod Security Admission** at {{restricted}} blocks privileged containers and running as root. Wrap everything in **policy as code** (Kyverno/Gatekeeper), and use separate clusters for workloads requiring strong isolation (PCI, sensitive production). A namespace is a **soft** boundary—sufficient for teams that trust one another within a company, not for unknown customers.

### Quick mental model
A shared cluster is like **an office building divided among 8 subsidiaries**. **Namespaces** are the separate floors. **RBAC** is a key card that only opens your own floor. **ResourceQuota** is each floor's utility allowance—one floor running heaters all day cannot cut power to the whole building. **LimitRange** is the default rule for each device brought inside. **NetworkPolicy** is the doors between floors: locked by default, opened only where there is a reason. **Pod Security** is the rule "no gas canisters in the office." The building still shares its foundation (control plane, nodes, kernel)—so anyone needing absolute isolation must rent a separate building.

### Terminology
- **Namespace**: a scope for names and policies; most objects (Pod, Service, Secret) belong to a namespace; nodes, PersistentVolumes, and ClusterRoles do not.
- **Role/RoleBinding vs ClusterRole/ClusterRoleBinding**: permissions within one namespace versus across the whole cluster.
- **ResourceQuota**: total allowances for a namespace ({{requests.cpu}}, {{limits.memory}}, {{pods}}, number of LoadBalancer Services, etc.). When a quota includes CPU/memory, **every Pod must declare** the corresponding requests/limits or it is rejected.
- **LimitRange**: default values and min/max constraints for each container in a namespace.
- **NetworkPolicy**: firewall rules at the Pod layer; effective only when the **CNI supports it** (Calico, Cilium, etc.), otherwise creating policies has no effect.
- **Pod Security Admission**: a built-in mechanism using the namespace label {{pod-security.kubernetes.io/enforce}} with level {{privileged}}, {{baseline}}, or {{restricted}}.
- **Policy as code**: Kyverno or OPA Gatekeeper validates every manifest at creation time (require an owner label, forbid the latest image tag, require a PDB, etc.).

### Step-by-step mechanism when onboarding a team
1. **Create namespaces** {{payments-prod}} and {{payments-uat}} with owner, cost-center, and Pod Security level labels. Why separate environments by namespace: quotas, permissions, and NetworkPolicies differ by environment.
2. **RBAC**: the team's SSO group receives the {{edit}} Role in the UAT namespace and only {{view}} in production (production deployment goes through a pipeline/GitOps, not manual kubectl).
3. **Quota and LimitRange**: based on real measurements, for example 40 vCPU requests, 80 Gi RAM, 150 Pods; LimitRange defaults requests to 250m/512Mi so a Pod that omits declarations still counts against quota.
4. **NetworkPolicy default deny ingress**, then allow: from the ingress-controller namespace to port 8080; from {{orders-prod}} to {{payments-prod}} port 8080; egress to DB/Kafka if egress restrictions are enabled.
5. **Admission**: Pod Security {{restricted}} (no root, no privileged mode, drop capabilities); Kyverno requires requests/limits, probes, an owner label, and images from the internal registry.
6. **Observability and cost**: per-namespace dashboards, cost allocation by label (OpenCost/Kubecost), and alerts when a namespace uses over 85% of its quota.

~~~text
Shared cluster
├── ns payments-prod  [RBAC: view | Quota 40 CPU/80Gi | PSA restricted | NetPol default-deny]
│      ▲ allow only: ingress-nginx → :8080, orders-prod → :8080
├── ns orders-prod    [RBAC: view | Quota 30 CPU/60Gi | PSA restricted]
├── ns payments-uat   [RBAC: edit | Quota 10 CPU/20Gi]
└── ns platform-*     (ingress, monitoring, Kyverno) — platform team only
~~~

### Core manifest
~~~yaml
apiVersion: v1
kind: ResourceQuota
metadata: { name: quota, namespace: payments-prod }
spec:
  hard:
    requests.cpu: "40"
    requests.memory: 80Gi
    limits.memory: 120Gi
    pods: "150"
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: default-deny-ingress, namespace: payments-prod }
spec:
  podSelector: {}                     # applies to every Pod in the namespace
  policyTypes: ["Ingress"]            # no ingress rules declared = deny all
~~~

### Shared cluster or separate clusters
| Criterion | One cluster, many namespaces | One cluster per team |
|---|---|---|
| Cost | Low: shared control plane, better-filled nodes | High: control plane and add-ons multiplied by 8 |
| Operations | One upgrade, one set of add-ons | 8 upgrades, version drift likely |
| Isolation | Soft: shared kernel, shared API server | Strong |
| Blast radius | A control plane/add-on failure affects every team | Limited to one team |
| Suitable for | Internal teams that trust one another | PCI data, external customers, regulatory requirements |

### Common mistakes
- **Granting cluster-admin "for convenience."** One mistaken command deletes another team's CRD or namespace. Prevention: namespace-scoped permissions, cluster-wide access only for the platform team.
- **Quota without LimitRange.** Symptom: Pods without declared requests are rejected with confusing errors, and the team says "the cluster is broken." Prevention: set defaults with LimitRange and provide documentation.
- **Creating NetworkPolicies on an unsupported CNI.** You think traffic is blocked, but every Pod can still call every other Pod. Prevention: test with real Pods ({{curl}} across namespaces) after applying policies.
- **Default deny egress while forgetting DNS.** Symptom: no Pod can resolve names. Prevention: first open egress to CoreDNS on port 53 UDP/TCP.
- **Setting quotas by guesswork.** Too tight and teams cannot deploy during an incident; too loose and quotas are meaningless. Prevention: base them on measurements, review quarterly, and provide a fast quota-increase process.

### One-minute spoken answer
"I set boundaries by namespace for each team and environment. RBAC is tied to SSO groups: teams have edit access in UAT and only view access in production because production deployment goes through a pipeline. ResourceQuota caps total CPU, RAM, and Pod count per namespace, while LimitRange sets default requests so Pods that omit declarations still count against quota. NetworkPolicy denies ingress by default and then opens the required paths, provided the CNI supports it, and I remember to allow DNS when restricting egress. Pod Security Admission at restricted blocks root and privileged containers, while Kyverno requires probes, requests, owner labels, and internal images. A namespace is a soft boundary because the kernel and control plane are shared, so I use separate clusters for PCI workloads or external customers."

> Senior tip: **measure shared-cluster success by onboarding time**—if a new team has to wait two weeks for the platform team to provide a namespace, they will demand their own cluster. Package the entire set of boundaries (namespace, RBAC, quota, NetworkPolicy, PSA label) into a GitOps template: the team opens one pull request and, after review, has a standard environment within an hour.`,
    follow: [
      'When is a namespace boundary insufficient, requiring a separate cluster or dedicated node pool?',
      'How do you handle a team that repeatedly hits its quota during an incident?',
      'How can you allocate shared-cluster costs fairly across teams?'
    ]
  }
});
