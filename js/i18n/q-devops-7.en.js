/*
 * English translation of js/data/q-devops.js — task T667. Format: js/core/i18n.js (content overlay).
 * ids: devops-036 devops-037 devops-038 devops-039 devops-040 devops-041
 */
App.i18n.content({
  'devops-036': {
    q: 'At midnight a node runs short of RAM: the payment service Pod (Java, memory request 1Gi, limit 4Gi, actually using 3Gi) is Evicted even though it never touched its limit, while another team batch Pod that declared no resources at all stays alive. Explain QoS class, the order of node-pressure eviction versus the OOM killer, and PriorityClass; then how would you set requests/limits for a Java service so this never happens again?',
    a: `**Summary:** Kubernetes has **two mechanisms that kill Pods over RAM**. (1) A container exceeds **its own memory limit** → the kernel OOM-kills it inside its cgroup (OOMKilled, exit 137). (2) The **node** runs short of total RAM → the kubelet **evicts** Pods in this order: Pods **using more than their request** first, then by **Priority**, then by **how far over request**. The payment Pod asked for 1Gi but uses 3Gi — 2Gi over, by far more than the batch Pod — so it stands at the top of the list. For Java, memory cannot be compressed or throttled: I set **memory request = limit**, size the heap as a percentage of the limit, set the CPU request from real usage, assign a high **PriorityClass** to critical services, and declare ephemeral-storage.

### QoS class
| Class | Condition | oom_score_adj | Meaning |
|---|---|---|---|
| Guaranteed | Every container sets request = limit for **both** CPU and memory | -997 | The kernel OOM killer picks it last |
| Burstable | Has at least one request/limit but does not qualify for Guaranteed | 2…999 (the larger the memory request relative to node RAM, the lower the score) | The most common class |
| BestEffort | No request/limit declared at all | 1000 | The kernel OOM killer picks it first |

### Two mechanisms, two symptoms
~~~text
Container uses > memory limit              Node: memory.available < 100Mi (default hard threshold)
  -> OOM killer inside the cgroup             -> kubelet picks Pods to evict
  -> container RESTARTS, OOMKilled, exit 137  -> Pod Failed, reason Evicted; the ReplicaSet creates a new Pod
  -> look at: kubectl describe pod (Last State) -> look at: kubectl get events ("The node was low on resource: memory")
~~~
If RAM drains too fast — before the kubelet can evict anything — the kernel OOM killer at the **whole-node** level steps in and picks victims by {{oom_score_adj}} — and then the QoS class decides directly who dies.

### Eviction order when a node is short on memory
1. Pods whose usage **exceeds their request** are considered first.
2. Within that group, Pods with **lower Priority** are evicted first.
3. At equal priority, the Pod **furthest over its request** is evicted first.

| Pod | Request | Real usage | Over request |
|---|---|---|---|
| payment | 1Gi | 3Gi | **+2Gi → evicted first** |
| batch (BestEffort) | 0 | 0.5Gi | +0.5Gi |
| report | 2Gi | 1.5Gi | not over request → almost safe |
That is why BestEffort does **not always** die first: a Burstable Pod that "asks for little, uses a lot" is even more dangerous. A Pod using less than its request is almost never evicted for memory.

One more important detail: for **hard** eviction thresholds the kubelet kills the Pod **immediately**, with no graceful shutdown — an in-flight Java request is cut off mid-handling.

### PriorityClass
~~~yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata: { name: business-critical }
value: 100000
preemptionPolicy: PreemptLowerPriority
description: "payment, auth: scheduled first, evicted last"
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata: { name: batch-low }
value: 1000
preemptionPolicy: Never      # wait for free space, never kick another Pod out
~~~
- Priority takes effect in **two places**: (a) scheduler **preemption** — a high-priority Pending Pod evicts a lower-priority one to take its place (PodDisruptionBudget is only respected on a best-effort basis); (b) the eviction order above.
- Never assign {{system-cluster-critical}}/{{system-node-critical}} to applications. Use a ResourceQuota per PriorityClass so teams cannot mark everything "critical" themselves.

### Setting resources for a Java service
~~~yaml
priorityClassName: business-critical
containers:
  - name: app
    resources:
      requests: { cpu: "1", memory: 3Gi, ephemeral-storage: 1Gi }
      limits:   { memory: 3Gi, ephemeral-storage: 2Gi }   # memory request = limit, no CPU limit
    env:
      - name: JAVA_TOOL_OPTIONS
        value: "-XX:MaxRAMPercentage=70 -XX:ActiveProcessorCount=2 -XX:+ExitOnOutOfMemoryError"
~~~
- **Memory request = limit**: the Pod never uses more than its request, so it never stands at the front of the memory-eviction queue. If the app balloons past the limit it gets OOMKilled — its own bug, plainly visible, and it does not drag other Pods down with it. Java uses heap + metaspace + thread stacks + code cache + direct buffers, so the heap should be only about 65–75% of the limit.
- **CPU** is compressible (it gets throttled, never killed). Set the request to the everyday p90–p95 usage. Dropping the CPU limit avoids throttling when JIT, GC and startup spike CPU; but then the JVM sees the whole node CPU, so you must set {{ActiveProcessorCount}}. If you need tight isolation, set CPU limit = request so the Pod becomes Guaranteed.
- **ephemeral-storage**: file-based logging and heap dumps land on the container filesystem. A single 3Gi heap dump file exceeds the ephemeral-storage limit and gets the Pod evicted; when the node disk fills up, the kubelet evicts in bulk.

### Production pitfalls
- **Low request, high limit** ("overcommit to save money"): the scheduler packs far too many Pods onto a node because it only looks at requests → node pressure becomes a nightly event.
- **Evicted Pods stay behind** in Failed state and are only garbage-collected past {{terminated-pod-gc-threshold}} (default 12500) — the Pod list gets messy and is easy to misread during an investigation.
- **Every service assigned high priority**: priority loses all meaning and preemption starts kicking Pods around at random.

> Senior tip: every week I look at the **usage/request memory** ratio per Pod (running VPA in {{updateMode: "Off"}} purely to collect recommendations). A Pod regularly above 100% is the next eviction candidate — fix its request before the node runs out of RAM at 2 a.m. and fixes it for you.`,
    follow: [
      'Why do many teams drop the CPU limit for Java services, and what is the noisy-neighbor risk of doing so?',
      'How does PriorityClass preemption interact with PodDisruptionBudget and the cluster autoscaler?',
      'What problems arise when using VPA and HPA together on the same Deployment?'
    ],
  },
  'devops-037': {
    q: 'You are the platform tech lead for a payment service running on Kubernetes, and a PCI DSS audit is coming: only the necessary network flows may be allowed, and the DB password and the payment-gateway API key must not live in Git or leak through kubectl. How do you design a default-deny NetworkPolicy covering both ingress and egress, and how do you choose between External Secrets Operator, Vault and Sealed Secrets?',
    a: `**Summary:** Networking: in the {{payments}} namespace set a **default-deny for both ingress and egress**, then open each flow one by one via labels: ingress controller → payment-api:8080, payment-api → DNS, → PostgreSQL:5432, → Kafka, → the payment gateway. The standard NetworkPolicy **cannot filter by domain name**, so egress to the internet must go through an **egress proxy/gateway** or a CNI with FQDN policies (Cilium). Secrets: put the source of truth in a **secret manager** (AWS Secrets Manager or Vault) and bring it into the cluster with the **External Secrets Operator** (synced into a Secret) or **Vault Agent/CSI** (bypasses etcd, supports dynamic credentials). **Sealed Secrets** fit small GitOps setups but are weak on rotation and audit. Plus: encrypt etcd with a KMS, lock down RBAC read access to secrets, mount secrets as files.

### How NetworkPolicy works
- By default a Pod is **not isolated**: it receives and sends all traffic. As soon as at least one policy selects the Pod with policyType Ingress (or Egress), that direction allows only the **union** of the listed rules. The core API has no "deny" rule: there is only "isolate, then open selectively".
- A policy only has effect when the **CNI enforces** it (Calico, Cilium, AWS VPC CNI with network policy enabled…). On a CNI that does not support it, {{kubectl apply}} still succeeds but blocks nothing — you must verify with a real connectivity test.

~~~yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: default-deny-all, namespace: payments }
spec:
  podSelector: {}                   # every Pod in the namespace
  policyTypes: [Ingress, Egress]    # no rules at all = block both directions
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: payment-api, namespace: payments }
spec:
  podSelector: { matchLabels: { app: payment-api } }
  policyTypes: [Ingress, Egress]
  ingress:
    - from:
        - namespaceSelector: { matchLabels: { kubernetes.io/metadata.name: ingress-nginx } }
          podSelector: { matchLabels: { app.kubernetes.io/name: ingress-nginx } }   # one element = AND
      ports: [{ protocol: TCP, port: 8080 }]
  egress:
    - to:                           # DNS: forget to open it and every lookup times out mysteriously
        - namespaceSelector: { matchLabels: { kubernetes.io/metadata.name: kube-system } }
          podSelector: { matchLabels: { k8s-app: kube-dns } }
      ports: [{ protocol: UDP, port: 53 }, { protocol: TCP, port: 53 }]
    - to:
        - ipBlock: { cidr: 10.20.8.0/24 }       # the RDS subnet (the DB lives outside the cluster)
      ports: [{ protocol: TCP, port: 5432 }]
    - to:
        - podSelector: { matchLabels: { app: egress-proxy } }   # the only path to the internet
      ports: [{ protocol: TCP, port: 3128 }]
~~~

### The AND/OR trap in selectors
~~~text
from:
  - namespaceSelector: {...}    # ONE element carrying two keys:
    podSelector: {...}          #   a Pod labelled X INSIDE namespace Y  (AND)
from:
  - namespaceSelector: {...}    # TWO elements:
  - podSelector: {...}          #   EVERY Pod of namespace Y, OR a Pod labelled X in the same namespace (OR)
~~~
Adding a single dash turns the policy into one that opens many times more access — this mistake very often slips through review.

### Egress to the internet
The standard NetworkPolicy only understands IP/CIDR, but the payment gateway IPs change with the CDN. Three options: CiliumNetworkPolicy with {{toFQDNs}}; an egress proxy (Squid/Envoy) with a domain allowlist; or an egress gateway with a **fixed NAT IP** so partners can whitelist you back. For PCI, a proxy also gives you a log of every outbound connection as evidence.

### Secrets: why Kubernetes Secrets are not enough
- A Secret is only **base64** (an encoding, not cryptography) stored in etcd. You must enable **encryption at rest** for etcd (EncryptionConfiguration with the KMS v2 provider; on EKS that is envelope encryption via KMS).
- Anyone with {{get}}/{{list}}/{{watch}} on secrets in the namespace can read them; anyone who can **create a Pod** in the namespace can also read every Secret there indirectly (mount it into their own Pod). In production, only the GitOps controller may create workloads.
- Never commit Secret manifests to Git: base64 is effectively plain text.

| Criterion | External Secrets Operator | Vault (Agent Injector / CSI) | Sealed Secrets |
|---|---|---|---|
| Source of truth | Secrets Manager, Vault, GCP… | Vault | Git (the encrypted copy) |
| Secret stored in etcd | Yes (synced per {{refreshInterval}}) | Not required (file inside the Pod) | Yes |
| Rotation | Edit in the secret manager, ESO updates automatically | **Dynamic** credentials with a TTL, auto-revoked | Re-seal and commit |
| Audit of "who read the secret" | Secret manager logs (CloudTrail) | Detailed Vault audit log | Limited |
| Operations | Light | Heavy (HA, unseal, backup) | Light, but you must safeguard the controller private key |
| Fits | Most teams on cloud | Strict requirements, dynamic DB credentials | Small teams, pure GitOps |

~~~yaml
apiVersion: external-secrets.io/v1     # older ESO releases: v1beta1
kind: ExternalSecret
metadata: { name: payment-db, namespace: payments }
spec:
  refreshInterval: 1h
  secretStoreRef: { kind: ClusterSecretStore, name: aws-secrets-manager }
  target: { name: payment-db }          # the Secret that gets created
  data:
    - secretKey: password
      remoteRef: { key: prod/payment/db, property: password }
~~~

### Getting the secret into Spring Boot
- Mount the Secret as a **file** and use {{spring.config.import=configtree:/etc/secrets/}}: each file becomes one property. Avoid environment variables for sensitive secrets: env is easy to leak via {{/proc/PID/environ}}, startup logs and crash dumps, and it does **not update** when the secret changes.
- Zero-downtime DB password rotation: you need a period where **two credentials are valid at once** (Secrets Manager has a two-user rotation strategy), HikariCP {{maxLifetime}} gradually replaces old connections, and the app reads the new credential when creating a new connection — or do a rolling restart after the rotation.

### Production pitfalls
- Default-deny egress but forgetting DNS, Kafka/Schema Registry, or the kube-apiserver (the app does leader election through the API): an outage on the very first deploy.
- Testing policies in a staging cluster that uses a different CNI than production: staging "passes", production blocks nothing.
- Losing the Sealed Secrets controller private key means losing the ability to decrypt everything: back up the key and have a re-seal procedure for key rotation.
- Vault is a single point of failure: when Vault is down, new Pods cannot start. Run it in HA and keep an emergency runbook.

> Senior tip: for a PCI audit, **evidence matters more than configuration**. I generate the network flow matrix (source, destination, port, reason) directly from the policies, run automated connectivity tests in the pipeline — a probe Pod tries the forbidden flows and the test **must fail** — on every policy change, then export flow logs (Cilium Hubble or VPC Flow Logs) and secret-access logs for the auditors. The audit then reduces to reading reports.`,
    follow: [
      'How do you rotate the DB password of a service running 20 Pods with zero downtime?',
      'Does a service mesh with mTLS (Istio, Linkerd) complement NetworkPolicy or replace it?',
      'How do you test automatically that a NetworkPolicy really blocks in production?'
    ],
  },
  'devops-038': {
    q: 'Your team on-call receives about 40 alerts per week (CPU > 80%, heap > 85%, some request errors…), most of which resolve on their own, while real incidents are reported by customers first. As tech lead, how would you rebuild the alerting system around SLI, SLO, error budget and burn rate, and how would you run blameless postmortems?',
    a: `**Summary:** Alerts must be based on **symptoms users actually feel**, not on possible causes. Pick a few **SLIs** (share of successful requests, share of requests faster than a threshold), set an **SLO** (e.g. 99.9% over 30 days) → an **error budget** of 0.1%. Page the on-call only when the **burn rate** is high — the budget is being consumed fast enough to run out soon — and use **two windows** (1 hour with 5 minutes, 6 hours with 30 minutes) to detect quickly while keeping false pages low. CPU and heap become dashboards or tickets. After an incident, a **blameless postmortem** looks for the conditions in the system that allowed the failure, and ends with actions that have an owner and a deadline.

### The terms, through examples
- **SLI** = good events / valid events. For example: a payment API request that does not return 5xx; a request that completes under 300 ms.
- **SLO**: the target for an SLI over a window, e.g. 99.9% successful requests over a rolling 30 days.
- **Error budget** = 1 − SLO = 0.1%. With 10 million requests per month you may spend 10,000 failed requests — roughly equivalent to 43 minutes of total outage in 30 days.
- **SLA**: the contractual commitment to the customer (with penalties), always looser than the internal SLO.
- **Burn rate** = current error rate / (1 − SLO). An error rate of 1.44% against a 99.9% SLO gives a burn rate of 14.4: sustained, the 30-day budget (720 hours) is gone after 720 / 14.4 = **50 hours**.

### Why CPU, heap and per-error alerts are wrong
| Old alert | The problem |
|---|---|
| CPU > 80% | The end-of-day batch or JIT at startup pushes CPU high while users feel nothing → pointless pages; and a deadlock runs CPU low → no alert at all |
| Heap > 85% | With G1, the heap climbing high right before each GC cycle is normal |
| Any 5xx request | A few errors in a million requests still fit inside the budget |
| Error rate > 1% over 5 minutes | Sensitive to noise, and it misses a quiet 0.5% error rate smouldering for a whole week (burning 5× the allowed pace) |

### Multi-window, multi-burn-rate (from the SRE Workbook)
| Level | Burn rate | Long + short window | Budget consumed | Action |
|---|---|---|---|---|
| Page | 14.4 | 1 hour and 5 minutes | 2% in 1 hour | Call on-call immediately |
| Page | 6 | 6 hours and 30 minutes | 5% in 6 hours | Call on-call |
| Ticket | 1 | 3 days and 6 hours | 10% in 3 days | Handle during business hours |
- The **long window** guarantees the problem is big enough. The **short window** guarantees the problem is **still happening**, so the alert clears quickly once fixed instead of firing for another hour.

~~~yaml
groups:
  - name: payment-slo
    rules:
      - record: payment:error_ratio:rate5m
        expr: |
          sum(rate(http_server_requests_seconds_count{job="payment", status=~"5.."}[5m]))
          / sum(rate(http_server_requests_seconds_count{job="payment"}[5m]))
      - record: payment:error_ratio:rate1h
        expr: |
          sum(rate(http_server_requests_seconds_count{job="payment", status=~"5.."}[1h]))
          / sum(rate(http_server_requests_seconds_count{job="payment"}[1h]))
      - alert: PaymentErrorBudgetFastBurn
        expr: payment:error_ratio:rate1h > (14.4 * 0.001) and payment:error_ratio:rate5m > (14.4 * 0.001)
        labels: { severity: page }
        annotations:
          summary: "payment is burning its error budget 14.4 times faster than allowed"
~~~
For a latency SLI, Spring Boot pre-creates histogram buckets at the SLO threshold via {{management.metrics.distribution.slo.http.server.requests=300ms}}; the share of fast requests = the {{le="0.3"}} bucket divided by the total request count.

### Error budget policy
- A **written** agreement with product **before** any incident: budget remaining → ship features normally, experiments allowed; budget spent → freeze features (except bug fixes and security), pour effort into reliability; a single incident consuming more than 20% of the budget → postmortem mandatory.
- This turns the "ship features or fix stability" debate into reading a number instead of whoever argues loudest.

### Blameless postmortem
- The goal is to **understand the system**, not to find someone to punish. A punished person hides information next time — and honest information is the most valuable thing a postmortem has.
- Structure: summary and **impact** (failed requests, % of budget consumed, customers affected, money); a **timeline** with concrete times (start, detection, escalation, mitigation, resolution); **contributing factors** (usually several, not one single "root cause"); what went well and where you got lucky; **action items** with an owner, a deadline, and a category: prevention / detection / mitigation.
- Wording: write "the migration script ran against prod because there was no environment check" instead of "Nam ran the wrong command". Ask "why did the system allow that" instead of "why did you do that".
- Track action items until they close; measure MTTD (time to detect) and MTTR (time to resolve) quarter over quarter.

### Production pitfalls
- **SLO of 100% or 99.99% for everything**: no budget left, every tiny error becomes a crisis — while the DB underneath only delivers 99.95% itself.
- **Measuring the SLI only inside the app**: requests that never reach the app (broken ingress, Pod not ready) are not counted. Measure at the load balancer too, or with synthetic probes.
- **Low-traffic services**: 3 errors in 100 requests is 3% and the burn rate spikes; add a minimum-request-count condition or use synthetic traffic.
- **Counting 4xx as errors** means a buggy client also burns the budget; conversely, returning 200 with an error body means real failures never get counted.
- **Deleting all cause-based alerts**: still keep "about to break" warnings such as disk nearly full or a TLS certificate about to expire — as tickets, or as pages if the remaining time is very short.

> Senior tip: measure the alerting system itself: **pages per on-call shift** and **the share of pages that lead to real action**. My target is a few pages per week with nearly every page requiring some action; a page that requires no action means the alert gets fixed or deleted that same week. On-call trusting the alerts is the precondition for them reacting fast at 3 a.m.`,
    follow: [
      'How do you set the SLO for a service that depends on a DB and three other services, each with its own availability?',
      'The error budget is spent but business wants to release a critical feature: how do you handle it?',
      'How do you make postmortem action items actually get done instead of sitting in the backlog forever?'
    ],
  },
  'devops-039': {
    q: 'A Spring Boot service works perfectly with a single instance, but as soon as you scale to 3 Pods on Kubernetes users in the middle of a session get bounced back to the login screen, a just-uploaded report file disappears, and the start-of-day interest job runs exactly three times. Explain each phenomenon and how to fix it.',
    a: `**Summary:** Every request may land on a different Pod, and one Pod RAM is invisible to the others. An app that keeps state in its process (HTTP session, files on local disk, a job counter) breaks the moment a second replica appears. The fix is to make the app **stateless**: move sessions to Redis (Spring Session), files to object storage (S3), guard jobs with a distributed lock (ShedLock), and give local caches an explicit TTL and invalidation strategy. Sticky sessions are just temporary tape.

### Why state gets lost — a picture from everyday life
A service counter has 3 identical clerks, and customers are served round-robin. If clerk A writes customer details into a notebook **kept in their own pocket**, the next time that customer returns they may meet clerk B, who knows nothing. A Java process works the same way: the HTTP session, the object cache, the counters — all live in its own RAM. On Kubernetes each Pod is a separate process (usually on a different node) and the Service spreads requests round-robin across Pods. Worse, Pods are ephemeral: a rollout, a restart, or a dead node wipes the whole RAM without a trace.

### Phenomenon 1: bounced back to the login screen — HTTP session
Tomcat creates the session in memory and returns a {{JSESSIONID}} cookie. The next request goes to a different Pod, which has no session with that id and creates a new one → the user loses their logged-in state.
Fix with **Spring Session**: add {{spring-session-data-redis}}; the session is serialized into Redis instead of Tomcat memory, and every Pod shares it.

~~~yaml
# build.gradle / pom: spring-boot-starter-data-redis + spring-session-data-redis
spring:
  session:
    timeout: 30m
  data:
    redis:
      host: redis-sessions.payments.svc   # should be an HA Redis (Sentinel/Cluster)
~~~

Another option: **JWT** — the server keeps no session and only signs tokens; but to revoke a token immediately on logout you need a denylist, and tokens must be short-lived with a refresh token. Note: Tomcat-cluster-style session replication is practically unusable on Kubernetes because Pod discovery is dynamic.

### Phenomenon 2: the uploaded file "disappears"
The multipart file is written to the Pod temporary disk (/tmp); the download request lands on another Pod → 404; the Pod restarts → the file is gone for good. An RWO (ReadWriteOnce) PVC can only bind to **one** Pod — it is not a shared disk for the whole Deployment.
Fix: stream the file straight to S3/GCS as it arrives and store only the key in the DB; for large files let the client upload via a **presigned URL** so bytes never pass through the app.

### Phenomenon 3: the job runs three times
{{@Scheduled}} runs in **every** replica — all 3 Pods wake at 1 a.m. and each computes the interest. This is a money bug, not an annoyance.

~~~java
@Scheduled(cron = "0 0 1 * * *")
@SchedulerLock(name = "dailyInterest", lockAtMostFor = "30m", lockAtLeastFor = "59m")
public void calculateInterest() {
    // only the Pod that wins the lock (Redis/DB) runs; the other two see the lock held and skip this round
}
~~~

{{lockAtLeastFor}} 59m guarantees that even a job finishing in under a minute does not run twice on the same day. Alternatively, move the batch out entirely into a Kubernetes CronJob that runs a single Pod.

### The remaining traps
| State | Symptom | Fix |
|---|---|---|
| Caffeine/ConcurrentHashMap cache | Pod A just wrote, Pod B serves stale values | Short TTL, or Redis + pub/sub invalidation |
| WebSocket | Messages received by only one Pod | sticky (temporary) or a Redis backplane / switch to SSE + Redis pub/sub |
| In-memory queue | Messages lost when a Pod dies | Move to Kafka/SQS |
| In-memory rate limiter | Real limit = 3× the stated one | Redis ({{INCR}} + expire) or bucket4j with a distributed cache |

### Are sticky sessions the answer?
ALB supports stickiness, but open-source NGINX (community) has no sticky directive (only NGINX Plus). Sticky pins old customers to the old Pod → load skews; new Pods from a rollout get hammered anyway because sessions live in the dying Pod; when a Pod dies the session is lost regardless. Acceptable as a stopgap, not as a design.

### Statelessness checklist for a new service
- No session/credential kept in memory across requests.
- No writes to the container disk (except a TTL cache that can be rebuilt from another source).
- Jobs/leader election via ShedLock or a separate CronJob.
- Anything that must "survive the Pod" lives in Redis/S3/DB/queue.

### Common mistakes
- A session object holding a custom class, then the package changes → Redis deserialization fails silently after an upgrade.
- Redis down: every user loses their session — you need HA Redis and must accept it as a new dependency of auth.
- Spring Session enabled, but legacy code still reads request.getAttribute from the old Tomcat session.

> Senior tip: the acceptance test I usually apply: run a k6 load with logins, and while it runs {{kubectl delete pod --force}} a replica mid-session — the user must notice nothing beyond one slow beat. This test catches 90% of statelessness bugs before production.`,
    follow: [
      'You use Spring Session with Redis and Redis dies: what do users experience and how do you design graceful degradation?',
      'JWT needs no session — so how do you kick out a logged-out user immediately when the token still has 15 minutes of validity?',
      'A Caffeine cache with a 5-minute TTL across 3 Pods: when is it acceptable, and when is it dangerous for account balances?'
    ],
  },
  'devops-040': {
    q: 'A Java service on EKS needs to read/write S3 and send messages to SQS. Right now the access key + secret key sit in a ConfigMap, are rotated manually each quarter, and the audit team just filed a finding. What mechanism replaces the static key, and where does the AWS SDK get credentials from?',
    a: `**Summary:** Drop static keys entirely and move to an **IAM role attached to the Pod**. On EKS there are two paths: **IRSA** (a ServiceAccount declares an IAM role, the Pod receives a short-lived OIDC token) or **EKS Pod Identity** (newer, uses an agent and removes the per-cluster OIDC setup). The AWS SDK does not read env variables blindly — it walks the **default credentials chain**: when it sees {{AWS_WEB_IDENTITY_TOKEN_FILE}} it calls {{AssumeRoleWithWebIdentity}}, gets credentials that live about 1 hour and auto-refresh — there is nothing left to rotate.

### What is wrong with a static key in a ConfigMap
- A ConfigMap is stored as **plain text** in etcd (a Secret is only base64 — also not encryption unless you enable encryption at rest); anyone with get permission in the namespace can read it.
- The key lives forever: staff leaving, a lost laptop, a public repo — the key still works.
- One key shared by many services → CloudTrail cannot tell **who** called {{s3:DeleteObject}}; the audit has no answer.
- Rotation is a project: change the ConfigMap, restart each service, and pray nothing cached the old value.
- There is a risk of committing it to Git, and Git history cannot be scrubbed.

### The AWS SDK v2 default credentials chain
{{S3Client.create()}} needs no explicit credentials; the SDK looks them up in order (approximately):
1. Environment variables {{AWS_ACCESS_KEY_ID}} / {{AWS_SECRET_ACCESS_KEY}}.
2. JVM system properties.
3. **Web identity token file** ({{AWS_WEB_IDENTITY_TOKEN_FILE}} + {{AWS_ROLE_ARN}}) — this is the door IRSA walks through.
4. {{~/.aws/credentials}} (profile).
5. Container credentials (a local endpoint) — the door for EKS Pod Identity.
6. Instance credentials via IMDS.

The lesson: the code needs one builder line; credentials are infrastructure business, do not embed that logic in the app.

### IMDS — the identity of the node, not of the Pod
IMDS is the link-local address {{169.254.169.254}}; a Pod on that node calling it receives the **node role** (node roles are usually broad: pull from ECR, write logs…). Every service would then share one permission set — isolation is gone. Mitigations: enable IMDSv2 and set hop limit = 1 so Pods cannot reach IMDS, forcing each service to use its own identity.

### How IRSA works
~~~text
The EKS cluster has an OIDC provider (created once, per cluster)
Role "payment-s3-sqs" has:
  - Trust policy: allows AssumeRoleWithWebIdentity WITH the condition
      system:serviceaccount:payments:payment-sa  (exact namespace + SA)
  - Permission policy: s3:GetObject/PutObject scoped by prefix arn:aws:s3:::bank/payments/*,
                       sqs:SendMessage to the exact queue arn
SA payment-sa annotated arn:aws:iam::11111122221111:role/payment-s3-sqs
=> the EKS webhook projects the token into the Pod + 2 env vars:
     AWS_ROLE_ARN, AWS_WEB_IDENTITY_TOKEN_FILE=/var/run/secrets/.../token
=> the SDK calls STS to exchange the token for ~1h credentials, auto-refreshing before expiry
~~~

The strength: credentials are **short-lived, per service, auto-rotated**; the STS session is tightly bound to (namespace, ServiceAccount), so a Pod with a different SA cannot impersonate it.

### EKS Pod Identity
Amazon added the EKS Pod Identity Agent (a DaemonSet) on the node; you create a **role association** through the EKS API instead of annotation + OIDC; the SDK receives credentials via a local endpoint. Advantages: no per-cluster OIDC setup, one role usable across many clusters, no token to worry about. If your cluster is newly built or you run many clusters, I pick Pod Identity; IRSA remains perfectly correct and is more widespread.

### Least privilege — "just enough" permissions
Each service gets its own role, with a policy scoped to concrete resources (bucket prefix, queue ARN, the KMS key it needs to decrypt). Forbid {{s3:*}} and {{iam:*}}. A pleasant side effect: when the audit asks "who deleted this file", CloudTrail answers with exactly the right service role.

### What about running locally in dev
Use AWS SSO ({{aws sso login}}) with a dev role, or a temporary profile that expires in 1 hour; test offline with LocalStack mocking S3/SQS. There is **no** exception for "the prod key, just to make dev convenient".

### Common mistakes
- 403 AccessDenied even though the role has the policy: check for a trust condition with the wrong namespace/SA name, or an SA that was never annotated.
- Forgetting the region so STS/SDK calls hang or throw UnknownHostException — always set {{AWS_REGION}} (or the cluster-defaults env).
- A very old SDK v1: some versions do not auto-refresh the web identity token → the batch job dies exactly one hour after midnight; upgrade to SDK v2.
- Manually caching {{BasicSessionCredentials}} into a static variable — do not compete with the SDK.

### How to answer in an interview
The chain of ideas: what is wrong with static keys → the credentials chain → the IRSA/Pod Identity mechanism → per-service least privilege → local dev via SSO. Close with the audit benefit: one identity per service, every call traceable.

> Senior tip: adopt a **zero static credential** policy and put a secret scanner (gitleaks/trufflehog) in the pipeline so keys cannot sneak back in through Git; after migrating everything to IRSA, delete the old IAM keys one by one (disable first, watch CloudTrail for a few days, then delete) to catch any hidden remaining users.`,
    follow: [
      'A Pod starts failing with 403 after the ServiceAccount was renamed: which objects do you debug, in what order?',
      'Why does the IMDSv2 hop limit of 1 stop a Pod from reading the node credentials?',
      'A service must issue a presigned URL valid for 7 days — does the 1-hour IRSA token allow that?'
    ],
  },
  'devops-041': {
    q: 'The platform team wants to drop the style where Jenkins runs kubectl apply from outside the cluster and move to GitOps with Argo CD. As the developer who owns a service, what changes in day-to-day deploys, rollbacks, detection of manual edits, and secrets?',
    a: `**Summary:** GitOps = **the entire desired state of the cluster lives in Git**, and an operator running *inside* the cluster (Argo CD) continuously compares live state with Git and pulls reality back to match Git. CI no longer "deploys" — CI only commits a bumped image version. Rollback becomes {{git revert}}, manual edits are detected as **drift** and can be overwritten by self-heal, and secrets never enter Git (External Secrets handles that part).

### Push-based vs pull-based (GitOps)
| | Push: Jenkins runs kubectl | Pull: Argo CD inside the cluster |
|---|---|---|
| Where the cluster credential lives | Jenkins (outside, easy to leak) | inside the cluster, never exposed outward |
| Connection direction | Jenkins needs an inbound path into prod | the cluster reaches outbound to Git on its own |
| Source of truth | Jenkins DB + job history | the Git repo — diff, review, audit for free |
| Rollback | replay an old job, or kubectl | {{git revert}} — still one reviewed deploy |
| A dev wanting to deploy | needs Jenkins/prod access | open a PR against the config repo, that is all |

### The deploy flow for one service after the switch
~~~text
merge PR -> CI builds the image (tag = git SHA) -> push to registry
        -> CI/Argo Image Updater commits the new tag to the apps repo (PR or direct)
        -> Argo CD sees the commit (webhook/poll) -> diff -> Sync -> new Pods via rolling update
~~~
Developers no longer type kubectl against prod; "deploy" is simply merging a config commit.

### Drift, OutOfSync and selfHeal
Argo continuously runs {{diff}} between the live object and the Git render:
- {{OutOfSync}} = a difference exists; the UI shows the diff field by field.
- {{selfHeal: true}}: someone {{kubectl edit}}/applies by hand → Argo immediately overwrites it back to Git → every change is forced through a PR. This is a **process** feature, not merely a technical one.
- A mandatory exception: HPA edits {{/spec/replicas}} constantly → with selfHeal they would fight each other; declare {{ignoreDifferences}} with jsonPointers on {{/spec/replicas}} (or let HPA own replicas and remove the field from the manifest).

### Rollback the GitOps way
- {{kubectl rollout undo}} creates drift instantly and selfHeal performs a "rollback of the rollback" — never use it in a GitOps-managed environment.
- The right way: {{git revert}} the image-bump commit (the platform team allows a fast revert on prod through an emergency branch with one reviewer), Argo syncs again. The whole deploy history = git log, and auditors love it.
- Latency: the default poll is 3 minutes; webhooks/Argo Notifications bring it down to tens of seconds — if prod needs speed, configure this part.

### Sync waves & hooks — ordering inside one deploy
If all manifests apply at once, the Flyway Job running after the app Pod is wrong. Use numeric annotations:

~~~yaml
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "1"   # 0: Namespace/RBAC; 1: migration Job (PreSync hook); 2: Deployment
    argocd.argoproj.io/sync-wave: "-1"
    argocd.argoproj.io/hook: PreSync    # the Flyway Job runs first and must Complete before anything else proceeds
~~~

With 30 services, manage them with an **app-of-apps** pattern or an ApplicationSet (a template derived from the repo layout); adding a service is just one commit.

### Where secrets go in the GitOps model
Git holds no secrets; two common choices: the **External Secrets Operator** pulls from Vault/Secrets Manager and creates Kubernetes Secrets, or sealed secrets encrypted per cluster. For Java apps remember: ESO updates the Secret but the app only reads it at startup → rotation needs a controlled restart (this is where many teams hurt; see the ConfigMap/Secret topic).

### Failure points people usually hit
- Committing a real secret to the apps repo "just temporarily" — the scanner must block it in CI.
- An operator CRD not installed, and after a cluster restore every app sync fails at once — put CRDs in wave -1.
- The config repo balloons (30 services × 4 environments) → slow rendering; split apps/infra and use ApplicationSet.
- The "just kubectl, it is faster" culture surviving selfHeal — discipline is required: prod access becomes break-glass only, with logging.
- Argo CD is a single point of failure: if Argo dies the cluster keeps running, but you lose the safe way to deploy — you need a runbook.

> Senior tip: before the switch, run a "firewall drill": destroy the staging cluster, rebuild it from scratch using only Git + the registry — target under 30 minutes. This drill simultaneously tests GitOps, image backups, Terraform and the docs; a team that cannot do it still has real holes in its GitOps setup.`,
    follow: [
      'selfHeal and an HPA that owns replicas fight each other — how do you design the architecture to avoid ping-pong?',
      'Compare rollback via git revert with kubectl rollout undo on audit trail and speed in prod.',
      'The pipeline still needs a "hot" 2-minute deploy during a P1 incident — how do you design break-glass without losing control?'
    ],
  },
});
