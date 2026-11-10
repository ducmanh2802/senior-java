/*
 * English translation of js/data/q-devops.js — task T981. Format: js/core/i18n.js (content overlay).
 * ids: devops-129 devops-130 devops-131 devops-132 devops-133 devops-134 devops-135 devops-136
 */
App.i18n.content({
  'devops-129': {
    q: 'What is a StatefulSet? When should you use a StatefulSet instead of a Deployment, and should you run PostgreSQL/Redis on Kubernetes?',
    a: `**Summary:** StatefulSet is for workloads where **each replica has its own identity**: fixed Pod names ({{db-0}}, {{db-1}}), fixed DNS via a headless Service, **a dedicated PVC per Pod** (volumeClaimTemplates) and startup/shutdown order. Deployment treats Pods as interchangeable replicas. Running PostgreSQL/Redis on Kubernetes is **fine**, but via a mature **operator** (CloudNativePG, Zalando, Redis operator) and only when the team has enough operational capability; otherwise managed services (RDS, ElastiCache) are usually cheaper when counting engineering time.

### StatefulSet vs Deployment
| Criterion | Deployment | StatefulSet |
|---|---|---|
| Pod name | Random (order-7c9f-xk2p) | Fixed ordinal number (db-0, db-1) |
| Volume | Shared single PVC or none | One dedicated PVC per Pod, preserved when Pod is recreated |
| DNS | Via Service (load balancing) | Per Pod: db-0.db-headless.ns.svc.cluster.local |
| Order | Parallel | Default sequential 0 -> N on create, N -> 0 on delete |
| Update | Rolling, create new Pod first | Rolling from highest number down to 0; partition for canary |
A headless Service ({{clusterIP: None}}) does not load balance but returns the IP of each Pod, so the client knows exactly which Pod is primary.

~~~yaml
apiVersion: apps/v1
kind: StatefulSet
metadata: { name: redis }
spec:
  serviceName: redis-headless     # headless Service for per-Pod DNS
  replicas: 3
  selector: { matchLabels: { app: redis } }
  template: { metadata: { labels: { app: redis } }, spec: { containers: [ { name: redis, image: redis:7 } ] } }
  volumeClaimTemplates:           # one PVC per Pod: data-redis-0, data-redis-1...
    - metadata: { name: data }
      spec: { accessModes: [ReadWriteOnce], resources: { requests: { storage: 10Gi } } }
~~~

### What StatefulSet does NOT do
It does not know about replication, failover, backup, or DB version upgrades. Scaling down from 3 to 2 only deletes Pod {{redis-2}} (PVC stays), it does not move data or change primary. The "DB understanding" is handled by the **operator**: self-configuring replication, failover, backup to S3, per-node upgrades.

### Should you run DB on Kubernetes?
| Worth considering when | Use managed service when |
|---|---|
| Running on-premises, no RDS | Running on cloud, small team |
| Need many small DBs for dev/test | Important production DB, few people know operations |
| Team has DB + K8s experience, uses mature operator | Need availability commitment and tested backup |
Real risks: node drain during cluster upgrade, Pod move must reattach volume, CSI errors; memory tuning (shared_buffers vs limit), noisy neighbor.

### Real-world example
A company ran PostgreSQL with a hand-written StatefulSet (no operator) on an on-premise cluster. During a node upgrade, primary {{pg-0}} was drained; nothing automatically promoted a new primary → writes failed for 18 minutes until someone manually fixed it. They switched to CloudNativePG: 3 instances, automatic failover, continuous WAL backup to MinIO, PodDisruptionBudget preventing simultaneous drains. The next node upgrade: controlled switchover took about 6 seconds. For the cloud environment of a subsidiary, they still chose RDS because they only had 2 infrastructure people.

### Pitfalls
- Using a Deployment for DB with a single RWO PVC → a new Pod cannot attach the volume until the old Pod is fully dead.
- Thinking deleting a StatefulSet deletes data — the PVC remains (and still costs money); conversely deleting a PVC loses data.
- No PodDisruptionBudget → node drain can take down multiple replicas at once.
- Treating StatefulSet as a DB HA solution.

### Interview answer
"A StatefulSet is used when each replica has its own identity. Each Pod has a fixed name like db-0, db-1, its own DNS via a headless Service, its own PVC created from volumeClaimTemplates and preserved when the Pod is recreated, and is started/stopped in order. Deployment treats Pods as interchangeable replicas, suitable for stateless services. The important point is that a StatefulSet does not understand DBs: it does not do replication, failover, or backup. So if running PostgreSQL or Redis on Kubernetes, I use a mature operator like CloudNativePG, with PodDisruptionBudget and backup to object storage. Whether you should run it or not, I consider the team's capability: on cloud with a small team, RDS or ElastiCache is usually cheaper when counting engineering time; on-premises or many small DBs for dev/test, an operator is very suitable."

> Senior tip: before running production DBs on Kubernetes, drill three scenarios: drain the node running primary, delete the primary Pod, and restore from backup to another cluster. If all three are not smooth, use a managed service.`,
    follow: [
      'How does a headless Service differ from a regular Service?',
      'How do you scale down a StatefulSet without losing data?',
      'When is an operator better than a Helm chart for a DB?'
    ],
  },
  'devops-130': {
    q: 'How does Kubernetes RBAC work: Role/ClusterRole, RoleBinding, ServiceAccount? What are the minimum permissions for a CI pipeline to deploy into 1 namespace?',
    a: `**Summary:** Kubernetes RBAC answers the question **who** (User/Group/ServiceAccount) **can do what** (verb: get, list, create, patch…) **on which resources** (deployments, secrets…) **at what scope** (Role within one namespace, ClusterRole across the whole cluster). Binding attaches permissions to a subject. A CI pipeline deploying into one namespace needs a **dedicated ServiceAccount + Role limited to that namespace**, with just enough verbs to update workloads — no cluster-admin, no reading Secrets if not needed.

### Four objects
- **Role**: list of permissions within **one namespace**.
- **ClusterRole**: permissions for cluster-level resources (nodes, namespaces, CRD) or a reusable set of permissions across multiple namespaces.
- **RoleBinding**: attaches a Role (or ClusterRole) to a subject **within one namespace**.
- **ClusterRoleBinding**: attaches a ClusterRole to a subject **across the whole cluster** — powerful, use sparingly.
RBAC has only **allow** (no deny); permissions are the union of all bindings.

### Minimum permissions for CI deploying into namespace shop
~~~yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata: { name: ci-deployer, namespace: shop }
rules:
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list", "watch", "patch", "update"]   # change image, view rollout
  - apiGroups: [""]
    resources: ["services", "configmaps"]
    verbs: ["get", "list", "create", "patch", "update"]
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]                        # monitor rollout, no exec
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata: { name: ci-deployer, namespace: shop }
subjects: [ { kind: ServiceAccount, name: ci-deployer, namespace: shop } ]
roleRef: { kind: Role, name: ci-deployer, apiGroup: rbac.authorization.k8s.io }
~~~
No {{secrets}}, {{pods/exec}}, {{delete}} namespace, {{roles}}/{{rolebindings}} (avoid self-escalating permissions). If using Helm, it needs additional permissions for Secret (Helm stores releases as Secret) — state the reason clearly.

### Testing and audit
- {{kubectl auth can-i patch deployments -n shop --as=system:serviceaccount:shop:ci-deployer}} → yes/no.
- {{kubectl auth can-i --list --as=...}} lists all effective permissions.
- Enable API server audit log; store RBAC manifests in Git (GitOps) so every change goes through review.

### ServiceAccount token
- Since Kubernetes 1.24, tokens are no longer automatically created as permanent Secrets; Pods receive **short-lived tokens** (projected, auto-rotated).
- If a Pod does not need to call the API, set {{automountServiceAccountToken: false}} — even if the container is compromised, there is no token to call the API.
- CI outside the cluster: prefer OIDC identity (e.g. GitHub Actions OIDC → IAM → EKS access entry) instead of long-lived tokens pasted into CI variables; or use GitOps so CI does not need cluster permissions.

### Real-world example
A security audit of a cluster found the Jenkins ServiceAccount had ClusterRoleBinding {{cluster-admin}}, with long-lived tokens in environment variables of 60 jobs. A vulnerability in one Jenkins plugin meant full cluster access, including reading production DB Secrets. Replace with one ServiceAccount per namespace with the Role above, short-lived tokens, then switch fully to Argo CD (CI only pushes images and edits Git). The number of subjects able to read production Secrets dropped from 14 to 3.

### Pitfalls
- Giving CI {{*}} on {{*}} "for speed".
- Granting permission to create RoleBinding → the subject can grant itself more permissions.
- {{pods/exec}} permission in production → anyone with it can read every Secret the Pod sees.
- Forgetting that {{create pods}} permission is enough to run a Pod using any ServiceAccount in the namespace.

### Interview answer
"RBAC answers who can do what on which resource at what scope. Role is permission within a namespace, ClusterRole is for cluster-level resources or reusable permission sets, RoleBinding and ClusterRoleBinding attach permissions to Users, Groups, or ServiceAccounts. RBAC has only allow, no deny. For a CI pipeline deploying into a namespace, I create a dedicated ServiceAccount and a Role in exactly that namespace, allowing get, list, watch, patch deployments, updating services and configmaps, viewing pods to monitor rollout. No permission to read secrets, no exec, no creating rolebindings to prevent self-escalation. I test with kubectl auth can-i as serviceaccount, and store RBAC in Git so changes go through review. Even better: keep CI out of the cluster — CI only pushes images and edits Git, while Argo CD inside the cluster handles deployments."

> Senior tip: periodically run {{kubectl auth can-i --list}} for each ServiceAccount and compare with the expected list. RBAC permissions only increase over time because everyone "adds to make it run" but no one removes.`,
    follow: [
      'When do you need ClusterRole instead of Role?',
      'How do you audit RBAC changes?',
      'What are the risks of automatically mounting ServiceAccount tokens?'
    ],
  },
  'devops-131': {
    q: 'What does Kubernetes backup include? How do Velero + object storage (MinIO/S3) work and how do you rehearse restoration?',
    a: `**Summary:** Kubernetes backup consists of three parts: **cluster state** (etcd or all manifests in Git), **application resources** (Deployment, ConfigMap, Secret, CRD…) and **volume data**. **Velero** backs up resources via the API server as files to object storage (S3/MinIO) and backs up volumes via storage **snapshots** or **file-system backup** (Kopia). Backup is only valuable when **restoration has been tested successfully** — rehearse regularly to another cluster and measure time.

### What backup includes
| Component | Backup method |
|---|---|
| Application manifests | Git (GitOps) is the primary source; Velero is the safety net (catches manually created resources too) |
| etcd (self-managed cluster) | {{etcdctl snapshot save}} regularly, stored outside the cluster, encrypted |
| PV data | Snapshot (CSI VolumeSnapshot, EBS snapshot) or file-system backup |
| Database | Backup at the DB layer (pg_basebackup + WAL, operator backup) — more consistent than disk snapshots |
| Outside cluster | Secrets in vault, DNS, certificates, IAM — documented clearly in runbook |
Managed clusters (EKS/GKE/AKS) — the provider handles etcd; you handle the rest.

### How Velero works
1. Velero server runs in the cluster; you create a **Backup** or **Schedule** (cron) selecting by namespace/label.
2. Velero reads resources via the API server, compresses into tarballs and pushes to **BackupStorageLocation** (S3/MinIO bucket).
3. For volumes: call the provider/CSI snapshot plugin, or use **file-system backup** (node agent reads volume data via Kopia) when storage has no snapshot.
4. **Restore**: recreate resources in the correct order (namespace, CRD, PVC, then workload); by default **does not overwrite** existing resources (option {{--existing-resource-policy=update}}).
~~~bash
velero schedule create daily-shop --schedule="0 2 * * *"   --include-namespaces shop --ttl 720h          # keep 30 days
velero backup describe daily-shop-20261107020000 --details
velero restore create --from-backup daily-shop-20261107020000   --namespace-mappings shop:shop-restore-test     # restore to another namespace to test
~~~

### Snapshot vs file-system backup
| | Snapshot | File-system backup (Kopia) |
|---|---|---|
| Speed | Fast, at storage layer | Slower, reads file by file |
| Restore to different region/provider | Limited (snapshot tied to cloud/region) | Flexible, data in bucket |
| Application consistency | Crash-consistent; needs hooks (fsfreeze, flush DB) | Reading while app writes → needs hooks |
Velero supports **pre/post hooks** (e.g. run flush/lock-write command before snapshot).

### Restoration rehearsal
- Each quarter: restore the latest backup to a **separate cluster/namespace**, run smoke test, verify data (count lines, checksum), record **actual restoration time** against RTO.
- Backup bucket: enable versioning + **object lock**, account/region different from main cluster — protect against accidental deletion and ransomware.

### Real-world example
A {{kubectl delete namespace}} command run with wrong context deleted the production namespace containing 23 deployments and 6 PVCs (reclaim Delete). Velero ran nightly but had never been tested: the first restore failed because cert-manager CRDs were not yet on the cluster and the snapshot plugin lacked IAM permissions. Restoration took 5 hours 40 minutes, losing 9 hours of data from the 2 AM backup. After the incident: backup every 4 hours, DB switched to continuous WAL backup, StorageClass Retain, quarterly drills. The third drill restored everything in 38 minutes.

### Pitfalls
- Backup in same account/region as cluster → both lost at the same time.
- Only backing up manifests, forgetting volume data (or vice versa).
- Snapshot of a DB disk while writing without hooks → restore produces corrupted data.
- Never testing restoration.

### Interview answer
"My Kubernetes backup consists of three parts: cluster state, meaning etcd if self-managed or all manifests in Git; application resources; and volume data. I use Velero: it reads resources via the API server, pushes them to S3 or MinIO buckets on a schedule, and for volumes uses storage snapshots or file-system backup via Kopia when restoring elsewhere is needed. For DBs I back up at the DB layer, such as continuous WAL, because it is more consistent than disk snapshots. The backup bucket is in a different account and region, with versioning and object lock enabled. Most importantly, rehearse: each quarter restore to a separate cluster or namespace, run smoke tests, verify data, and measure actual time against RTO. I once saw a team with nightly backups whose first restore failed due to missing CRDs and IAM permissions, losing nearly six hours."

> Senior tip: make "restore to a temporary namespace and run smoke test" an automated weekly job. A backup never restored is just a file taking up space.`,
    follow: [
      'When to use snapshot instead of file-system backup?',
      'How do you back up etcd on a self-managed cluster?',
      'Can Velero restore overwrite existing resources?'
    ],
  },
  'devops-132': {
    q: 'What is a DaemonSet? How do taints/tolerations and nodeSelector/affinity place log/monitoring agents?',
    a: `**Summary:** A **DaemonSet** ensures **each node** (or each node meeting a condition) runs exactly one Pod — used for node-level agents: log collection (Fluent Bit), host metrics (node-exporter), networking (CNI), security. **nodeSelector/affinity** is the Pod **actively choosing** a node; **taint/toleration** is the node **rejecting** Pods unless the Pod tolerates the taint. Monitoring agents usually need broad toleration to run on special nodes (GPU, control plane).

### How DaemonSet works
- The controller creates one Pod for each suitable node; new nodes joining the cluster automatically get a Pod, leaving nodes have their Pod removed.
- No {{replicas}} — number of Pods = number of suitable nodes.
- Update type {{RollingUpdate}} with {{maxUnavailable}} (default 1 node at a time); {{maxSurge}} can be used to run new Pods in parallel before stopping old ones (avoiding log gaps).
- Agents often need host access: {{hostPath}} (read /var/log/pods), {{hostNetwork}}, sometimes special privileges → must be tightly restricted.

### Taint and toleration
Taint attached to node: {{key=value:Effect}}.
| Effect | Meaning |
|---|---|
| NoSchedule | Do not schedule new Pods missing toleration |
| PreferNoSchedule | Avoid if possible |
| NoExecute | Immediately evict running Pods missing toleration |
Example: a GPU node has taint {{gpu=true:NoSchedule}} so only ML jobs run there. Control plane usually has taint {{node-role.kubernetes.io/control-plane:NoSchedule}}. Kubernetes also adds taints when a node has issues (not-ready, disk-pressure); the DaemonSet controller auto-adds tolerations for these system taints so agents are not evicted when a node has problems.

### nodeSelector and affinity
- **nodeSelector**: simple equality condition ({{disktype: ssd}}).
- **nodeAffinity**: richer expression, with **required** type ({{requiredDuringSchedulingIgnoredDuringExecution}}) and **preferred** type ({{preferred...}}).
- **podAntiAffinity/topologySpreadConstraints**: spread Deployment Pods across different nodes/zones (not needed for DaemonSet since already one Pod per node).

~~~yaml
apiVersion: apps/v1
kind: DaemonSet
metadata: { name: fluent-bit, namespace: logging }
spec:
  selector: { matchLabels: { app: fluent-bit } }
  updateStrategy: { type: RollingUpdate, rollingUpdate: { maxUnavailable: 10% } }
  template:
    metadata: { labels: { app: fluent-bit } }
    spec:
      tolerations:
        - operator: Exists            # tolerate all taints: run on GPU nodes, control plane too
      containers:
        - name: fluent-bit
          image: fluent/fluent-bit:3.1
          resources: { requests: { cpu: 50m, memory: 64Mi }, limits: { memory: 200Mi } }
          volumeMounts: [ { name: varlog, mountPath: /var/log, readOnly: true } ]
      volumes: [ { name: varlog, hostPath: { path: /var/log } } ]
~~~

### Real-world example
A cluster added a GPU node pool with taint {{nvidia.com/gpu:NoSchedule}}. Fluent Bit and node-exporter had no toleration so they did not run on the new nodes; three weeks later, a training job died due to full disk with no logs or metrics to investigate. Add toleration {{operator: Exists}} to monitoring agents, set appropriate request/limit, add alert "DaemonSet ready Pods < nodes". At the same time discovered Fluent Bit without a memory limit was consuming 1.5GB when Elasticsearch was slow — set limits and enable disk buffer.

### Pitfalls
- Agent missing toleration → "blind spot" on special nodes.
- DaemonSet without resource request → scheduler does not account for the agent, node becomes overloaded.
- DaemonSet update with {{maxUnavailable}} too large → lose logs on multiple nodes at once.
- Using toleration {{Exists}} for regular application workloads → Pods run on control plane or expensive nodes.

### Interview answer
"A DaemonSet ensures each suitable node runs exactly one Pod, so use it for node-level agents like Fluent Bit for log collection, node-exporter, CNI. New nodes automatically get a Pod, no replicas needed. To decide where a Pod runs there are two directions. nodeSelector and nodeAffinity let the Pod actively choose a node by labels, with required and preferred types. Taints are nodes rejecting Pods; only Pods with matching tolerations are scheduled there, e.g. GPU nodes only for ML jobs. For monitoring agents I usually use broad toleration to run on GPU nodes and control planes too, otherwise there are blind spots. I always set resource request and limit for agents, use rolling updates with small maxUnavailable, and alert when the number of ready DaemonSet Pods is less than the number of nodes."

> Senior tip: add an alert comparing {{kube_daemonset_status_number_ready}} with {{kube_daemonset_status_desired_number_scheduled}} for every important agent. A missing agent on a node is a silent error that only surfaces when you need that node's logs.`,
    follow: [
      'When to use DaemonSet instead of Deployment?',
      'How do you do safe rolling updates for DaemonSet?',
      'Do taints affect cluster autoscaler?'
    ],
  },
  'devops-133': {
    q: 'How does GitOps with Argo CD/Flux differ from CI pushing kubectl apply? What is drift detection?',
    a: `**Summary:** With **CI push**, the pipeline keeps cluster access and runs {{kubectl apply}}/{{helm upgrade}} — the actual cluster state can drift from Git without anyone knowing. With **GitOps** (Argo CD/Flux), Git is the **single source of truth**; a controller **inside the cluster** continuously **pulls** Git and brings the cluster to the correct state. **Drift detection** is detecting where the cluster differs from Git (someone edited manually) and reporting or automatically correcting it (self-heal).

### Two models
~~~seq
title: GitOps - CI only edits Git, Argo CD pulls to cluster
actors: Dev | CI | GitRepo | ArgoCD | Cluster
Dev -> CI: merge PR to app repo
CI -> CI: build, test, push image v1.4.2
CI -> GitRepo: edit image tag in config repo
ArgoCD -> GitRepo: poll / webhook: new commit exists
ArgoCD -> Cluster: apply manifest, wait for healthy
ArgoCD -> ArgoCD: continuously compare Git and cluster (drift)
~~~
| Criterion | CI push | GitOps pull |
|---|---|---|
| Cluster access | CI keeps strong credential | Only controller inside cluster |
| Actual state | Knows at deploy, then can drift | Continuous comparison, shows drift |
| Rollback | Run old pipeline again | {{git revert}} |
| Audit | Pipeline log | Git history (who, when, review) |
| Multiple clusters | One step per cluster | ApplicationSet generates apps for multiple clusters |

### How drift detection works
- Argo CD renders manifests from Git (YAML, Helm, Kustomize), compares with live state, app status: **Synced** or **OutOfSync** with diff.
- {{syncPolicy.automated.selfHeal: true}}: automatically re-applies when someone edits manually ({{kubectl edit}}); {{prune: true}}: deletes resources no longer in Git.
- Some fields managed by other systems (e.g. {{replicas}} with HPA) need {{ignoreDifferences}}, otherwise Argo CD and HPA "tug-of-war" each other.

### Secrets in GitOps
Do not commit secrets in plain form. Options: **External Secrets Operator** (sync from AWS Secrets Manager/Vault into K8s Secrets), **Sealed Secrets** (encrypted with controller's public key, only cluster can decrypt), or SOPS.

### When to still use CI push
Small team, one cluster, few services; or temporary workloads (preview environment per PR) — GitOps adds another repo and a controller to operate.

### Real-world example
A company of 35 services deployed via Jenkins running {{kubectl apply}}. During an incident, the on-call engineer manually edited memory limits and env vars of 4 deployments; two weeks later a deploy overwrote back, the old incident recurred, and it took 3 hours to understand why. Switched to Argo CD with selfHeal and OutOfSync alerts: every emergency change must be a commit (can be fast-merged), rollback via revert takes about 2 minutes, cluster-admin credentials removed from Jenkins. In the first quarter Argo CD detected 11 manual edits, all converted to commits or reverted.

### Pitfalls
- Enabling selfHeal while on-call still edits manually → emergency changes reverted mid-incident; need an "emergency commit" process.
- Not {{ignoreDifferences}} for fields managed by HPA/operator.
- Leaving image tag {{latest}} → Git does not reflect the actual running version.
- One huge config repo without permissions → everyone can edit production.

### Interview answer
"With CI push, the pipeline keeps cluster access and runs kubectl apply or helm upgrade; after deploy, if someone edits manually, the cluster drifts from Git without anyone knowing. With GitOps, Git is the single source of truth: CI only builds, tests, pushes images, then edits image tags in the config repo, while Argo CD or Flux runs inside the cluster pulling Git and bringing the cluster to the correct state. Drift detection is the controller continuously comparing Git and cluster, marking OutOfSync with diff, and if selfHeal is enabled, automatically reverting manual changes. Benefits: CI does not need strong credentials, rollback via git revert, audit via Git history. Note ignoreDifferences for HPA-managed fields, and use External Secrets or Sealed Secrets for secrets. At my previous company, Argo CD detected 11 manual edits in the first quarter."

> Senior tip: when introducing GitOps, write up an "emergency change during incident" process upfront (one-line PR, one approver, merge within 5 minutes). Without it, the on-call person will disable selfHeal at the first incident and never turn it back on.`,
    follow: [
      'When keep CI push for simple workloads?',
      'How do you handle secrets in GitOps (Sealed Secrets/ESO)?',
      'When to use Argo CD ApplicationSet?'
    ],
  },
  'devops-134': {
    q: 'How do Helm chart and Kustomize differ? When to choose which for Java services on K8s?',
    a: `**Summary:** **Helm** is a package manager: chart is a **template** (Go template) + {{values.yaml}}, installed as a **release** with versioning, upgrade and rollback — suitable for **packaging distribution** (shared chart for many services, third-party charts). **Kustomize** does not use templates: takes original YAML (**base**) then applies **overlay/patch** per environment — simple, YAML always valid, built into {{kubectl apply -k}}. For Java services: one **shared chart** for all Spring Boot services, or Kustomize base + overlay when the team has few services and wants to read YAML directly.

### How Helm works
- Chart: {{Chart.yaml}}, {{values.yaml}}, {{templates/}} directory; Helm renders template with values into manifests then applies.
- Release stores history (as Secrets in namespace); {{helm rollback}} reverts to a previous revision.
- Dependencies between charts, OCI repository for distribution, hooks (run migration job before upgrade).
~~~yaml
# templates/deployment.yaml (excerpt) - one chart used for all Spring Boot services
spec:
  replicas: {{ .Values.replicas }}
  template:
    spec:
      containers:
        - name: app
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          env:
            - name: JAVA_TOOL_OPTIONS
              value: "-XX:MaxRAMPercentage=70 {{ .Values.jvmExtraOpts }}"
          readinessProbe: { httpGet: { path: /actuator/health/readiness, port: 8080 } }
~~~

### How Kustomize works
~~~text
base/                  deployment.yaml, service.yaml, kustomization.yaml
overlays/staging/      kustomization.yaml (replicas: 2, configMapGenerator)
overlays/prod/         kustomization.yaml (replicas: 6, patch increase memory, HPA)
kubectl apply -k overlays/prod
~~~
Patches have two types: **strategic merge** (write part of YAML, merge by key) and **JSON 6902 patch** (exact op/path/value operations). {{configMapGenerator}} adds hash to ConfigMap name → config change automatically triggers rolling restart.

### Comparison
| Criterion | Helm | Kustomize |
|---|---|---|
| Mechanism | Template + values | Base + patch, no template |
| Conditional/loop logic | Yes (easy to abuse) | No (intentional) |
| Versioning, rollback | Release, {{helm rollback}} | Based on Git |
| Distribution to others | Excellent (repository) | Poorer |
| Readability | Dense template hard to read | Plain YAML |
| With Argo CD | Supported | Supported |
Both can be combined: Kustomize has {{helmCharts}} to render charts then patch further; Argo CD renders both.

### Suggestions for Java services
- Many similar Spring Boot services → one **internal chart** (Actuator probe, JVM options, resources, PodDisruptionBudget, ServiceMonitor) with separate values per service; change one place applies to all.
- Few services, each different, team wants to read YAML directly → Kustomize base + overlay per environment.
- CI testing: {{helm lint}}, {{helm template}} + kubeconform to validate schema, test output values (helm-unittest).

### Real-world example
A team had 22 Spring Boot services, each service copying its own set of YAML. When needing to add {{preStop}} sleep for graceful shutdown and change readiness path to Actuator, had to edit 22 repos, missed 5 → those services kept dropping requests on every deploy. Switched to a versioned internal chart: the next change (adding PodDisruptionBudget) was just one chart release and bumping version in 22 values files via Renovate — done in one day, no service missed.

### Pitfalls
- Helm templates full of nested {{if}} → no one can read; keep charts simple, few options.
- Putting secrets in values.yaml committed to Git.
- Kustomize overlays stacked many layers → hard to know final values; use {{kustomize build}} to view.
- Helm release upgrade failing mid-way leaves {{pending-upgrade}} state blocking subsequent ones.

### Interview answer
"Helm is a package manager: chart consists of template and values, installed as a release with versioning, upgrade and rollback, so it is very suitable for packaging and distribution, e.g. one shared chart for all services or third-party charts. Kustomize has no template: I write original YAML as base then patch by environment via overlay, YAML is always valid and readable directly, built into kubectl. For many similar Spring Boot services, I choose an internal chart packaging Actuator probe, JVM options, resources, PodDisruptionBudget; each service only has its own values file; change one place applies to all. If few services and each is different, Kustomize is simpler. In CI I run helm lint, render template, then validate schema with kubeconform. In a previous project, moving 22 services to a shared chart meant changes like adding preStop no longer missed any service."

> Senior tip: keep internal charts like a library with semantic versioning and changelog. Services bump chart versions like bumping a dependency, can be done step by step, instead of all services changing at once when the chart changes.`,
    follow: [
      'How should Helm values secrets be managed?',
      'How do Kustomize strategic merge patches differ from JSON patches?',
      'How do you test Helm charts in CI?'
    ],
  },
  'devops-135': {
    q: 'Observability on K8s: how do you implement metrics/logs/traces for Java services? Prometheus/Grafana/Loki/Tempo or managed?',
    a: `**Summary:** Observability on K8s for Java services includes metrics (Prometheus scraping Actuator), logs (Fluent Bit → Loki, structured JSON), traces (OpenTelemetry → Tempo); managed (Datadog/CloudWatch) reduces operational effort but costs more; start with self-hosted metrics+logs+traceId.

### Metrics
- Spring Boot Actuator + Micrometer expose /actuator/prometheus (JVM heap/GC, thread, HTTP p95/p99, Hikari pool).
- Prometheus scrapes via ServiceMonitor (Prometheus Operator) or static config.
- Grafana dashboards + Alertmanager rules based on SLO (error rate, latency).
- Keep cardinality low: do not label user id/request id; use exemplars to link to traces.

### Logs
- Fluent Bit DaemonSet ships logs from nodes/Pods (stdout) to Loki.
- Spring Boot logs JSON (logstash-logback-encoder) with traceId/spanId for correlation.
- Loki labels by namespace/app; query with LogQL.
- Retention 7-30 days; archive to S3/GCS.

### Traces
- OpenTelemetry SDK in app (otel-javaagent or manual), OTLP exporter to collector.
- Collector deployed as DaemonSet/Deployment, batch + tail sampling.
- Tempo/Jaeger store traces; Grafana explore correlates trace ↔ log ↔ metric.

### Managed vs self-hosted
- Self-hosted: control, low infra cost but heavy operations (storage, retention, upgrade).
- Managed: Datadog, New Relic, CloudWatch, Grafana Cloud: fast, integrated but priced by host/log volume/MTU.
- Hybrid: self-hosted metrics/logs + managed tracing for small teams.

### OTel collector example
~~~yaml
receivers:
  otlp:
    protocols: { grpc: { endpoint: 0.0.0.0:4317 } }
processors:
  batch: { timeout: 5s }
exporters:
  otlp/tempo: { endpoint: tempo:4317 }
service:
  pipelines:
    traces: { receivers: [otlp], processors: [batch], exporters: [otlp/tempo] }
~~~

### In production
- Keep cardinality low (do not label user id) to avoid Prometheus OOM.
- Retention: metrics 15d, logs 7-30d, traces 7d; archive cold storage.
- Alert based on SLO (burn rate), not noisy alerts; runbook with alert.
- Trace sampling (tail-based) to keep cost.

> Senior tip: Start with metrics + structured logs + traceId in logs; add distributed tracing when there is a real need to debug cross-service issues; measure cost per service.`,
    follow: [
      'How to avoid cardinality explosion in Prometheus?',
      'How do you deploy OpenTelemetry collector on K8s?',
      'When to choose managed observability?'
    ],
  },
  'devops-136': {
    q: 'How does PostgreSQL High Availability with Patroni + etcd + HAProxy work?',
    a: `**Summary:** Patroni runs on each Postgres node, uses etcd (DCS) to elect a leader; HAProxy health-checks Patroni's REST API to route traffic to the current primary; Java app uses JDBC multi-host with targetServerType=primary and retry.

### Why DCS is needed
- PostgreSQL streaming replication only has primary/standby, no automatic leader election. When primary dies, someone needs to promote a standby and notify the app.
- DCS (Distributed Configuration Store, e.g. etcd) is a "common whiteboard": whichever node holds the /leader lock is primary. etcd uses Raft, needs an odd number of nodes (3 or 5) for quorum.

### Leader election
- Each node runs a Patroni agent. Agent tries to acquire the /leader lock in etcd with TTL (lease). Node holding the lock = primary; other nodes are standby.
- Primary renews lease periodically. If primary dies, lease expires, first standby to acquire the lock promotes itself (pg_ctl promote).
- Fencing: Patroni uses pg_ctl promote and (if configured) STONITH to avoid split-brain. App must reconnect.

### HAProxy health check
- HAProxy backend points to Patroni REST API (port 8008): {{GET /primary}} returns 200 only on primary, {{GET /replica}} returns 200 on standby.
- HAProxy routes write traffic to the node returning 200 for /primary; read traffic can round-robin replicas.

~~~yaml
# patroni.yml (shortened)
scope: pgcluster
name: node1
restapi:
  listen: 0.0.0.0:8008
  connect_address: node1:8008
etcd:
  hosts: etcd1:2379,etcd2:2379,etcd3:2379
bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576
postgresql:
  listen: 0.0.0.0:5432
  data_dir: /var/lib/postgresql/data
~~~

### Java app connection
- JDBC multi-host URL: {{jdbc:postgresql://host1:5432,host2:5432,host3:5432/db?targetServerType=primary&loadBalanceHosts=true}}
- HikariCP: set connectionTimeout, validationTimeout; on failover old connections die, Hikari creates new connections to other hosts.
- Retry at application layer for transient errors (PSQLException with SQLState 08xxx).

### In production
- Mistake: etcd on the same node as Postgres → lose node = lose both DB and DCS → no failover.
- Check: {{patronictl -c /etc/patroni.yml list}}; {{etcdctl endpoint health}}; HAProxy stats page; test failover with {{patronictl pause}} / kill primary.

### Real-world example
A bank ran PostgreSQL on 3 nodes with Patroni + etcd 3 nodes + HAProxy. Drill: shut down the primary node at 2 PM. The old primary Patroni lost the leader key in etcd (TTL 30 seconds), a replica won the leader key and promoted itself; HAProxy checked Patroni's {{/primary}} (REST port 8008) every 3 seconds and routed write traffic to the new node. Total measured write interruption time was about 35 seconds. The Spring Boot app connects via HAProxy with Hikari {{connectionTimeout}} 5 seconds and retry, so only about 0.4% of requests errored during that window. Lesson from the previous drill: {{maximum_lag_on_failover}} set too large caused a lagging replica to be elected primary — reduce it to avoid significant data loss on failover; enable an additional synchronous replica ({{synchronous_mode}}) for transaction data.

### Interview answer
"Patroni is an agent running alongside each PostgreSQL node, using a DCS like etcd to elect a leader: the node holding the leader key with TTL in etcd is primary and must renew continuously; losing the key means stepping down, avoiding two primaries. When primary dies, the key expires, the healthiest replica not exceeding the lag threshold wins the key and promotes. etcd needs three or five nodes for quorum. HAProxy sits in front, checks Patroni's REST API at the primary endpoint to route write traffic only to the node that is primary, and can have a separate port for reads from replicas. Java apps connect via HAProxy, with short connection timeouts and bounded retries. I choose sync or async based on data loss tolerance, and always drill failover to measure real interruption time."

> Senior tip: Automatic failover is only safe when DCS has quorum and fencing; always drill failover regularly, measure actual RTO (usually 30-60s) and RPO (data loss due to async replication).`,
    follow: [
      'How many nodes does etcd quorum need?',
      'What does targetServerType=primary do?',
      'How to avoid split-brain when the network partitions?'
    ],
  },
});
