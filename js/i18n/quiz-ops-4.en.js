/*
 * English translation of js/data/quiz-ops.js — task T682. Format: js/core/i18n.js (content overlay).
 * ids: qz-devops-023 qz-devops-024 qz-devops-025 qz-devops-026 qz-devops-027 qz-devops-028 qz-devops-029 qz-devops-030 qz-devops-031 qz-devops-032 qz-devops-033 qz-devops-034 qz-devops-035 qz-devops-036 qz-devops-037 qz-devops-038 qz-devops-039 qz-devops-040 qz-devops-041 qz-devops-042 qz-devops-043 qz-devops-044 qz-devops-045 qz-devops-046 qz-devops-047 qz-devops-048 qz-devops-049 qz-devops-050
 */
App.i18n.content({
  'qz-devops-023': {
    q: 'A Pod runs Spring Boot on Java 17 with {{limits.memory: 2Gi}}, scheduled on a node with 64 GiB of RAM. The {{JAVA_TOOL_OPTIONS}} variable carries no heap flag. What is the maximum heap (MaxHeapSize) of the JVM, and why?',
    options: [
      'About 16 GiB: the JVM sees the RAM of the node (64 GiB) and takes 1/4 of it',
      'About 512 MiB: the JVM reads the memory limit from the cgroup (2 GiB) and the default MaxRAMPercentage is 25%',
      'Exactly 2 GiB: the JVM uses the whole memory limit as the heap',
      'About 1.5 GiB: the JVM by default reserves 75% of the limit for the heap and 25% for everything off-heap'
    ],
    explain: `**Summary:** since JDK 10 (and 8u191) the JVM is **container aware**: it reads the memory limit of the cgroup (v1 or v2) and treats it as the "physical RAM". With no heap flag, the maximum heap = {{MaxRAMPercentage}} (default **25%**) × 2 GiB = **512 MiB**.

### Verify it right inside the Pod
~~~bash
kubectl exec -it orders-7c9f -- java -XX:+PrintFlagsFinal -version | grep -E "MaxHeapSize|MaxRAMPercentage"
kubectl exec -it orders-7c9f -- java -Xlog:os+container=info -version   # prints the limit the JVM read
~~~
### Consequences
A 512 MiB heap while the Pod is allotted 2 GiB: GC runs much more often, p99 gets worse, and roughly 1.5 GiB sits idle. The right approach is to set {{-XX:MaxRAMPercentage=70}} (somewhere in the 65–75% range) so the heap **scales with the limit**, leaving the rest for metaspace, thread stacks, code cache and direct buffers. Avoid hard-coding {{-Xmx}}: the next time someone changes the limit and forgets to update Xmx, the two are out of sync immediately.

### Why the other options are wrong
- **16 GiB from the node RAM**: that is the behaviour of a very old JVM (before 8u191) that did not understand containers. Java 17 has container support on by default ({{UseContainerSupport}}).
- **Exactly 2 GiB**: the JVM never defaults to handing the whole RAM to the heap; if it did, the off-heap part would push the process past the limit and it would be OOMKilled.
- **75% of the limit**: 75% is a number **you should set yourself**, close to that value — it is not the default. The default is only 25% (on a machine with very little RAM the JVM applies the {{MinRAMPercentage}} 50% rule instead).

> Senior tip: put {{jvm_memory_max_bytes}} with the {{area="heap"}} label (Micrometer) on the dashboard right next to the Pod memory limit. A gap shaped like "limit 2 GiB, heap max 512 MiB" is a very common sign of a missed configuration when a team first moves to Kubernetes.`
  },
  'qz-devops-024': {
    q: 'A Spring Boot service has its liveness probe pointed at {{/actuator/health}} (which includes the DB check). A PostgreSQL failover takes 40 seconds, and all 6 Pods get restarted at the same time, stretching the incident by another 3 minutes because Pods come back up slowly. Which two changes are correct? (Choose 2)',
    options: [
      'Raise the liveness failureThreshold to 100 so the Pod is almost never restarted',
      'Point liveness at {{/actuator/health/liveness}}: it reflects only the internal state of the app, without checking the DB or anything external',
      'Add a Kafka check to liveness so infrastructure problems are caught earlier',
      'Keep the DB out of liveness; if you must, consider it only for readiness, because a readiness failure only pulls the Pod out of the endpoints instead of restarting it, and the Pod takes traffic back on its own once the DB recovers',
      'Set the liveness initialDelaySeconds to 300 so the Pod has time to wait for the DB to come back'
    ],
    explain: `**Summary:** liveness answers the question "is this process broken to the point where **a restart would cure it**?". A DB failover is not a fault of the Pod, a restart cannot cure it, and it only makes everything worse: 6 Pods restarting at once (40–60 seconds each) while not a single Pod is left to serve traffic.

### Correct configuration with Actuator
~~~yaml
livenessProbe:
  httpGet: { path: /actuator/health/liveness, port: 8081 }    # livenessState only
readinessProbe:
  httpGet: { path: /actuator/health/readiness, port: 8081 }   # readinessState (+ dependencies only if truly needed)
~~~
Spring Boot turns these two health groups on automatically when it runs on Kubernetes (or set {{management.endpoint.health.probes.enabled=true}}). If you want readiness to check the DB: {{management.endpoint.health.group.readiness.include=readinessState,db}} — but keep in mind that when every Pod loses the DB, every Pod goes unready and the Service still returns 503; many teams prefer the app to fail fast on its own (short timeout, circuit breaker) rather than putting the DB into a probe.

### Why the other options are wrong
- **failureThreshold 100**: liveness is nearly disabled, so a genuinely deadlocked Pod would never be restarted. That fixes the wrong thing: the problem is that liveness checks **the wrong subject**, not the threshold.
- **Add Kafka to liveness**: it repeats exactly the old mistake with a different dependency — a flaky Kafka makes the whole cluster restart in a chain.
- **initialDelaySeconds = 300**: this parameter applies only **once, at container startup**. If the DB dies in the middle of a run, it does nothing; and with 300 seconds, a Pod that hangs at startup is not detected for 5 minutes (use a startupProbe for slow startup).

> Senior tip: the rule I use when reviewing a manifest: **liveness must never depend on anything outside the process**. Every time I see {{db}}, {{redis}} or {{kafka}} in the liveness group, that is a cascade-restart incident waiting for its date.`
  },
  'qz-devops-025': {
    q: 'A node is under memory pressure. Four Pods share the same PriorityClass: A is Guaranteed (request = limit 2Gi, using 1.8Gi); B is Burstable (request 1Gi, limit 4Gi, using 2.5Gi); C is BestEffort (using 200Mi); D is Burstable (request 2Gi, using 1Gi). Which Pod does the kubelet evict first?',
    options: [
      'C: a BestEffort Pod is always evicted first, no matter how much memory it uses',
      'D: a Pod with a large request but low usage, so it is reclaimed to free up the unused part of its request',
      'B: among the Pods using more than their request (B and C), at the same priority the one exceeding its request by more (B is over by 1.5Gi) is evicted first',
      'None: the kubelet only evicts when a container exceeds its own memory limit'
    ],
    explain: `**Summary:** when a node runs short of memory, the kubelet ranks Pods in three steps: (1) does usage **exceed the request**, (2) **priority**, (3) **by how much it exceeds the request**. B is over by 1.5Gi, C is over by 200Mi (its request is 0), A and D use less than their request → B is evicted first.

| Pod | Request | Usage | Over request |
|---|---|---|---|
| A (Guaranteed) | 2Gi | 1.8Gi | no |
| B (Burstable) | 1Gi | 2.5Gi | **+1.5Gi** |
| C (BestEffort) | 0 | 200Mi | +200Mi |
| D (Burstable) | 2Gi | 1Gi | no |

### Why the other options are wrong
- **C is always first**: the QoS class is not a direct criterion of eviction. BestEffort usually dies early because its request is 0, so any usage counts as "over", but a Burstable Pod that "asks for little, uses a lot" can exceed its request by even more. (QoS directly affects the **kernel OOM killer** through {{oom_score_adj}}, which is a different mechanism.)
- **D because of unused request**: the kubelet does not "reclaim" an unused request; a Pod using less than its request is almost safe under memory pressure.
- **Only when over the limit**: exceeding the limit is the job of the OOM killer inside the cgroup (OOMKilled). Node-pressure eviction is its own mechanism, triggered when the node {{memory.available}} drops below a threshold (default hard threshold 100Mi), even when no container touches its limit.

> Senior tip: for a Java service, set **memory request = limit**: the Pod never uses more than its request, so it never sits at the front of the eviction line; if it balloons past the limit, only that container gets OOMKilled, which is clear and easy to investigate.`
  },
  'qz-devops-026': {
    q: 'A Pod in namespace {{shop}} uses the default resolv.conf: search {{shop.svc.cluster.local svc.cluster.local cluster.local}} and {{options ndots:5}}. The app calls {{api.partner.com}}. What is the first DNS query the resolver sends out?',
    options: [
      '{{api.partner.com}}: a public domain name is always queried first',
      '{{api.partner.com.cluster.local}}: the resolver tries the shortest search domain first',
      'No query goes to CoreDNS at all: a name outside the cluster has to be declared with an ExternalName Service before it can resolve',
      '{{api.partner.com.shop.svc.cluster.local}}: the name has 2 dots, fewer than ndots 5, so the resolver appends the first search domain first'
    ],
    explain: `**Summary:** the resolver rule: a name with **a dot count ≥ ndots** is looked up as written first; otherwise the resolver tries **each search domain in turn, in order**, and only last the original name. {{api.partner.com}} has 2 dots < 5.

~~~text
api.partner.com.shop.svc.cluster.local   -> NXDOMAIN
api.partner.com.svc.cluster.local        -> NXDOMAIN
api.partner.com.cluster.local            -> NXDOMAIN
api.partner.com                          -> the real IP
(every step sends both A and AAAA: 8 queries, 6 NXDOMAINs)
~~~
The consequence: CoreDNS carries a lot of garbage queries, and each extra UDP packet is one more chance of losing it — when a packet is lost, glibc waits for a 5 second timeout.

### How to reduce it
~~~yaml
spec:
  dnsConfig:
    options:
      - name: ndots
        value: "2"     # names with >= 2 dots are looked up as written first
~~~
Combine that with NodeLocal DNSCache and a keep-alive connection pool so re-resolution happens less often.

### Why the other options are wrong
- **The public name is always queried first**: the resolver does not distinguish "public" from "internal"; it only counts dots against ndots.
- **Shortest search domain first**: the search list is tried **in exactly the order** written in the file, starting from {{shop.svc.cluster.local}}.
- **ExternalName is required**: CoreDNS forwards out-of-cluster names to an upstream resolver (the forward plugin); ExternalName is only a way to create a CNAME alias inside the cluster, not a requirement.

> Senior tip: when p99 has a "tail" of exactly about 5 seconds, suspect DNS first: count the NXDOMAIN ratio on CoreDNS ({{coredns_dns_responses_total}} by rcode) — that number is usually surprisingly high.`
  },
  'qz-devops-027': {
    q: 'Two engineers run terraform apply at almost the same time against the prod environment; the state lives in S3 but locking is not enabled, and afterwards the state loses track of a security group that was just created. Which two measures stop this from happening again? (Choose 2)',
    options: [
      'Enable backend state locking: S3 with {{use_lockfile = true}} (Terraform 1.10+), or a DynamoDB table in the older configuration',
      'Commit the terraform.tfstate file to Git so everyone always has the latest copy',
      'Let only CI apply: one job at a time per state (concurrency group), applying exactly the plan file that was reviewed in the PR',
      'Run apply with {{-lock=false}} so it never hangs on a lock',
      'Require everyone to run {{terraform refresh}} before applying'
    ],
    explain: `**Summary:** two parallel applies both read state serial N, each one creates its own resources and then writes its own state — whoever writes **later** overwrites whoever wrote first, so the other side resources still exist in AWS but have vanished from the state. You need a **lock** in the backend (the last line of defence) and a **process** so that only one controlled stream applies.

### How the lock works
The second apply runs into {{Error acquiring the state lock}} with the Lock ID, the holder and the timestamp. Use {{terraform force-unlock}} only when you are certain the process holding the lock is dead (for example a killed CI job), otherwise you get two processes writing at once.
~~~bash
terraform plan -input=false -lock-timeout=5m -out=tfplan   # wait up to 5 minutes for the lock instead of failing immediately
terraform apply tfplan                                     # a stale plan (state changed since) is rejected
~~~
Fixing the current damage: bring the security group back into the state with {{terraform import}} or an {{import}} block, and then the plan must come out empty.

### Why the other options are wrong
- **Commit the state to Git**: Git has no notion of a lock, merge conflicts on state are very dangerous, and the state contains secrets in plain text. This is itself one of the root causes.
- **{{-lock=false}}**: it turns off exactly the mechanism you need; only for special, controlled situations.
- **{{terraform refresh}} before apply**: it only updates the state to reality at that moment; two people can still overlap their applies one second later. (This command is deprecated as well, replaced by {{plan -refresh-only}}.)

> Senior tip: humans should not have day-to-day write access to the prod state. Once CI is the only "applier", a lock is almost never contested — and every change comes with a plan, a reviewer and a log.`
  },
  'qz-devops-028': {
    q: 'Argo CD has auto-sync and self-heal enabled. The Deployment {{orders}} manifest in Git has {{replicas: 3}}, while the HPA scales to 10 Pods at peak. Argo CD keeps reporting OutOfSync and pulls the replica count back to 3, then the HPA scales up again. What is the correct fix?',
    options: [
      'Remove the {{replicas}} field from the Git manifest so the HPA is the only owner of the replica count (or declare ignoreDifferences for /spec/replicas in the Application)',
      'Disable self-heal for the whole cluster so Argo CD stops interfering',
      'Set the HPA {{minReplicas}} to 3 to match Git',
      'Delete the HPA; at each peak, edit replicas in Git and wait for Argo CD to sync'
    ],
    explain: `**Summary:** this is **two controllers fighting over one field**. Git (through Argo CD) says "3", the HPA says "10"; self-heal treats the HPA value as **drift** and corrects it, the HPA scales up again — Pods are created and deleted over and over. The principle: each field has **one owner**. When the replica count is dynamic, the owner is the HPA, so Git must not declare it.

~~~yaml
# Option 1 (recommended): the Deployment manifest has no spec.replicas
# Option 2: in the Argo CD Application
spec:
  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers: [/spec/replicas]
~~~

### Why the other options are wrong
- **Disable self-heal cluster-wide**: you also lose the ability to correct real drift (someone {{kubectl edit}}s the image or env on prod). Curing one field by throwing away the whole mechanism.
- **minReplicas = 3**: the HPA still scales up to 10 at peak and Git still says 3 — the tug of war is untouched.
- **Drop the HPA, edit Git by hand**: it reacts at human speed plus sync latency, exactly when peak needs the fastest possible response.

> Senior tip: when you remove {{replicas}} from the manifest of a Deployment that is **already running**, client-side apply can delete that field from the object and Kubernetes puts it back to the default 1 for a moment before the HPA pulls it up again. The Kubernetes docs have a dedicated guide for switching over to autoscaling; do it outside peak hours or use server-side apply. This kind of drift also shows up with annotations added by a mesh/sidecar injector — handle it with the same "one field, one owner" rule.`
  },
  'qz-devops-029': {
    q: 'The pipeline signs images with cosign keyless; Kyverno only allows images that carry a signature whose identity is the {{release.yml}} workflow on the main branch. An attacker with registry push rights pushes a different image over the tag {{payment:1.8.0}} (this tag had been validly signed). When a new Pod is created with that tag, what happens?',
    options: [
      'The Pod runs normally, because tag 1.8.0 was once signed validly',
      'The Pod is rejected: the signature is bound to the digest of the old image, and the tag now points to a new digest that has no valid signature from the right workflow identity',
      'cosign detects that the new image contains a CVE vulnerability and blocks it',
      'Kyverno automatically reuses the old image still in the node cache under that tag'
    ],
    explain: `**Summary:** cosign signs the **digest** (the sha256 of the image manifest), not the tag. A tag is just a pointer that can be overwritten. Kyverno resolves the tag into its current digest, looks for a signature **of that digest** and checks that the certificate really has the issuer/subject of the release workflow. The attacker image has a new digest with no signature from that identity → admission rejects it.

~~~bash
cosign verify registry.bank.vn/payment:1.8.0 --certificate-identity https://github.com/bank/payment/.github/workflows/release.yml@refs/heads/main --certificate-oidc-issuer https://token.actions.githubusercontent.com
# image overwritten: "no matching signatures" -> verify fails
~~~
The attacker cannot sign it either: keyless demands an OIDC token from **that exact workflow on that exact branch**, and the signature lands in the public Rekor transparency log.

### Why the other options are wrong
- **The tag was signed once**: signatures do not travel with the tag. If verification worked on tags, the whole mechanism would be pointless, because anyone who overwrites the tag would "inherit" the signature.
- **cosign detects CVEs**: signing and verifying only prove **provenance and integrity**, they do not assess vulnerabilities. CVE scanning is the job of Trivy/Grype.
- **Kyverno reuses the cached old image**: an admission controller does not choose the image for you; it only allows or denies (and it can rewrite the tag into the **verified digest** when {{mutateDigest}} is enabled).

> Senior tip: besides signature verification, turn on **tag immutability** in the registry (ECR and Harbor both support it) and deploy by digest. Three layers: the tag cannot be overwritten, the manifest pins the digest, admission verifies the signature — an attacker has to get past all three.`
  },
  'qz-devops-030': {
    q: 'Which statements about SBOMs and image vulnerability scanning are correct? (Choose 2)',
    options: [
      'An image that passes Trivy at build time is safe for its whole lifetime, there is no need to scan it again',
      'Signing an image with cosign guarantees that the image contains no known vulnerability',
      'An SBOM records the list of components in an image, so when a new CVE is published you can look up which services are affected without rebuilding anything',
      'An SBOM generated by the Maven CycloneDX plugin already includes the operating system packages of the base image',
      'The {{--ignore-unfixed}} flag of Trivy skips vulnerabilities that have no patch yet, so the gate only blocks what the team can actually fix by bumping a version'
    ],
    explain: `**Summary:** an SBOM is the "list of ingredients" (OS packages, the JRE, every jar with its version and purl) — a **long-lived** asset you query later. A CI gate should block vulnerabilities **that already have a patch** ({{--ignore-unfixed}}), while unpatched ones get assessed and tracked separately.

~~~bash
syft registry.bank.vn/payment@sha256:... -o cyclonedx-json > sbom.cdx.json
trivy image --severity CRITICAL,HIGH --ignore-unfixed --exit-code 1 registry.bank.vn/payment@sha256:...
trivy sbom sbom.cdx.json      # daily: rescan the stored SBOM against the latest vulnerability DB
~~~

### Why the other options are wrong
- **Pass at build means safe forever**: CVEs are published every day; an image that is "clean" today can pick up a CRITICAL CVE next week without anyone changing a single byte. You must rescan the images **that are running** (based on their SBOM, Trivy Operator, Dependency-Track…).
- **Signing guarantees no vulnerabilities**: a signature only proves the image was produced by your pipeline and has not been modified. An image full of vulnerabilities signs perfectly normally.
- **A Maven SBOM includes OS packages**: the Maven plugin only sees the Java dependencies of the project; it has no idea which glibc or openssl version the base image contains. You need an SBOM generated from the **image** (Syft, Trivy) for the OS part.

> Senior tip: attach an **expiry date** and the person who approved it to every exception (an unpatched CVE, or one that is not exploitable in your context). An ignore list with no deadlines is where serious CVEs sit quietly for years.`
  },
  'qz-devops-031': {
    q: 'A Java service calls a partner API about 800 times per second. At peak the log reports {{java.net.BindException: Cannot assign requested address}}; {{ss -tan state time-wait}} counts around 28,000 sockets, almost all of them to the same partner IP:443. What is the root cause and the best fix?',
    options: [
      'The process hit the file descriptor limit; raise {{ulimit -n}} to 1,000,000',
      'TIME_WAIT lasts long because of {{tcp_fin_timeout}}; lower that parameter to 5 seconds so TIME_WAIT expires faster',
      'Ephemeral ports are exhausted because each request opens a new TCP connection and then closes it; share one HTTP client with a connection pool and keep-alive so connections get reused',
      'Enable {{net.ipv4.tcp_tw_recycle}} so the kernel recycles TIME_WAIT sockets'
    ],
    explain: `**Summary:** connections to **the same destination** differ only in the source port, which is taken from {{ip_local_port_range}} (default 32768–60999 ≈ 28 thousand ports). A socket that closed actively stays in TIME_WAIT for **60 seconds**, so the ceiling is about 28,000 / 60 ≈ **470 new connections per second**. At 800 requests/second with one new connection per request, the ports run out. The EADDRNOTAVAIL error ("Cannot assign requested address") is exactly that symptom.

~~~java
// Typical bug: a new client created for every call
HttpClient client = HttpClient.newHttpClient();          // WRONG if it sits inside the request handler
// Fix: one shared instance (thread-safe); connections are kept and reused
private static final HttpClient CLIENT = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(2)).build();
~~~
Secondary measures (they widen the margin, they do not replace the code fix): enlarge {{ip_local_port_range}}, and enable {{net.ipv4.tcp_tw_reuse=1}} so outbound connections can safely reuse a TIME_WAIT socket (this relies on TCP timestamps).

### Why the other options are wrong
- **File descriptor limit**: running out of fds is a completely different error — "Too many open files" (EMFILE). A socket in TIME_WAIT has already been closed and no longer holds a fd of the process.
- **Lower {{tcp_fin_timeout}}**: a very common misconception. This parameter controls FIN_WAIT_2; the TIME_WAIT duration on Linux is hard-coded in the kernel at 60 seconds.
- **{{tcp_tw_recycle}}**: it was **removed from the kernel since version 4.12** because it dropped connections from clients sitting behind NAT. On a modern kernel this sysctl does not exist at all.

> Senior tip: when you see TIME_WAIT piling up toward one destination, the first question is always "where is the HTTP client created, and how many times?". And if many Pods egress through a single NAT gateway, remember the NAT ceiling too (an AWS NAT Gateway allows about 55,000 concurrent connections per destination) — the same bug, one more place to explode.`
  },
  'qz-devops-032': {
    q: 'A Java service running under systemd reports "Too many open files". You SSH into the server, run {{ulimit -n}} and see 65536, and {{/etc/security/limits.conf}} also sets nofile 65536. Which approach tells you the limit the Java process is actually subject to?',
    options: [
      'Trust the {{ulimit -n}} output in the SSH session, because every process on the machine shares that limit',
      'Read {{sysctl fs.file-max}}, because that is the per-process file limit',
      'Read {{/etc/security/limits.conf}}, because systemd applies this file to every service',
      'Read {{/proc/PID/limits}} of the Java process itself (the "Max open files" line) and compare it with the number of fds currently open in {{/proc/PID/fd}}'
    ],
    explain: `**Summary:** the fd limit is a property **of each individual process**, inherited from its parent process at start-up. The only source of truth is {{/proc/PID/limits}} of that very process.

~~~bash
PID=$(pgrep -f orders.jar)
grep "Max open files" /proc/$PID/limits     # the real soft and hard limits
ls /proc/$PID/fd | wc -l                    # how many fds are open right now
systemctl show orders.service -p LimitNOFILE
~~~
A systemd service takes its limit from {{LimitNOFILE=}} in the unit file (or from the systemd default); it does **not** go through PAM, so it never reads limits.conf. The fix: add {{LimitNOFILE=65536}} to the unit (a drop-in via {{systemctl edit}}), then restart the service. On Linux, HotSpot raises the soft limit up to the hard limit at start-up by default, so the hard limit is the number that actually decides.

### Why the other options are wrong
- **{{ulimit -n}} in SSH**: that is the limit of **your shell**, set by PAM at login. A process started by systemd sits in a completely different process tree.
- **{{fs.file-max}}**: a **system-wide** limit (the total number of fds the kernel will hand out), not a per-process limit. Look at total current usage in {{/proc/sys/fs/file-nr}}.
- **systemd reads limits.conf**: wrong — limits.conf is applied by the {{pam_limits}} module to login sessions; systemd services do not pass through PAM.

> Senior tip: raising the limit is only half the story. If the fd count climbs steadily hour after hour (a straight line going up in the {{process_files_open_files}} metric), that is a **leak** — streams or sockets that are never closed — and a higher limit only moves the crash to a more inconvenient time.`
  },
  'qz-devops-033': {
    q: 'The SLO of the payment API is 99.9% of requests successful over 30 days. During the last hour, the error ratio has been steady at 1.44%. Which statement is correct?',
    options: [
      'The burn rate is 14.4: the last hour consumed about 2% of the error budget for the whole 30 days, and if it continues the budget is empty after about 50 hours — high enough to page the on-call right away',
      'The burn rate is 1.44: still inside the budget, so opening a ticket is enough',
      'No violation yet, because the SLO is measured over 30 days, so there is no need to alert until the month ends',
      'The burn rate is 144: the error budget was completely exhausted within that hour'
    ],
    explain: `**Summary:** error budget = 1 − 0.999 = **0.1%**. Burn rate = error ratio / budget = 1.44% / 0.1% = **14.4**, meaning the budget is being consumed 14.4 times faster than the pace that is "just enough for 30 days".

### The arithmetic step by step
- A 30-day window = 720 hours. At burn rate 1 the budget runs out in exactly 720 hours.
- 1 hour at burn rate 14.4 consumes 14.4 / 720 = **2%** of the budget.
- If it continues: 720 / 14.4 = **50 hours** and the whole month budget is gone.
- Per the SRE Workbook, a burn rate of 14.4 on a 1 hour window (paired with a 5 minute window to confirm the error **is still ongoing**) is a **page** threshold.

~~~yaml
expr: payment:error_ratio:rate1h > (14.4 * 0.001) and payment:error_ratio:rate5m > (14.4 * 0.001)
~~~

### Why the other options are wrong
- **Burn rate 1.44**: this confuses the error ratio (1.44%) with the burn rate; you must divide by the 0.1% budget, not by 1.
- **Wait until the month ends**: the SLO is measured over 30 days, but alerting must be based on the **speed of consumption**. Waiting for the actual breach means it is already too late to act.
- **Burn rate 144, budget already empty**: a mistake in the order of magnitude; one hour at 14.4 consumes only 2% of the budget, still far from empty.

> Senior tip: on a low-traffic service, 3 errors out of 100 requests is already 3% — the burn rate shoots up to 30 although it is only noise. Add a minimum request count for the window, or inject synthetic traffic, before you turn on burn-rate paging.`
  },
  'qz-devops-034': {
    q: 'The {{orders}} Deployment has 4 replicas, with strategy RollingUpdate, {{maxSurge: 1}} and {{maxUnavailable: 0}}. The new build has a bug that makes the readiness probe always fail (liveness still passes). What happens after you apply?',
    options: [
      'Kubernetes rolls back to the old ReplicaSet automatically after progressDeadlineSeconds',
      'All 4 old Pods are replaced one after another by new Pods, and the service returns 503 until you fix it',
      'The new Pod is restarted continuously by the kubelet because readiness fails, and it falls into CrashLoopBackOff',
      'The rollout stalls: 1 new Pod is created but never becomes Ready, the 4 old Pods keep serving; after progressDeadlineSeconds (default 600 seconds) the Deployment reports ProgressDeadlineExceeded but does not roll back on its own'
    ],
    explain: `**Summary:** {{maxUnavailable: 0}} means the number of **ready** Pods may not drop below 4. The controller adds 1 new Pod (thanks to {{maxSurge: 1}}) and deletes an old Pod only once the new one is **Ready**. The new Pod never becomes Ready → no old Pod is deleted → the rollout stands still, and users **are not affected**.

~~~bash
kubectl rollout status deployment/orders --timeout=10m   # fails with ProgressDeadlineExceeded
kubectl get rs -l app=orders                             # old RS 4/4 ready, new RS 1 desired, 0 ready
kubectl rollout undo deployment/orders                   # rollback performed by YOU (or by the pipeline)
~~~

### Why the other options are wrong
- **Automatic rollback**: the Deployment only sets the condition {{Progressing=False}} with reason {{ProgressDeadlineExceeded}}; rolling back is the job of the pipeline, of the operator, or of a tool such as Argo Rollouts.
- **All 4 old Pods replaced**: that only happens when the new build becomes Ready. This is exactly the value of a readiness probe combined with maxUnavailable 0: a broken build is blocked at the very first Pod.
- **CrashLoopBackOff**: a readiness failure **never** restarts a container — it only removes the Pod from the endpoints of the Service. A restart is the consequence of a liveness failure or of the process exiting on its own.

> Senior tip: the pipeline should run {{kubectl rollout status}} with a timeout and call rollback itself when that fails; otherwise a stalled rollout can sit there for days, and the next deploy will stack on top of this half-finished state.`
  },
  'qz-devops-035': {
    q: 'What is wrong with the following Dockerfile?\n~~~dockerfile\nFROM node:20\nWORKDIR /app\nCOPY . .\nRUN npm install\nRUN npm run build\nCMD npm start\n~~~',
    options: [
      'The order of COPY and RUN npm install makes every rebuild reinstall the entire dependency tree as soon as any code file changes',
      'EXPOSE is missing, so the container does not expose its port',
      'FROM node:20 has no digest, so the build is not reproducible',
      'CMD uses the shell form, so it does not receive the SIGTERM signal correctly'
    ],
    explain: `**Summary:** copying the whole source tree before npm install invalidates the cache of the npm install layer every time any file changes.

### The correct fix
- COPY package.json and package-lock.json first, then RUN npm ci, and only after that COPY the source.

### Why the other options are wrong
- EXPOSE is only metadata.
- The FROM tag is a best practice issue but not the main problem here.
- CMD in shell form does have a signal problem, but it is not what this question is about.

> Senior tip: multi-stage build + .dockerignore + layer ordering.`
  },
  'qz-devops-036': {
    q: 'A Pod is OOMKilled. Choose the two most common causes (Choose 2)',
    options: [
      'The memory limit is set below peak usage',
      'A memory leak in the application',
      'CPU throttling',
      'An image pull error',
      'A readiness probe failure'
    ],
    explain: `**Summary:** OOMKilled happens when a container exceeds its memory limit (cgroup OOM) or when the node runs out of memory. The two common causes are a limit that is too low compared with peak, and a memory leak.

### Why the other options are wrong
- CPU throttling causes latency, not OOM.
- An image pull error leads to ImagePullBackOff.
- A readiness failure removes the Pod from the Service, it does not restart it.

> Senior tip: set request = typical usage, limit = peak + 20%; use VPA for recommendations. Track RSS and heap through metrics.`
  },
  'qz-devops-037': {
    q: 'How does CrashLoopBackOff differ from ImagePullBackOff?',
    options: [
      'CrashLoopBackOff: the container did start and then crashed; ImagePullBackOff: the image could not be pulled',
      'CrashLoopBackOff is caused by a readiness failure',
      'ImagePullBackOff is caused by a liveness failure',
      'Both are caused by OOM'
    ],
    explain: `**Summary:** CrashLoopBackOff = the container starts successfully, then exits/crashes, and the kubelet restarts it with exponential backoff. ImagePullBackOff = the image cannot be pulled (wrong tag, registry secret, network).

### Why the other options are wrong
- A readiness failure does not restart the container.
- A liveness failure does cause restarts, but ImagePullBackOff has nothing to do with liveness.
- OOM is one cause of a crash, not all of them.

> Senior tip: use kubectl describe pod to read the Events; use kubectl logs --previous to read the log of the container that just crashed.`
  },
  'qz-devops-038': {
    q: 'PromQL: rate(http_requests_total[5m]) vs irate(http_requests_total[5m]) — how do they differ?',
    options: [
      'rate computes an average over the whole window; irate uses only the last two samples, so it is sensitive to spikes',
      'irate is more accurate in every case',
      'rate is only for counters, irate is for gauges',
      'The two are identical'
    ],
    explain: `**Summary:** rate = (last-first)/window (an average). irate = (last-prev)/interval (instantaneous, spike-sensitive). Use rate for alerts and SLOs, and irate for debugging spikes.

### Why the other options are wrong
- irate is not "more accurate", it is sensitive to noise.
- Both are for counters only (they handle resets).
- The two differ clearly.

> Senior tip: alerts use rate; a dashboard may use irate but be careful with noise.`
  },
  'qz-devops-039': {
    q: 'histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) — what does it mean?',
    options: [
      'p99 latency over the most recent 5 minutes',
      'The ratio of failed requests',
      'The number of requests per second',
      'The maximum latency'
    ],
    explain: `**Summary:** histogram_quantile computes a quantile from the buckets. 0.99 = p99. Combined with rate, you get the recent p99 latency.

### Why the other options are wrong
- An error ratio needs an errors/total counter.
- RPS needs rate(requests_total).
- Maximum latency cannot come from a histogram (you need a gauge, or max over time).

> Senior tip: make sure the bucket boundaries fit your traffic (for example .005,.01,.025,.05,.1,.25,.5,1,2.5,5,10).`
  },
  'qz-devops-040': {
    q: 'GitHub Actions cache: actions/cache with the key {{hashFiles("package-lock.json")}}. When the lock file changes, the cache misses. What is the purpose?',
    options: [
      'Guarantee that the cached dependencies always match the lock file version',
      'Speed up the build in every case',
      'Cache the source code',
      'Make restoring the cache mandatory'
    ],
    explain: `**Summary:** the key is derived from the lock file, so you get a cache hit only when the dependencies are unchanged; when they change, the build reinstalls and stores a new cache. This prevents using stale dependencies.

### Why the other options are wrong
- It does not speed up every case (there is a miss when the lock file changes).
- It does not cache source code (only node_modules).
- A restore-keys fallback may use an older cache, but that is not mandatory.

> Senior tip: use restore-keys for a partial fallback, but verify integrity.`
  },
  'qz-devops-041': {
    q: 'A Flyway migration during a rolling update: app v2 needs a new schema while app v1 is still running. What is the safe strategy?',
    options: [
      'Run backward-compatible migrations first (add a nullable column), deploy the app, and only then clean up the old column',
      'Run a migration with DROP COLUMN as soon as v2 deploys',
      'Stop the entire app, then migrate',
      'Run the migration during app startup'
    ],
    explain: `**Summary:** expand-contract: add the nullable column first, deploy the new app that reads and writes the new column while still being compatible with v1, then drop the old column. This avoids downtime and v1 errors.

### Why the other options are wrong
- Dropping the column immediately makes v1 crash (the column no longer exists).
- Stopping everything causes downtime.
- Migrating during startup creates a race condition when several instances start at once.

> Senior tip: run Flyway as an init container or as a separate job, and version the schema alongside the app.`
  },
  'qz-devops-042': {
    q: 'Helm values: overriding with --set and -f values-prod.yaml. What is the precedence order?',
    options: [
      '--set outranks -f; the value applied last wins',
      '-f always outranks --set',
      'The chart default values have the highest precedence',
      'Overriding is not possible'
    ],
    explain: `**Summary:** Helm merges in this order: chart defaults → the -f files (in their order) → --set. The value applied last wins, and since --set is applied last it has the highest precedence.

### Why the other options are wrong
- -f does not always outrank --set.
- The defaults have the lowest precedence.
- Overriding is possible.

> Senior tip: use values-prod.yaml plus --set for dynamic secrets; avoid many --set flags for large configuration.`
  },
  'qz-devops-043': {
    q: 'Terraform state lock: the error "Error acquiring the state lock". What is the cause?',
    options: [
      'Another Terraform process is running, or a stale lock was never released',
      'The state file is corrupt',
      'A provider version mismatch',
      'The backend has not been initialised'
    ],
    explain: `**Summary:** the state lock (DynamoDB) prevents concurrent applies. A lock exists either because another process is running, or because a crashed run left its lock behind.

### How to deal with it
- Wait for the other process to finish.
- If it crashed: terraform force-unlock <LOCK_ID> (carefully).

### Why the other options are wrong
- A corrupt state produces a checksum error, not a lock error.
- A provider mismatch fails at plan time.
- An uninitialised backend fails at init time.

> Senior tip: serialise terraform apply in CI; use -lock-timeout.`
  },
  'qz-devops-044': {
    q: 'A Kubernetes liveness probe fails repeatedly — what happens?',
    options: [
      'The container is restarted',
      'The Pod is deleted',
      'The Service returns 503',
      'The scheduler reschedules the Pod'
    ],
    explain: `**Summary:** a liveness failure makes the kubelet kill and restart the container (following the restartPolicy). Repeated failures lead to CrashLoopBackOff.

### Why the other options are wrong
- The Pod is not deleted (except by eviction).
- The Service returning 503 is caused by readiness, not liveness.
- The scheduler does not reschedule the Pod unless the node fails.

> Senior tip: liveness should check for deadlock/hang, not for an external dependency (the DB), to avoid a restart storm.`
  },
  'qz-devops-045': {
    q: 'A readiness probe fails — what happens?',
    options: [
      'The Pod is removed from the endpoints of the Service (it receives no traffic), without being restarted',
      'The container restarts',
      'The Pod is deleted',
      'The node gets drained'
    ],
    explain: `**Summary:** a readiness failure removes the Pod from the Service endpoints without restarting it. Use it to gate traffic during startup or while a dependency is down.

### Why the other options are wrong
- Restarting is liveness job.
- Deleting a Pod is eviction/deletion.
- Draining a node is an admin action.

> Senior tip: it is fine for readiness to check a dependency (the DB); for liveness it is not.`
  },
  'qz-devops-046': {
    q: 'Kubernetes Deployment strategy: Recreate vs RollingUpdate?',
    options: [
      'Recreate: kill all old Pods then create new ones (downtime); RollingUpdate: replace Pods gradually',
      'Recreate is always faster',
      'RollingUpdate does not support rollback',
      'Recreate is the one meant for stateless workloads'
    ],
    explain: `**Summary:** Recreate terminates all the old Pods and only then creates the new ones, so there is downtime; use it when two versions cannot run side by side. RollingUpdate replaces Pods gradually, so there is zero downtime.

### Why the other options are wrong
- Recreate is not always faster (it comes with downtime).
- RollingUpdate does support rollback.
- Recreate is usually used for stateful workloads / RWO volumes.

> Senior tip: use Recreate when an exclusive resource is required (an RWO volume).`
  },
  'qz-devops-047': {
    q: 'Choose two best practices for container images (Choose 2)',
    options: [
      'Run as a non-root user',
      'Keep the image small (distroless/alpine)',
      'Run the container with --privileged',
      'Store secrets inside the image',
      'Use the latest tag in production'
    ],
    explain: `**Summary:** a non-root user reduces the blast radius; a small image reduces the attack surface and the pull time.

### Why the other options are wrong
- --privileged is dangerous.
- Secrets baked into an image leak.
- The latest tag is not reproducible.

> Senior tip: scan the image (Trivy), sign it (cosign), and keep an SBOM.`
  },
  'qz-devops-048': {
    q: 'A Prometheus scrape target is down, so the {{up}} metric = 0. Which alert rule is normally used?',
    options: [
      '{{up == 0}}',
      'rate(errors) > 0',
      'histogram_quantile(...)',
      'node_cpu_seconds_total'
    ],
    explain: `**Summary:** the {{up}} metric is 1 when a scrape succeeds and 0 when the target is down. Alert on {{up == 0}}.

### Why the other options are wrong
- An error rate measures application errors, not a down scrape target.
- histogram_quantile measures latency.
- node_cpu has nothing to do with scraping.

> Senior tip: alert on up for infrastructure; alert on error rate for the application.`
  },
  'qz-devops-049': {
    q: 'By default, which metric does the Kubernetes HPA scale on?',
    options: [
      'CPU utilisation (based on requests)',
      'Memory only',
      'Custom metrics are mandatory',
      'Network throughput'
    ],
    explain: `**Summary:** by default the HPA uses CPU utilisation compared with the request (a target average). Memory and custom metrics can be added.

### Why the other options are wrong
- Memory is not the default (it needs configuration).
- Custom metrics are optional.
- Network is not a default metric.

> Senior tip: set resource requests correctly so the HPA works; the scale-down stabilization window prevents flapping.`
  },
  'qz-devops-050': {
    q: 'Terraform plan shows that a resource will be destroyed and recreated. What is the usual cause?',
    options: [
      'A change to an immutable attribute (force a new resource)',
      'A change to a tag',
      'A change to a description',
      'A change to count'
    ],
    explain: `**Summary:** some attributes are immutable (for example an AMI id, a subnet); changing them makes Terraform destroy and create the resource again. Read the plan carefully, and lifecycle ignore_changes can help.

### Why the other options are wrong
- Tags and descriptions are normally updated in place.
- Changing count can add or remove instances, but does not necessarily recreate all of them.

> Senior tip: use moved blocks / state mv to avoid recreation when refactoring; review the plan in CI.`
  },
});
