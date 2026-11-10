/*
 * English translation of js/data/lessons-devops.js — task T1033. Format: js/core/i18n.js (content overlay).
 * ids: lesson-devops-014 lesson-devops-015 lesson-devops-016 lesson-devops-017
 */
App.i18n.content({
  'lesson-devops-014': {
    title: "Evaluating Prometheus-style alert rules: {{for}}, {{pending}}→{{firing}}, alert grouping",
    goals: [
      "Explain why the condition must stay true continuously through the {{for}} duration before firing, to avoid noise from short spikes",
      "Describe the state chain {{inactive}} → {{pending}} → {{firing}} → {{resolved}}",
      "Write AlertEvaluator that takes a series of (time, value) samples with a fake clock and returns the list of state-change events",
    ],
    body: `### What a Prometheus-style alert rule is

Prometheus Alertmanager evaluates an alert **rule** over a time series of metric samples. A rule has a condition (for example CPU > 80%) and a **{{for}}** duration (for example 5 minutes): it only moves to firing when the condition stays true continuously throughout the entire {{for}} duration. The purpose is to avoid false alarms from short spikes.

**Summary:** A Prometheus rule fires only when the condition stays true continuously through {{for}}; states {{inactive}}→{{pending}}→{{firing}}→{{resolved}}; grouping alerts to avoid spam.

### States

- **{{inactive}}**: the condition is false.
- **{{pending}}**: the condition is true but the {{for}} duration has not elapsed yet.
- **{{firing}}**: the condition has been true long enough, the alert is being sent.
- **{{resolved}}**: it was firing before, and the condition is now false.

### {{for}}

When the condition stays true, pending starts. If it lasts long enough for {{for}} → {{firing}}. If the condition becomes false before {{for}} elapses → back to {{inactive}}, no alert. When {{firing}} and the condition becomes false → {{resolved}}.

### Grouping alerts

Multiple alerts with the same labels are merged into one notification to avoid spam. Each group has its own route.

### Real-world example

A service's CPU spikes for 2 minutes due to GC, with a threshold of 80% and {{for}} 5m → {{pending}} then {{inactive}}, no page. If CPU stays high for 10 minutes → {{firing}}, and on-call receives 1 grouped alert.

### Sample interview answer

"A Prometheus rule fires only when the condition stays true continuously through {{for}}; states {{inactive}}→{{pending}}→{{firing}}→{{resolved}}; group alerts with the same labels to avoid spam."

> Senior tip: Always set {{for}} long enough (3-5m) for CPU and memory metrics to avoid alert storms caused by short spikes.`,
    exercises: [
      {
        title: "AlertEvaluator: list of state-change events",
        prompt: `Complete {{AlertEvaluator.evaluate(samples, threshold, forSeconds)}} to return the list of state-change events. samples is a long[] array of timestamps (in seconds) and double[] of values; threshold is the threshold; forSeconds is the {{for}} duration. Return a List<String> of events: "PENDING at t", "FIRING at t", "RESOLVED at t".`,
        hints: ['Track pendingStart; when {{times[i] - pendingStart >= forSeconds}}, move to {{firing}}.'],
        explain: `Track the {{pending}}/{{firing}} state; when a breach lasts long enough → {{firing}}; when recovery happens → {{resolved}}.`,
      },
    ],
    check: [
      {
        q: "What does {{for}}=5m mean?",
        options: [
          "Alert after 5 minutes",
          "The condition must stay true continuously for 5 minutes before firing",
          "Repeat every 5 minutes",
          "Turn off after 5 minutes",
        ],
        answer: 1,
        explain: "{{for}} is the time the condition must stay continuously true before firing.",
      },
      {
        q: "What happens with a 2-minute spike and {{for}}=5m?",
        options: [
          "{{firing}}",
          "{{pending}} then {{inactive}}, no alert",
          "{{resolved}}",
          "Error",
        ],
        answer: 1,
        explain: "Not long enough for {{for}}, so no firing; back to {{inactive}}.",
      },
    ],
  },
  'lesson-devops-015': {
    title: "Health check and HAProxy/Keepalived-style failover: {{fall}}/{{rise}}, round-robin, VIP",
    goals: [
      "Explain {{fall}} (N consecutive failures → down) and {{rise}} (M consecutive successes → up)",
      "Simulate round-robin skipping down backends",
      "Understand VIP failover to the backup node by priority with Keepalived",
    ],
    body: `### What a health check is

A load balancer (HAProxy, nginx) periodically runs health checks against backends. After **{{fall}}** consecutive failures → the backend is marked DOWN and receives no traffic. After **{{rise}}** consecutive successes → it is UP again.

**Summary:** Backend goes down after N consecutive failures ({{fall}}) and back up after M consecutive successes ({{rise}}); round-robin skips down backends; VIP failover by priority with Keepalived.

### {{fall}} and {{rise}}

- **{{fall}}**: the number of consecutive failed checks to mark DOWN.
- **{{rise}}**: the number of consecutive successful checks to mark UP.

Example {{fall}}=3, {{rise}}=2: 3 consecutive failures → DOWN; 2 consecutive successes → UP.

### Round-robin skipping down backends

The load balancer distributes requests round-robin but only picks UP backends.

### VIP failover (Keepalived)

Keepalived uses VRRP: the master node with higher priority holds the VIP. When the master goes down, the backup with the highest priority takes over the VIP. Failback happens when the master comes back up (depending on preempt).

### Real-world example

3 backends, 1 goes down after 3 consecutive failures → the load balancer sends traffic only to the 2 remaining backends; when the backend recovers, 2 successes → UP again.

### Sample interview answer

"Health check with {{fall}}/{{rise}}: the backend goes down after N consecutive failures, back up after M consecutive successes; round-robin skips down backends; Keepalived VIP failover by priority."

> Senior tip: Set {{fall}}=3, {{rise}}=2 and a health check interval of 2s to detect failures quickly without false positives.`,
    exercises: [
      {
        title: "LoadBalancer: {{fall}}/{{rise}}, round-robin, failover",
        prompt: `Complete {{LoadBalancer}} with these methods: the constructor takes the number of backends; {{healthCheck(int idx, boolean ok)}} updates state with {{fall}}=3, {{rise}}=2; {{next()}} returns the index of the next UP backend round-robin (or -1 if none left); {{isUp(int idx)}}.`,
        hints: ['Track {{failCount}}/{{succCount}}; change state when {{fall}}/{{rise}} is reached.'],
        explain: `{{fall}}=3 marks DOWN, {{rise}}=2 marks UP; {{next()}} round-robins skipping down backends.`,
      },
    ],
    check: [
      {
        q: "What does {{fall}}=3 mean?",
        options: [
          "3 seconds",
          "3 consecutive failures → down",
          "3 backends",
          "3 requests",
        ],
        answer: 1,
        explain: "{{fall}} is the number of consecutive failed checks to mark down.",
      },
      {
        q: "When all backends are down, what does {{next()}} return?",
        options: [
          "0",
          "-1",
          "throw an error",
          "null",
        ],
        answer: 1,
        explain: "No backend left up → returns -1.",
      },
    ],
  },
  'lesson-devops-016': {
    title: "Mini RBAC authorizer: Role, ClusterRole, Binding and deny-by-default",
    goals: [
      "Explain the difference between Role (namespace-scoped) and ClusterRole (cluster-wide), plus RoleBinding/ClusterRoleBinding",
      "Describe the authorizer mechanism: deny by default, allow only, no deny concept",
      "Simulate kubectl auth can-i with Authorizer.can(subject, verb, resource, namespace)",
    ],
    body: `### What RBAC is

**RBAC** (Role-Based Access Control) is Kubernetes' authorization mechanism. A user or service is assigned a **role** containing **rules**: rules allow verbs (get, list, create, update, delete, watch) on resources (pods, deployments, secrets) within an apiGroup. By default **every request is denied**; only what a rule allows is executed. Kubernetes RBAC has **no concept of deny**: there is only allow. If no rule matches, the request is rejected.

### Role vs ClusterRole

- **Role**: applies only within a specific namespace. Used for workloads and developers in their own namespace.
- **ClusterRole**: applies cluster-wide. Used for cluster-scoped resources (nodes, persistentvolumes) or for namespace-scoped resources across all namespaces.

### Binding

- **RoleBinding**: assigns a Role or ClusterRole to a subject (user, group, ServiceAccount) within a namespace. If a ClusterRole is assigned via RoleBinding, the permission only takes effect within that namespace — a common pattern for reusing a ClusterRole while limiting its scope.
- **ClusterRoleBinding**: assigns a ClusterRole to a subject cluster-wide. Used for admins or cluster-wide controllers.

### Authorizer.can

Simulates kubectl auth can-i: checks whether a subject has a rule allowing a verb on a resource in a namespace. Wildcard * matches any value. A null namespace in a rule means the rule applies to every namespace (cluster-scoped). If null is passed as the namespace → only rules with a null namespace are checked.

**Summary:** RBAC denies by default, allows only via rules; Role is namespace-scoped, ClusterRole is cluster-wide; Binding assigns to a subject; a ClusterRole assigned via RoleBinding only takes effect within that namespace; wildcard * matches everything.

### Real-world example

CI's ServiceAccount may only deploy in the staging namespace. Create a Role deployer in staging with verbs create, update, delete, get, list on deployments. RoleBinding assigns it to ServiceAccount ci-sa in namespace staging. ClusterRole view assigned via RoleBinding in staging → ci-sa can list pods in staging but not in production. Check: kubectl auth can-i --as=system:serviceaccount:staging:ci-sa create deployments -n staging → yes; in namespace prod → no.

### Sample interview answer

The interviewer asks "How do you limit a ServiceAccount to deploy in just one namespace?" Answer: create a Role (not a ClusterRole) with rules deployments create/update/delete in that namespace, and a RoleBinding assigning it to the ServiceAccount. Do not use ClusterRoleBinding. Verify with kubectl auth can-i. Audit regularly with kubectl auth can-i --list. Avoid wildcard * in production. Use Role + RoleBinding instead of ClusterRole + ClusterRoleBinding for namespace-scoped workloads.

### Production traps

- Using ClusterRoleBinding for workloads → overly broad permissions, violates least privilege.
- Wildcard * in verbs/resources → anyone holding that role can do anything.
- Not auditing RBAC → permissions accumulate over time (privilege creep).
- The ServiceAccount token is automatically mounted into pods → an attacker can use it if a pod is compromised. Use automountServiceAccountToken: false when it is not needed.

> Senior tip: Always use Role + RoleBinding instead of ClusterRole + ClusterRoleBinding for namespace-scoped workloads; audit regularly with kubectl auth can-i --list; avoid wildcard * in production; set automountServiceAccountToken false when the pod does not need to call the API server.`,
    exercises: [
      {
        title: "Authorizer: checking small RBAC permissions",
        prompt: `Complete Authorizer simulating kubectl auth can-i:

- Constructor takes a list of rules: each rule has subject, verb, resource, namespace (null means cluster-wide).
- {{can(subject, verb, resource, namespace)}}: true if a rule matches. Wildcard * matches any verb/resource. A null namespace in a rule means the rule applies to every namespace. If null is passed as namespace → check cluster-scoped only (rules with null namespace only).
- Default deny: no rule → false.`,
        hints: [
          'Iterate rules, checking subject, verb (*), resource (*), namespace (* or null cluster-scoped).',
          'A null namespace in a rule means cluster-wide: it matches only when the passed namespace is null.',
        ],
        explain: `Authorizer simulates the kube-apiserver authorizer's decision tree: deny-by-default, allow only when a rule matches. Wildcard * matches any value. ClusterRoleBinding (null namespace) applies to every namespace; RoleBinding (specific namespace) only within that namespace.`,
      },
    ],
    check: [
      {
        q: "What is RBAC's default?",
        options: [
          "Allow all",
          "Deny all",
          "Deny only sensitive resources",
          "Allow if authenticated",
        ],
        answer: 1,
        explain: "RBAC denies every request by default; only what rules allow is executed. There is no deny rule.",
      },
      {
        q: "Where does a ClusterRole assigned via RoleBinding take effect?",
        options: [
          "Cluster-wide",
          "Only the binding's namespace",
          "Only cluster-scoped resources",
          "Every namespace except system",
        ],
        answer: 1,
        explain: "RoleBinding limits the scope to the binding's namespace, even when the role is a ClusterRole.",
      },
    ],
  },
  'lesson-devops-017': {
    title: "PVC binding and StorageClass: bind, provision, reclaim",
    goals: [
      "Explain how PVC finds a matching PV by capacity, access mode, storageClassName",
      "Describe dynamic provisioning and WaitForFirstConsumer",
      "Distinguish reclaim policy Retain vs Delete",
    ],
    body: `### PV and PVC

A **PersistentVolume (PV)** is a storage resource created by an admin or a dynamic provisioner. A **PersistentVolumeClaim (PVC)** is a pod's request: requesting capacity, access mode, and storage class. The controller binds the PVC to a matching PV.

### Binding logic

The PVC looks for a PV with:

- Capacity >= request
- Access mode matches (ReadWriteOnce, ReadOnlyMany, ReadWriteMany)
- storageClassName matches (or default)

Choose the smallest sufficient PV (to save resources).

### Dynamic provisioning

If no PV is available and the StorageClass has a provisioner, the controller automatically creates a new PV (dynamic). The PVC stays Pending until the PV is created and bound.

### WaitForFirstConsumer

StorageClass with volumeBindingMode: WaitForFirstConsumer → the PV is only created/provisioned after the pod is scheduled (to pick a suitable zone/node). The PVC stays Pending until the pod is scheduled.

### Reclaim policy

- **{{Delete}}**: deletes the PV (and the underlying storage) when the PVC is deleted.
- **{{Retain}}**: keeps the PV; the admin must delete it manually; the data remains.

**Summary:** PVC binds a matching PV (capacity >=, access mode, storageClass); dynamic provisioning creates a PV when none exists; WaitForFirstConsumer waits until the pod is scheduled; reclaim {{Delete}} deletes, {{Retain}} keeps.

### Real-world example

A PVC of 10Gi RWO with storageClass gp3. No PV available → the dynamic provisioner creates a 10Gi EBS volume. The pod mounts it at /data. Delete the PVC → the volume is deleted ({{Delete}}). If you need to keep the data → use {{Retain}} and back up manually.

### Sample interview answer

The interviewer asks "A PVC is stuck Pending, how do you debug?" Answer: check events (kubectl describe pvc), whether the storageClass exists, whether the provisioner is running, WaitForFirstConsumer requires the pod to be scheduled, zone mismatch. If there is no provisioner and no PV available → Pending forever.

### Production traps (extra)

When a PVC is Pending, check in order: kubectl describe pvc to see events, kubectl get sc to confirm the storage class exists, check the provisioner pod in kube-system, check WaitForFirstConsumer and pod scheduling, check zone/region matching. If there is no provisioner and no PV available, the PVC stays Pending forever. Always monitor Pending PVCs with alerts. For production, use {{Retain}} for important data and back up before deleting.

### Production traps

- Not setting storageClassName → the PVC uses the default storage class, which may not match the zone.
- WaitForFirstConsumer with a pod that is not scheduled → the PVC stays Pending forever; this is not a storage error.
- Reclaim {{Delete}} → deleting the PVC loses data permanently; always back up first.
- {{RWX}} on cloud block storage (EBS) is not supported → the PVC stays Pending.

> Senior tip: Always set storageClassName explicitly; use WaitForFirstConsumer for multi-zone; back up before deleting a PVC with {{Retain}}; monitor Pending PVCs; check provisioner logs.`,
    exercises: [
      {
        title: "VolumeController: bind/provision/release",
        prompt: `Complete VolumeController simulating:

- {{bind(pvc, pvs)}}: return a matching PV (capacity >=, accessMode matches, storageClass matches), the smallest sufficient one; null if none.
- {{provision(pvc)}}: create a new PV with exactly the PVC's required capacity, accessMode and storageClass (dynamic).
- {{release(pvc, policy)}}: if policy "Delete" → return null (deleted); "Retain" → return the kept PV (for the admin to handle).`,
        hints: [
          'Bind: filter by accessMode, storageClass, capacity >=; choose the smallest capacity.',
          'Provision: create a new map with the PVC capacity/accessMode/storageClass.',
          'Release: "Delete" → null; "Retain" → return the PV (may provision again).',
        ],
        explain: `VolumeController simulates the bind/provision/release controller. {{bind}} picks the smallest sufficient PV to save resources. Dynamic provisioning creates a PV when none exists. Reclaim policy {{Delete}} deletes storage; {{Retain}} keeps it for the admin to handle.`,
      },
    ],
    check: [
      {
        q: "A PVC is stuck Pending, which of the following is a cause?",
        options: [
          "No PV and no provisioner",
          "StorageClass does not exist",
          "WaitForFirstConsumer is waiting for the pod to be scheduled",
          "All of the above",
        ],
        answer: 3,
        explain: "All can cause Pending: missing PV/provisioner, StorageClass does not exist, or WaitForFirstConsumer waiting for the pod to be scheduled.",
      },
      {
        q: "What does reclaim policy {{Delete}} do when the PVC is deleted?",
        options: [
          "Keep PV and data",
          "Delete PV and underlying storage",
          "Only delete the PVC, PV remains",
          "Automatic backup",
        ],
        answer: 1,
        explain: "{{Delete}} deletes the PV and underlying storage. {{Retain}} keeps the PV and data for the admin to handle manually.",
      },
    ],
  },
});
