/*
 * English translation of js/data/q-devops.js — task T736. Format: js/core/i18n.js (content overlay).
 * ids: devops-074 devops-075 devops-076 devops-077 devops-078
 */
App.i18n.content({
  'devops-074': {
    q: "(lead) Load-test an app before go-live from a DevOps angle: environment, tooling, metrics, and finding the bottleneck at the infrastructure layer (LB, DB connection, node).",
    a: `**Summary:** Load testing before go-live: an environment that mirrors production (smaller scale but the same topology), tooling such as k6/JMeter/Gatling, metrics like latency p95/p99, error rate, throughput and resource usage; find the bottleneck at LB connections, the DB pool, node CPU/mem, and GC.

### Environment
- A staging environment that mirrors production: same instance type, proportionally sized DB, same network shape.
- Realistic test data (seed the DB).
- Warm up the JVM/GC before measuring.

### Tooling
- k6, JMeter, Gatling, wrk; distribute the load from multiple regions.
- Chaos: inject latency into a dependency.

### Metrics
- Throughput (RPS), latency p50/p95/p99, error rate.
- Resource: CPU/mem per node, DB connections/queries, GC pause, thread pool.
- Saturation: queue depth, connection pool usage.

### Finding the infrastructure bottleneck
- LB: connection limit, TLS handshake cost, target health.
- DB: connection pool exhausted, slow query, lock contention.
- Node: CPU throttling, memory pressure, disk I/O, network bandwidth.
- App: thread pool, GC, connection leak.

### Pitfalls
- Testing from a single machine → a fake network bottleneck.
- No warm-up → cold start distorts the numbers.
- Measuring only average latency → hides p99.

> Senior tip: Define the SLO first (p99 < X ms, error < 0.1%) and stop the test once you hit it; save a baseline to compare after deploy; run a soak test (many hours) to surface a memory leak.`,
    follow: [
      "What is the difference between a load test, a stress test, a soak test, and a spike test?",
      "How do you load test safely on production (canary load)?",
      "When p99 is high but CPU is low, in what order do you investigate?"
    ],
  },
  'devops-075': {
    q: "In a bank moving to the cloud (AWS), \"DevOps\" is often split into several roles: SA (Solution Architect), DevOps/Platform, Infra/System, SRE, Cloud Security. What does each role do, what do interviews usually ask, and which role should a Java dev with 4 years of experience aim for if they want to switch direction?",
    a: `**Summary:** In a bank, "doing DevOps" is not a single role: the **SA (Solution Architect)** designs the overall picture, **DevOps/Platform** builds the CI/CD pipeline and the platform that runs applications (K8s, registry), **Infra/System** operates servers/network/operating systems, **SRE (Site Reliability Engineering)** keeps the system running stably through SLOs/observability/incidents, and **Cloud Security** controls security in the cloud (IAM, network, compliance). A Java dev who wants to switch direction most naturally moves toward **DevOps/Platform** or **SRE**, because they can leverage their knowledge of the application, of building, and of how systems break.

### Quick understanding
Picture a bank as a large trading building. The **SA** is the architect who draws the blueprint of the whole building (which room connects to which, how customer flow moves). **Infra/System** is the team that builds and maintains the foundation, electricity, water, and elevators (servers, network, OS). **DevOps/Platform** is the team that installs the "pipes" so every room receives things on time (CI/CD, the K8s platform, the registry). **SRE** is the on-call team that makes sure the building does not collapse at peak hours, with cameras and fire alarms (monitoring, SLO, incident response). **Cloud Security** is the security team controlling access cards, cameras, and safes (IAM, network, encryption, compliance). Each role looks at the same system but at a different "layer".

### Terms (first-time explanation)
- **SA - Solution Architect**: the person who designs how the components (app, DB, queue, cloud service) fit together to solve a business problem, balancing cost/reliability/security/compliance.
- **Platform**: the shared set of tools and infrastructure that development teams "stand on" to build and run apps (for example: a Kubernetes cluster, a registry to store images, a template CI/CD pipeline) — instead of every team building everything themselves.
- **SRE - Site Reliability Engineering**: a role originating at Google that applies a software-engineering approach to operations: set reliability targets (SLO), measure, automate, and handle incidents systematically.
- **SLO - Service Level Objective**: a committed number, for example "99.9% of requests succeed each month" or "p99 latency < 300ms". The SLO helps decide whether you may deploy a new feature or must prioritize stability.
- **IAM - Identity and Access Management**: the system that controls "who may do what" in the cloud (user, role, policy).
- **Compliance**: meeting mandatory regulations (in a Vietnamese bank this usually relates to State-Bank (NHNN) requirements, audits, and data storage/security rules).

### Comparing the roles
| Role | Day-to-day work | Common tools/knowledge | What interviews usually ask | Main lens |
|---|---|---|---|---|
| SA (Solution Architect) | Design the architecture for a problem (e.g. online card issuance), choose AWS services, draw the integration flow, review designs | AWS (VPC, EKS, RDS, SQS...), architecture diagrams, trade-offs, security, cost, DR | "Design a money-transfer system / for X million users", "Choose RDS or self-hosted DB?", "How do you do multi-AZ/DR?" | The big picture, trade-offs |
| DevOps / Platform | Build and run CI/CD, the K8s cluster, standard Helm charts, the registry, project templates; help app teams onboard | GitLab CI/GitHub Actions, Docker, Kubernetes, Helm, Argo CD, Terraform (at a usage level), Harbor | "Design a CI/CD pipeline", "How do you handle a Pod in CrashLoopBackOff?", "How do you use Helm/Terraform?" | The pipeline, the platform |
| Infra / System | Manage VMs, network, DNS, load balancers, the Linux OS, storage, backup/restore | Linux, networking (TCP/IP, routing, firewall), VMware/on-prem, some cloud (EC2, VPC) | "Debug a network/DNS incident", "Linux: process, disk, permission", "How do you back up/restore?" | Infrastructure, the OS |
| SRE | Define SLO/SLI, dashboards/alerts, on-call, handle incidents, postmortems, automate operations, capacity | Prometheus/Grafana, logging, tracing, runbook, toil automation, sometimes K8s | "Design alerts around an SLO", "Handle a production incident", "Latency spikes suddenly — how do you investigate?" | Reliability, measurement |
| Cloud Security | Design IAM least privilege, network segmentation, encryption, vulnerability scanning, security monitoring, meet compliance | IAM, KMS, Security Groups/NACL/WAF, GuardDuty/CloudTrail, compliance policies | "Design secure IAM", "How do you isolate a workload", "Handle secrets/credentials", "Audit and compliance" | Risk, compliance |

### Which role should a Java dev with 4 years aim for?
- **DevOps/Platform (the most natural fit)**: you are already used to building (Maven/Gradle), dependencies, how a Spring Boot app runs, logs, configuration, healthchecks. The next step is to learn packaging (Docker), deploying (K8s), and automation (pipeline). You can explain "why the app needs graceful shutdown/probes" because you understand the app.
- **SRE (a good fit if you like investigating incidents)**: leverage your knowledge of the JVM, threads, DB connections, and latency to find the root cause when the system is slow/broken. You need to add a measurement mindset (SLO, metrics) and incident process.
- **SA**: usually needs broader experience (many systems, integrations, security, cost) and experience communicating with the business; it can be a destination after a few years on Platform/SRE.
- **Infra/System or Cloud Security**: reachable, but the knowledge gap is larger (deep networking, systems Linux, or security/compliance). A good fit if you genuinely like that area.

~~~text
Perspective (from closer-to-app to closer-to-infrastructure/security):

  [Java Dev] --knows the app--> [DevOps/Platform] --reliability--> [SRE]
       \\                         |                              |
        \\                        v                              v
         '------------------> [SA] (big picture)          [On-call/Incident]
                                  |
                 [Infra/System] --+-- [Cloud Security]
                    (machines/network/OS)   (access/compliance)
~~~

### Real-life example (a bank)
A team ships a fast money-transfer feature: the **SA** decides to use EKS + RDS Multi-AZ, split services, and route calls through an API Gateway. **Platform** provides the standard Helm chart, the build-scan-deploy pipeline, namespaces, and quotas. **Infra** makes sure the network connection to the on-prem core banking is stable. **SRE** sets the SLO p99 < 500ms, builds dashboards/alerts, writes the runbook, and runs the canary. **Cloud Security** reviews the Pod's IAM role (IRSA), the S3/KMS policies, and the compliance checklist before go-live. A latency incident usually needs Platform + SRE + (sometimes) Infra to look together.

### Pitfalls (common mistakes)
- **Confusing the role names**: "DevOps" in a bank JD is sometimes actually manual Infra operations, or conversely pure Platform. To avoid it: ask whether the JD is clearly CI/CD/K8s work or VM/network management, whether there is on-call, and the ratio of "build" vs "operate".
- **Learning tools in isolation without the foundation**: knowing how to type kubectl commands but not understanding Pod/network/DNS → you get stuck on the debugging questions. To avoid it: learn layer by layer (Linux + networking → containers → K8s → CI/CD → observability).
- **Switching roles as a dev but neglecting your strength**: not leveraging your understanding of the app (thread pool, GC, DB pool) — this is your edge in Platform/SRE interviews.

### How to answer in an interview
"I understand that in a bank DevOps is usually split by role: the SA designs the overall architecture and trade-offs, Platform/DevOps builds CI/CD and the K8s platform, Infra handles servers/network/Linux, SRE handles SLOs, monitoring, and incident response, and Cloud Security handles IAM, network isolation, and compliance. With a background of 4 years as a Java dev, I aim for a Platform or SRE role because I understand how an application builds/runs/breaks (probes, graceful shutdown, connection pool, JVM), and I am currently adding Linux, containers/K8s, pipeline, and observability so I can cover the infrastructure around the application."

> Senior tip: When interviewing for any "DevOps" role in a bank, ask three things: (1) will you **build the platform** or **operate an existing system**, (2) is there **on-call** and an incident process, (3) where is the boundary with Security/Infra. The answers reveal the real role and stop you from accidentally taking a purely operational job when your goal is Platform/SRE.`,
    follow: [
      "What is the difference between SRE and traditional DevOps? (hint: SLO, error budget, toil)",
      "What does a Platform Engineer need to understand about a Java application to support dev teams well (probes, resources, JVM)?",
      "When an SA designs a system on AWS for a bank, which compliance/security constraints usually influence the architecture decision?"
    ],
  },
  'devops-076': {
    q: "Real case: you deploy a new version to K8s, but a Pod goes into CrashLoopBackOff on only 1 of 3 nodes (2 nodes run fine, 1 node keeps restarting the Pod). How do you investigate step by step (describe, events, logs --previous), and what clue is \"where do the nodes differ\"?",
    a: `**Summary:** CrashLoopBackOff on only 1 of 3 nodes almost always has a cause **tied to that node**, not only to the shared image/configuration. The process: (1) identify which Pod is on which node ({{kubectl get pod -o wide}}), (2) use {{describe}} to read Events/Last State/Exit Code, (3) use {{logs --previous}} to get the stack trace of the previous death, (4) compare the faulty node to the healthy ones (labels/taints, disk/inode capacity, runtime version, kernel, time, DNS, mount/hostPath, network to dependencies). Common differences: node **DiskPressure/PIDPressure**, a stale/differently-architected image cache (rare), different hostPath/permissions, a skewed clock, or a node that cannot reach the DB/internal registry.

### The real context
A bank deploys {{payment-api:1.24.0}} (rolling update) onto a 3-worker-node cluster. 2 nodes: Pod is {{1/1 Running}}. Node {{worker-3}}: the Pod enters {{CrashLoopBackOff}}, {{RESTARTS}} keeps climbing. Because the Deployment spreads Pods, only the replica that lands on {{worker-3}} fails → the symptom "1 of 3 nodes". Impact: capacity drops by 1/3, and if the rollout continues it can get worse.

### Terms (first-time explanation)
- **CrashLoopBackOff**: the container starts and then exits (dies); kubelet restarts it but **waits with increasing back-off** (back-off: 10s, 20s, 40s… up to 5 minutes) between attempts. "Loop" = repeating; "back-off" = waiting longer each time.
- **Node**: a machine (VM or physical) in the Kubernetes cluster where Pods actually run. Each node has its own kubelet, container runtime, disk, network, and system clock.
- **kubelet**: the "caretaker" on each node that receives instructions from the control plane to run/monitor containers.
- **Taint**: a marker on a node used to "drive away" Pods that don't fit; a **toleration** is the "permit" a Pod carries so it may be scheduled onto a tainted node.
- **hostPath**: mounting a directory of the node itself into a container — convenient but it makes the Pod depend on the node's state (each node has different contents/permissions).
- **DiskPressure / inode**: the node is about to run out of disk space (DiskPressure) or out of file entries (inode) — both make creating/writing a container's files fail.

### Step-by-step investigation

~~~text
S1. Which node is the Pod on?
    kubectl get pod -n pay -l app=payment-api -o wide
    -> see pod-A (worker-1, Running), pod-B (worker-2, Running), pod-C (worker-3, CrashLoopBackOff)

S2. Read the faulty Pod's "medical record"
    kubectl describe pod pod-C -n pay
    -> look at: Node, Events (at the bottom), Last State/Reason/Exit Code, Conditions, Volume mounts

S3. Read the log of the PREVIOUS death (very important)
    kubectl logs pod-C -n pay --previous --tail=200
    -> the stack trace/error of the container that just exited (the current log is often near-empty because the container just restarted)

S4. Compare the faulty node vs the healthy nodes
    kubectl describe node worker-3 | grep -A5 Conditions
    kubectl get node --show-labels
    -> DiskPressure? MemoryPressure? taint? kernel/runtime version? zone?

S5. Narrow it down: is it an APP fault or a NODE fault?
    - Cordon worker-3, delete pod-C -> the scheduler creates a new Pod on worker-1/2: if it runs OK => the fault is tied to node-3
    - Scale up, force 1 test Pod onto worker-3 (nodeSelector) to reproduce it
~~~

### Commands and evidence to look at
~~~bash
# S1: which pod, which node, how many restarts
kubectl get pod -n pay -o wide

# S2: events + last-death state
kubectl describe pod pod-C -n pay
# read: Last State: Terminated, Reason/Exit Code; Events: Back-off restarting...

# S3: log of the run that just died (without --previous you'll see an empty log)
kubectl logs pod-C -n pay --previous --tail=200

# S4: node status
kubectl describe node worker-3   # Conditions, Allocatable, Taints, Images
kubectl get events -n pay --sort-by=.lastTimestamp | tail -30
~~~

**Reading the exit code (a quick clue):** {{1}} = the app exited itself (exception, missing config). {{137}} = 128+9 (SIGKILL), usually OOMKilled — check the Reason. {{139}} = 128+11 (SIGSEGV) — a native crash (JNI library, a rare bug). {{0}} but still restarting = the process exited cleanly but the liveness/probe or entrypoint is wrong.

### "Where do the nodes differ" — common causes
| Difference on the faulty node | Symptom / evidence | How to verify |
|---|---|---|
| **DiskPressure / inode exhausted** | The Pod crashes when writing log/temp; an Event shows evicted or a file-create failure; {{kubectl describe node}} shows {{DiskPressure=True}} | {{describe node}} (Conditions), on the node: {{df -h}}, {{df -i}} |
| **Different/missing image on the node** | If you use the {{latest}} tag or {{imagePullPolicy: IfNotPresent}}, node-3 may hold a stale/broken cached image; or pull fails intermittently (but usually this yields ImagePullBackOff, not CrashLoopBackOff) | The Images section of {{describe node}}; compare image digests |
| **Different hostPath / file permissions** | The app reads/writes a {{hostPath}} (config, cert, socket) that node-3 is missing or has wrong permissions | {{describe pod}} to see Volumes; check the path on the node (via ops/SSM) |
| **Networking from node-3 to a dependency** | The app connects to DB/Redis/Kafka/on-prem core on startup; only node-3's subnet/route/firewall is blocked → timeout → the app fails fast and exits | {{logs --previous}} shows a connection timeout; test {{nc/telnet}} from node-3; compare security group/subnet |
| **Clock skew** | TLS/JWT/OAuth calls fail because the cert/token is "not yet valid/expired" by node-3's clock; the app exits during init | Auth/time errors in the log; {{chronyc tracking}} or {{timedatectl}} on the node |
| **Local resource/node pressure** | Node MemoryPressure or a different cgroup; rare if requests/limits are sane, but a different custom runtime/kernel can have an effect | {{describe node}} Conditions, {{kubectl top node}} |
| **Taint/label leading to different config** | Rare: if the Pod has a special toleration, or a DaemonSet/sidecar runs only on node-3 causing a conflict | {{kubectl get node --show-labels}}, {{describe node}} taints |

~~~seq
title: Investigating CrashLoopBackOff on only 1 of 3 nodes
actors: DevOps | K8s API | Node-3 (faulty)
DevOps -> K8s API: kubectl get pod -o wide
K8s API --> DevOps: pod-C on Node-3, CrashLoopBackOff
DevOps -> K8s API: kubectl describe pod pod-C
K8s API --> DevOps: Exit Code, Events, Last State
DevOps -> Node-3 (faulty): kubectl logs --previous pod-C
Node-3 (faulty) --> DevOps: stack trace of the death
DevOps -> K8s API: kubectl describe node Node-3
K8s API --> DevOps: Conditions, Taints, Allocatable
DevOps -> DevOps: compare Node-3 vs Node-1/2, narrow down
~~~

### Pitfalls (common mistakes)
- **Only looking at the shared image/config**: "if 2 nodes run fine it can't be a config bug". Wrong — the config may be correct, but node-3 is missing the hostPath file, out of disk, or unable to reach the DB.
- **Forgetting {{--previous}}**: you see a near-empty log and conclude "there's no error". The error is in the container that already died.
- **Deleting the Pod hoping it "fixes itself"**: the scheduler may place the new Pod right back on node-3 → the fault repeats. {{cordon}} node-3 first before swapping the Pod, to isolate it.
- **Confusing it with Pending**: if the Pod is {{Pending}} only on node-3, that is a scheduling problem (taint/toleration/resource); {{CrashLoopBackOff}} means the container already ran and then died.

### Interview answer (step by step, concise when speaking)
"Because only 1 of 3 nodes fails, I suspect a node-tied cause. I use {{get pod -o wide}} to identify which node the Pod is on, {{describe pod}} to read Events, Last State and Exit Code, then {{logs --previous}} to get the stack trace of the previous death. After that I compare the faulty node to the healthy ones: {{describe node}} for DiskPressure/taint/allocatable, check differences in network to the DB/Redis, hostPath/permissions, clock, image digest. To confirm, I cordon the faulty node and let the Pod run again on another node: if the error clears it is scoped to infrastructure/node; if it persists I go back to analyzing app/config. I don't delete Pods blindly because the scheduler may place them right back on the broken node."

> Senior tip: In a bank, "single-node" faults often appear after a silent infrastructure change: a newly joined node lacks a route to the internal DB, the internal CA cert isn't installed yet, or the clock hasn't synced via NTP. Keep a node baseline (same AMI/image, same cloud-init config) and use {{kubectl describe node}} + checking the {{Ready/DiskPressure}} conditions in the runbook; cordon a suspected node immediately to stop the blast radius from spreading before you dig deeper.`,
    follow: [
      "How do you isolate quickly: tell apart a fault from image/config (every node) vs a fault from the node (only 1 node)?",
      "If {{logs --previous}} is empty and the Exit Code is 137, what do you conclude and where do you check next?",
      "Why does using an immutable image tag (digest/commit SHA) help avoid the \"node holds a stale image\" incident?"
    ],
  },
  'devops-077': {
    q: "Real case: a bank uses blue-green deploy but the two environments (blue/green) share one database. How do you handle backward-compatible schema migration (expand/contract), how do you shift traffic, and how do you roll back when there is an error?",
    a: `**Summary:** Blue-green (two parallel environments, switching traffic once) only makes "rolling back the app" easy when the **DB schema is backward compatible** — because the DB is shared, the old and new versions must both run against the same schema during the switch. The solution is **expand/contract**: (1) *expand* by adding new columns/tables in a safe way, keep the old columns, have new code write both/read flexibly; (2) deploy green and shift traffic; (3) once stable, only then *contract* by dropping the old columns/structures. Rolling back the app means shifting traffic back to blue — which is only safe if the expand step has not broken compatibility. Destructive migrations (rename/drop a column, incompatible type change) must be separated out to run later.

### The real context
The bank runs {{order-service}}: **blue** = version 1.8 (serving live), **green** = version 1.9 (new). Both point at **one shared Oracle/RDS cluster** (splitting the DB is very expensive and hard to keep transactionally consistent in banking). Version 1.9 needs to rename {{phone}} (a column) to {{mobile_phone}} and add a new check. If you migrate by "renaming the column" and then deploy: in the moment when blue still reads {{phone}} → error. If you deploy green before the new column exists → error. This is the blue-green + shared-DB conflict.

### Terms (first-time explanation)
- **Blue-green deploy**: maintain two identical environments (blue = currently live, green = the new version). Deploy green, test it, then **shift 100% of traffic** to green. Rollback = shift traffic back to blue. (Like having two stages: the audience sits on one side, and once you're ready you move the audience to the other side.)
- **Shared database**: both blue and green read/write the same DB. Pro: consistent data, no need to synchronize. Con: the schema becomes the "compatibility bottleneck" between the two app versions.
- **Backward compatible (schema)**: the new schema still lets **the old version's code** run correctly (the old code can read/write). **Forward compatible**: the old code writes data the new code understands.
- **Expand/contract**: a multi-step migration technique: *expand* adds something new without breaking the old; run them in parallel; *contract* removes the old once nobody uses it.
- **Cutover**: the moment you change the router/load balancer/DNS so traffic flows to the new environment.

### The expand/contract mechanism (example: changing {{phone}} → {{mobile_phone}})
~~~text
Shared DB state:  [ BLUE v1.8 ] <--read/write--> ( DB ) <--read/write--> [ GREEN v1.9 ]

STEP 1 - EXPAND (a safe migration, run BEFORE deploying green)
  DB:  ADD column mobile_phone (nullable), KEEP column phone
       (do not drop, do not rename, do not NOT NULL yet)
  App v1.9 (code): write BOTH phone and mobile_phone; read mobile_phone first, fall back to phone
  -> v1.8 (blue) still runs normally because the phone column is untouched.

STEP 2 - DEPLOY GREEN + SHIFT TRAFFIC
  Deploy v1.9 to green, internal smoke test (not yet taking real traffic).
  Shift traffic: blue -> green (via LB/DNS/Ingress weight/service selector).
  Watch metrics (error rate, latency, business). Keep blue running hot for rollback.

STEP 3 - STABILIZE + BACKFILL (optional)
  Run a background job to copy data phone -> mobile_phone for old records (backfill), in batches, throttled.

STEP 4 - CONTRACT (only when you are SURE you will not roll back to v1.8)
  Remove the code that reads/writes phone (deploy v1.10 or clean up), then migration: set NOT NULL/default if needed,
  and finally DROP the phone column. This step is NOT backward compatible with v1.8.
~~~

~~~seq
title: Blue-green with a shared DB (expand/contract)
actors: User | LB | Blue v1.8 | Green v1.9 | DB (shared)
User -> LB: request
LB -> Blue v1.8: traffic 100% (initial)
Blue v1.8 -> DB (shared): read/write phone column
note Blue v1.8..Green v1.9: EXPAND: add mobile_phone, keep phone
LB -> Green v1.9: internal smoke test
LB -> Green v1.9: shift 100% traffic
Green v1.9 -> DB (shared): write both phone + mobile_phone
Green v1.9 --> User: OK
note LB..Blue v1.8: error? rollback = shift traffic back to Blue
~~~

### Rules for safe (backward-compatible) migration
| Change | Safe with blue-green + shared DB? | How to do it |
|---|---|---|
| Add a nullable column / with a default | Yes (expand) | Add it before deploy; new code uses it, old code ignores it |
| Add a new table/index | Yes | Add it beforehand; mind the lock when creating an index on a big table ({{ONLINE}} if the DB supports it) |
| Rename / drop a column | **No** (breaks v1.8) | Expand (add a new column, dual-write) → contract only after v1.8 is fully retired |
| Change to an incompatible data type | **No** | Add a new column of the new type, backfill, move code over, then drop the old column |
| Add NOT NULL with no default | **No**, not right away | Add nullable → backfill → only then set NOT NULL |

### Shifting traffic and rollback
- **Shift traffic**: change the target at the Load Balancer / Ingress / Service selector / DNS (prefer a fast, controllable switch mechanism; DNS depends on TTL so it is slower). Verify green with a smoke test + healthcheck before it takes real traffic.
- **Go/no-go criteria**: error rate, p99 latency, business errors, a checksum on sample transactions — observe over a window (e.g. 15-30 minutes) before "committing".
- **Rolling back the app**: shift traffic back to blue. **Only safe if** the schema is in a backward-compatible state (already expanded, not yet contracted). So: absolutely never run the contract step within the same deploy window; contract is a separate change, made after days/weeks of stability.
- **Rolling back the DB**: an expand migration (add a nullable column) usually needs no rollback; if you truly must undo it, use a controlled reverse migration — but for data already written to the new column, you need a merge plan.

### Pitfalls (common mistakes)
- **Running the destructive migration before shifting traffic**: blue dies the instant it is still serving requests, or green fails halfway → an outage. To avoid it: separate expand (before) from contract (after, separately).
- **Thinking "blue-green rollback is easy" but forgetting the shared DB**: you can roll back the app, but the data green already wrote follows the new schema — if the contract ran, or the old code can't understand the new data, the rollback fails. To avoid it: contract only after the rollback window has passed.
- **Creating an index on a big table causes a lock**: a "small" migration that blocks writes, clogging both blue and green. To avoid it: use the online/concurrent index option if the DB supports it, run it off peak hours, and measure on real data.
- **Backfilling everything at once**: locks the table / high IO. To avoid it: backfill in batches, rate-limited, idempotently (re-running does no harm).

### Interview answer
"With blue-green sharing a DB, I split the migration along expand/contract: the expand step adds new backward-compatible structures (for example add a nullable column, keep the old one), the new version's code dual-writes/reads flexibly, so the old version still runs. I deploy green, smoke-test it, then shift traffic through the load balancer and watch error/latency/business; I keep blue hot so I can roll back by shifting traffic back. Only once it is stable and there is no further need to roll back do I run the contract step to remove the old structures — because contract breaks backward compatibility. The key point: blue-green app rollback is only safe when the schema has not been contracted."

> Senior tip: In a bank, tie each expand/contract step to a versioned change with its own approval window, and **forbid the contract step within the same deploy**. The two things most often forgotten: (1) the backfill job must be idempotent and rate-limited so it doesn't clog the shared DB, (2) the "rollback window has ended" criteria (e.g. after 3-5 days with no incident) must be agreed in writing before anyone runs a DROP COLUMN.`,
    follow: [
      "If you must change an incompatible column type on a table with hundreds of millions of rows, how do you plan it step by step with no downtime?",
      "Compare blue-green and canary when the DB is shared: which one reduces schema risk better?",
      "How do you ensure the new version's \"dual-write\" code does not create conflicting data between the old column and the new one?"
    ],
  },
  'devops-078': {
    q: "Real case: after migrating an application from on-prem (an in-house data center) to AWS, users report that latency has tripled. List the common causes (calls back to on-prem over VPN, DNS, NAT Gateway, cross-AZ, connection pool) and the process to find the root cause?",
    a: `**Summary:** A 3x latency rise after a migration usually comes from **the request's path getting longer or new network hops being added**, not from "AWS being slow". Common causes: the app on AWS still calls across to services/DBs left on-prem over **VPN/Direct Connect** (adds tens of ms per hop), **DNS** resolving slowly or pointing back to on-prem, routing through a **NAT Gateway** unnecessarily, **cross-AZ** (traffic crossing between zones) adding up, and the **connection pool** being mis-sized for the new latency (small pool + high latency = waiting for a connection). How to find it: break latency down per hop (tracing/metrics), compare the before/after-migration path, and test each hypothesis with data.

### The real context
{{loan-service}} (Spring Boot) moved from on-prem VMs to EKS (AWS). Before migration: p95 = 120ms. After migration: p95 = 360ms (3x). Functionality unchanged, code unchanged — so the problem almost certainly lies in the **infrastructure/network/connection configuration** introduced by the new location.

### Terms (first-time explanation)
- **On-prem / on-premise**: systems running on servers in the company's own data center (not the cloud).
- **Latency**: the time from sending a request to receiving the response. {{p95}} = 95% of requests are faster than this value (ignoring the 5% abnormally slow ones) — use p95/p99 rather than the average, because the average hides the slow requests.
- **VPN (Virtual Private Network) / Site-to-Site VPN**: an encrypted tunnel linking the on-prem network to a VPC on AWS over the public Internet — convenient but it adds latency and has limited bandwidth. **Direct Connect (DX)** is a private line, more stable.
- **AZ - Availability Zone**: a separate (or group of) data center(s) within an AWS Region. Cross-AZ = traffic going between two different AZs (there is a fee and a small extra latency per direction, usually < 1-2ms, but it adds up if the workload is "chatty").
- **NAT Gateway**: a service that lets resources in a private subnet reach out to the Internet/AWS APIs — but it is one extra hop; making calls between services inside the VPC loop through NAT is a design mistake.
- **DNS (Domain Name System)**: resolves a name (for example {{db.internal}}) to an IP address. Slow resolution, a bad cache, or a name pointing back to an on-prem IP instead of the AWS endpoint all add latency.
- **Connection pool**: a set of DB/HTTP connections kept ready for reuse (creating a new connection is very expensive in time, especially with TLS). Too small a pool + every request waiting a long time for a connection = latency rises.

### Common causes
| Cause | Why latency rises | Sign / how to check |
|---|---|---|
| **Calling back to on-prem over VPN** | App/DB/dependency is still on-prem; each request over the VPN adds 20-80ms+ (depending on distance), and if it's called N times (chatty) it multiplies | Distributed tracing shows the span calling {{corebank/db}} taking most of the time; the destination IP is an on-prem range; {{ping/traceroute/mtr}} from the Pod to the on-prem endpoint |
| **Slow or mispointed DNS** | The resolver isn't configured optimally; internal names still resolve to on-prem IPs (taking a detour); TTL/cache causes repeated resolution | Resolution-time metric (if available), {{dig/nslookup}} from the Pod; compare the returned IP to the intended AWS endpoint; check CoreDNS logs/metrics |
| **Routing through the NAT Gateway** | Calling internal services (S3, DB, another service) via NAT instead of a VPC Endpoint/private path → extra hop + possible NAT bandwidth saturation | VPC Flow Logs / topology; check the subnet route table; calling S3/DynamoDB without a VPC Endpoint |
| **Cross-AZ** | The app in AZ-a calls the DB/service in AZ-b; one request makes many calls → adds up | Tracing/metrics by destination; check the AZ of the Pod (node label) and of the RDS/endpoint; enable topology-aware routing if suitable |
| **Connection pool sized wrong for the new latency** | Before, on-prem ↔ DB was 1ms and a pool of 5 was enough; now over a VPN it's 30ms, so a pool of 5 causes a queue waiting for a connection → latency spikes even though the DB is fast | Pool metrics (active/idle/pending, the wait time to get a connection - HikariCP {{hikaricp.connections.acquire}}); a thread dump shows threads waiting on the pool |
| **TLS handshake / a fresh connection every time** | Not reusing connections (HTTP keep-alive off, pool off) → every request pays the handshake (more expensive when RTT is large) | A high count of new connections, a handshake metric; check the HTTP client/keep-alive config |
| **MTU/fragmentation or saturated VPN bandwidth** | Packets get fragmented, or the VPN link is congested at peak hours | {{mtr}} shows loss/an MTU issue; VPN/DX bandwidth metrics, CloudWatch |

### The process to find the cause (step by step)
~~~text
1. CONFIRM & SCOPE
   - Where does the latency rise appear? (all APIs, or only APIs calling dependency X?)
   - Compare p50/p95/p99 before/after migration, over the same time window/load.

2. BREAK LATENCY DOWN PER HOP (the most important step)
   - Use distributed tracing (e.g. OpenTelemetry/X-Ray/Jaeger): see which span takes the time.
   - If you don't have tracing yet: log the time of each step (calling the DB, calling an external service), client metrics.

3. LOCALIZE THE NETWORK PATH
   - Which destination does the slow span point to? Is that destination on AWS or on-prem?
   - From the Pod: dig the name, check the IP; traceroute/mtr to the destination; compare routes/VPC Flow Logs.

4. TEST THE SPECIFIC HYPOTHESES
   - Cross-AZ: compare source/destination AZ. NAT: check the route table, try a VPC Endpoint.
   - Connection pool: look at pending/acquire-time metrics (HikariCP), try raising the pool/tuning the timeout with re-measuring.

5. CONFIRM & FIX
   - Change one factor, re-measure (before/after); avoid changing many things at once.
~~~

~~~seq
title: The request path before and after migration (example)
actors: User | Loan (AWS) | NAT/VPN | CoreDB (on-prem)
User -> Loan (AWS): request
Loan (AWS) -> NAT/VPN: call CoreDB (name points to on-prem)
NAT/VPN -> CoreDB (on-prem): via VPN + extra hop
CoreDB (on-prem) --> NAT/VPN: response
NAT/VPN --> Loan (AWS): +20-80ms per round trip
Loan (AWS) --> User: p95 x3 (if called many times)
note Loan (AWS),CoreDB (on-prem): chatty + VPN = latency multiplies
~~~

### Pitfalls (common mistakes)
- **Concluding "the cloud is slow" without measuring the breakdown**: changing the instance type costs money but does not touch the real cause (which is actually calling back to on-prem). To avoid it: always break latency down per hop before "scaling".
- **Ignoring the connection pool**: after migration RTT rises, the old (small) pool causes a queue — CPU/DB both look low but latency is high. To avoid it: check the acquire/pending metrics of HikariCP.
- **{{ping}} only once**: ICMP ping may be blocked, or it doesn't reflect the real TCP/TLS behavior. To avoid it: measure with a {{curl}} connection time, or with real tracing.
- **Fixing DNS/NAT but forgetting the cache**: CoreDNS/app cache still holds the old IP. To avoid it: check the TTL, restart/flush in a controlled way, and re-measure.

### Interview answer
"When latency triples after a migration, I assume the cause is in the network path/connection config because the code didn't change. I use tracing or a breakdown log to find the slow span: the most common case is the app on AWS still calling across to a DB/service left on-prem over a VPN, so each hop adds tens of ms and it multiplies if the workload is chatty; besides that, DNS mispointing back to on-prem, routing through the NAT Gateway, cross-AZ adding up, or a connection pool too small for the new RTT causing connection waits (look at HikariCP acquire/pending). I check each hypothesis with data (dig, traceroute, route table/VPC Endpoint, source-destination AZ, pool metrics), change one factor, and re-measure p95/p99."

> Senior tip: Measure a **per-dependency latency baseline** *before* migrating (p95 per hop) so you can compare immediately after migration. In a bank, the transition phase is often "hybrid" (partly on-prem) — the architectural goal is to reduce the number of calls crossing the VPN: batch calls, add caching, or move the dependency in the same wave. Don't blindly raise the connection pool: too large a pool saturates the DB side; use the pending/acquire metrics to tune.`,
    follow: [
      "How should you size a connection pool (HikariCP) when the RTT to the DB rises after migration? (hint: pool size vs latency)",
      "When do you use a VPC Endpoint instead of a NAT Gateway, and how does it improve latency/security?",
      "How do you reduce the impact of the hybrid phase when part of a dependency must stay on-prem?"
    ],
  }
});
