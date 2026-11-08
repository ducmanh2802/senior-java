/*
 * English translation of js/data/quiz-ops.js — task T1002. Format: js/core/i18n.js (content overlay).
 * ids: qz-devops-051 qz-devops-052 qz-devops-053 qz-devops-054 qz-devops-055 qz-devops-056 qz-devops-057 qz-devops-058 qz-aws-023 qz-aws-024 qz-aws-025 qz-aws-026 qz-aws-027 qz-aws-028 qz-aws-029 qz-devops-059 qz-devops-060 qz-devops-061 qz-devops-062 qz-devops-063 qz-devops-064 qz-devops-065 qz-devops-066 qz-devops-067 qz-devops-068 qz-devops-069
 */
App.i18n.content({
  'qz-devops-051': {
    q: "In Kubernetes (the container orchestration system that runs and manages many containers across a cluster of servers), you want to run a data-import job that runs once and then ends. Which workload type (a resource describing how Pods run) is most appropriate?",
    options: [
      "Deployment: ensures a number of Pods keep running continuously and restart when a Pod dies",
      "DaemonSet: ensures each node (server in the cluster) runs exactly one copy of the Pod",
      "Job: creates a Pod that runs until it completes successfully, retrying on failure",
      "StatefulSet: manages Pods with stable identity, usually used for databases"
    ],
    explain: "**Summary:** Job is for tasks that run once and finish (batch). It tracks the Pod until successful completion; if the Pod fails, the Job can create a new Pod to retry according to configuration.\n\n### What, why, how it works\n- **Pod**: the smallest unit in Kubernetes, wrapping one or a few containers.\n- **Deployment** (continuous deployment): for applications that always run (web API). It keeps a stable number of replicas; if a Pod crashes, Deployment creates a replacement.\n- **Job**: for tasks with an end point, e.g. data import, nightly report. Job treats exit code 0 as success. Common params: {{completions}} (how many completions needed), {{parallelism}} (how many Pods run in parallel), {{backoffLimit}} (retry count on failure).\n- **CronJob**: runs a Job on a schedule (like Linux cron).\n\n~~~yaml\napiVersion: batch/v1\nkind: Job\nmetadata: { name: import-data }\nspec:\n  backoffLimit: 3        # retry up to 3 times on failure\n  template:\n    spec:\n      restartPolicy: Never  # Job manages retries itself\n      containers:\n        - name: importer\n          image: myapp:1.0\n          command: [\"java\",\"-jar\",\"/app/import.jar\"]\n~~~\n\n### Common mistakes\n- Using Deployment for a one-off job: when the job finishes and exits, Deployment thinks the Pod died and restarts it in a loop (CrashLoopBackOff or infinite loop).\n- Setting {{restartPolicy: Always}} in a Job: invalid; Job uses {{Never}} or {{OnFailure}}.\n\n### Interview answer\n\"For a one-off batch task I use Job/CronJob; for an always-on service I use Deployment; one copy per node uses DaemonSet; stateful app with stable identity uses StatefulSet.\"\n\n> Senior tip: A completed Job keeps its Pod (to view logs). Set {{ttlSecondsAfterFinished}} so Kubernetes cleans up old Pods and avoids clutter in the namespace."
  },
  'qz-devops-052': {
    q: "A Pod has 2 containers: container {{app}} (Java application) and container {{cloud-sql-proxy}} (DB connection proxy). App starts faster than the proxy, so it fails DB connection for the first few seconds. Which two ways help the app run only when the proxy is ready? (Choose 2)",
    options: [
      "Use an initContainer to wait for the proxy/DB to be ready before the main app container starts",
      "Use startupProbe or readiness logic (or native sidecar/init with restartPolicy Always in newer K8s) to control sidecar readiness order",
      "Increase Deployment replicas to 10 to always have a ready Pod",
      "Set app livenessProbe to check DB so kubelet restarts app when DB is not ready",
      "Make app sleep 60 seconds before starting"
    ],
    explain: "**Summary:** The problem is startup ordering between containers in the same Pod. Use initContainer for sequential preparation, or sidecar/startupProbe mechanism to signal when the dependency is ready. Liveness restart loops do not fix the root cause.\n\n### Concepts\n- **initContainer**: runs **before** main containers, sequentially, and main containers start only after it completes (exit 0). Example: wait for DB port to open, run migration.\n- **sidecar**: runs **in parallel** with app in one Pod (proxy, log shipper).\n- **Probe**: kubelet periodically checks container state. {{startupProbe}} for startup phase; {{readinessProbe}} decides whether to receive traffic; {{livenessProbe}} decides whether to restart.\n\n~~~yaml\nspec:\n  initContainers:\n    - name: wait-db\n      image: busybox\n      command: ['sh','-c','until nc -z db 5432; do sleep 1; done']\n  containers:\n    - name: app\n      image: myapp:1.0\n~~~\n\n### Why the others are wrong\n- **Increase replicas**: does not fix startup ordering; every new Pod still fails for the first few seconds.\n- **livenessProbe checking DB**: DB/proxy not ready is not an internal app fault; kubelet restarts app repeatedly, causing restart storm, especially when the dependency is weak.\n- **sleep 60**: guessing time; unnecessarily slow when proxy comes up fast, and still fails if proxy needs more than 60s.\n\n> Senior tip: With external dependencies (DB), liveness should not check them; readiness may consider it. Do not use restart to hide startup-ordering issues."
  },
  'qz-devops-053': {
    q: "File {{/var/app/config.yml}} has permissions shown as {{-rw-r-----}} (owner {{app}}, group {{app}}). User {{deploy}} (not in group {{app}}, not root) runs a command to read this file. What is the result?",
    options: [
      "Readable because any user can read a file with an {{r}}",
      "Readable if {{deploy}} knows the absolute path",
      "Permission denied because {{deploy}} is neither owner nor in group {{app}}, so it falls into \"others\" permissions {{---}}",
      "Denied only when the file is under {{/root}}"
    ],
    explain: "**Summary:** Linux checks permissions in 3 layers: **owner**, **group**, **others**. {{deploy}} falls into others and others has no read permission ({{---}}), so it gets Permission denied.\n\n### Explained piece by piece\nThe string {{-rw-r-----}} has 10 characters:\n~~~text\n-  rw-  r--  ---\n|  |    |    |\n|  |    |    +-- others: no read/write/execute\n|  |    +------- group: read (r) only\n|  +------------ owner: read + write (rw)\n+--------------- file type (- = regular file, d = directory)\n~~~\n- {{r}} = read, {{w}} = write, {{x}} = execute (for directories: enter/list).\n- Kernel checks **in order**: if you are the owner, it uses owner permissions (even if owner is {{---}}, it does not fall through to group).\n\n### Real-life analogy\nLike a house lock: the owner has a key, family members have a code, strangers (others) have nothing.\n\n### Common mistakes\n- chmod 777 to be quick: everyone can read/write/execute, very dangerous for secret files.\n- Forgetting {{x}} on a directory: even with {{r}} on the file, without {{x}} on the parent directory you cannot enter.\n\n> Senior tip: Use {{ls -l}} to view permissions, {{namei -l /path}} to check permissions along the whole parent-chain. In containers, run non-root with least privilege."
  },
  'qz-devops-054': {
    q: "Deploy script has first line {{#!/bin/bash}} and {{set -euo pipefail}}. Command {{grep \"pattern\" missing.log | wc -l}} runs while {{missing.log}} does not exist. With this configuration, how does the script behave (default bash, grep cannot find the file)?",
    options: [
      "Script ignores the error and continues, because {{wc -l}} still runs successfully",
      "Script stops immediately: {{-e}} (exit on error) combined with {{pipefail}} (pipeline fails if any command in it fails) makes grep's error fail the whole pipeline",
      "Script stops only if {{set -x}} is added",
      "Script hangs waiting for the file to appear"
    ],
    explain: "**Summary:** {{set -e}} makes the script exit when a command returns a non-zero status; {{pipefail}} makes a pipeline fail if **any** command in the pipe fails (not just the last). {{grep}} fails because the file is missing, so the pipeline fails and the script stops.\n\n### Explaining each option\n- {{-e}} (errexit): command fails -> exit. Prevents running dangerous next steps (e.g. deploy when build failed).\n- {{-u}} (nounset): using an unset variable -> error. Avoids {{rm -rf $DIR/}} when $DIR is empty.\n- {{-o pipefail}}: by default {{cmd1 | cmd2}} takes the exit code of {{cmd2}}; with pipefail, if {{cmd1}} fails the whole pipe fails.\n\n~~~bash\n#!/bin/bash\nset -euo pipefail\ngrep \"x\" missing.log | wc -l   # grep fails -> pipe fails -> script stops here\necho \"this line never runs\"\n~~~\n\n### Why the others are wrong\n- **Ignores because wc succeeds**: that is the behavior **without** pipefail. With pipefail, grep's error is preserved.\n- **Needs set -x**: {{-x}} only prints commands for debugging; it does not affect exit-on-error.\n- **Hangs waiting for file**: shell does not wait for files; you need your own loop.\n\n> Senior tip: {{-e}} has pitfalls (inside {{if}}, {{&&}}, {{||}}, functions). For a command that is allowed to fail, use {{grep ... || true}} or check explicitly. Always test scripts with missing-file/empty-variable cases."
  },
  'qz-devops-055': {
    q: "Team is choosing infrastructure management tooling. Which statements are correct about Terraform and Ansible? (Choose 2)",
    options: [
      "Terraform (IaC tool - infrastructure as code) is about declarative infrastructure resources (VMs, VPCs, DBs) and uses state to know what has been created, computing changes (plan)",
      "Ansible is about configuring/software on servers (installing packages, editing config files) via playbooks, usually push-based over SSH, agentless",
      "Terraform and Ansible are the same tool, just different names",
      "Ansible keeps a mandatory state file like Terraform to track cloud resources created",
      "Terraform fully replaces the need to configure the OS inside servers in every case"
    ],
    explain: "**Summary:** Terraform is strong at **creating/managing infrastructure** (provisioning) via declarative model + state + plan. Ansible is strong at **server configuration** and task automation via playbooks, usually agentless over SSH. The two are often used together.\n\n### Easy comparison\n- **Terraform**: you declare \"I want 2 EC2, 1 RDS, 1 VPC\". Terraform compares desired state with **state** (known state) and real infrastructure, then produces a plan: create/modify/delete. Fits cloud resources with a lifecycle (create/update/destroy).\n- **Ansible**: you write a playbook \"install Java 21, copy config file, restart service\" run against machines over SSH. Ansible needs no agent on target machines (agentless). Many modules aim for desired state (idempotent - re-running does not break things).\n\n~~~text\nTerraform:  [HCL code] -> plan -> create VPC/EC2/RDS\nAnsible:    [playbook] -> SSH  -> install Java, configure app on EC2\n~~~\n\n### Why the others are wrong\n- **Same tool different name**: completely different goals and mechanisms.\n- **Ansible keeps mandatory state file like Terraform**: Ansible does not use a state file the same way Terraform tracks cloud resources.\n- **Terraform fully replaces OS config**: Terraform can invoke provisioners/user-data, but detailed OS configuration is usually Ansible/cloud-init; forcing it into Terraform becomes hard to maintain.\n\n> Senior tip: Common boundary: use Terraform to create EC2, use Ansible (or Packer-baked image + user-data) to configure inside. Avoid stuffing complex configuration logic into Terraform provisioners."
  },
  'qz-devops-056': {
    q: "Payment service processes transactions that are not idempotent (running twice could charge twice). Team wants to release a new version with low risk and gradually shift traffic. Which deployment strategy fits best?",
    options: [
      "Recreate: stop all old version then start new, fast and simple",
      "Canary: send a small fraction of traffic to the new version, observe errors/metrics, then increase gradually if stable",
      "Push 100% traffic to the new version at midnight when few users",
      "Testing on developer machine is enough, no deployment strategy needed"
    ],
    explain: "**Summary:** Canary releases the new version to a small percentage of users first (e.g. 5%), observes metrics/errors/logs, then increases or rolls back. For sensitive systems like payments, this reduces blast radius.\n\n### Main strategies\n- **Recreate**: downtime, no two versions running side by side. Fits when two versions cannot run together, but risk is high.\n- **Rolling update**: gradually replaces Pods, usually zero downtime, but still exposes the new version in waves; needs app compatibility for running versions side by side.\n- **Blue/Green**: two environments (old/new), switch traffic at once. Fast rollback, but switching 100% is still a big step and temporarily doubles resources.\n- **Canary**: small traffic share -> observe -> increase. Needs good metrics (error rate, latency, business metric like duplicate-charge rate).\n\n~~~text\nv1 v1 v1 v1 v1  (100%)\nv1 v1 v1 v1 v2  (20% canary) -> OK? -> 50% -> 100%\n~~~\n\n### Why the others are wrong\n- **Recreate**: downtime and risk to the whole system.\n- **Push 100% at midnight**: still big-bang; payment errors can hit real transactions.\n- **Only local test**: production differs from local (data, traffic, integrations).\n\n> Senior tip: For payments, canary must track both technical and business metrics (duplicate charge rate, failure rate). Ensure idempotency (idempotency key) so deploy/rollback/retry are safer."
  },
  'qz-devops-057': {
    q: "You write a Prometheus alert (monitoring system: collects time-series metrics). Need to pick the right metric type. Which statements are correct? (Choose 2)",
    options: [
      "Counter (counter) only increases (or resets to 0 on process restart); use {{rate()}} to compute per-second rate, e.g. failed requests/sec",
      "Gauge (gauge) is a value that can go up or down at the moment of measurement, e.g. open connections or current heap usage",
      "Histogram stores a single exact current value and is not used to compute p95/p99",
      "Counter is best for storing current CPU temperature because temperature always increases",
      "Gauge should use {{rate()}} like Counter because gauge values always only increase"
    ],
    explain: "**Summary:** Counter = only increases, measures \"how many have happened\", usually used with {{rate()/increase()}}. Gauge = up/down, measures \"what is the current value\". Histogram/Summary are for distributions (latency) and computing percentiles p95/p99.\n\n### Quick selection table\n| Type | Characteristic | Example | Common query |\n|---|---|---|---|\n| Counter | Only increases (reset on restart) | {{http_requests_total}}, {{errors_total}} | {{rate(errors_total[5m])}} |\n| Gauge | Up/down | {{jvm_memory_used_bytes}}, {{connections_active}} | use directly, {{avg_over_time}} |\n| Histogram | Counts into buckets, has {{_sum}}, {{_count}} | {{http_request_duration_seconds_bucket}} | {{histogram_quantile(0.95, rate(...[5m]))}} |\n| Summary | Computes quantiles on client | latency quantile | be careful aggregating across instances |\n\n### Why the others are wrong\n- **Histogram not used to compute p95/p99**: the opposite - histogram creates buckets to compute {{histogram_quantile}} (p95/p99) on the server.\n- **Counter for CPU temperature**: temperature goes up and down -> must use Gauge.\n- **Gauge uses rate() because it always increases**: gauge can decrease; using {{rate()}} on a gauge gives misleading meaning.\n\n> Senior tip: Error alerts usually rely on {{rate(counter)}} or error rate, not on a counter that just keeps increasing. For latency, choose histogram buckets matching the SLO (e.g. 0.1s, 0.3s, 1s)."
  },
  'qz-devops-058': {
    q: "A Service of type ClusterIP named {{orders}} in namespace {{shop}} selects Pods with label {{app: orders}} on port 8080. Pod is Ready, but the Service routes no traffic to any Pod. What is the most common configuration cause?",
    options: [
      "Service selector does not match Pod labels (e.g. selector {{app: order}} missing an s)",
      "ClusterIP always blocks internal traffic, so must switch to LoadBalancer",
      "Pod missing {{prometheus.io/scrape}} annotation, so Service does not see the Pod",
      "Service only works when Pod runs on the same node"
    ],
    explain: "**Summary:** Service uses a **label selector** to find backend Pods. If the selector does not match Pod labels, the endpoints list is empty and no traffic is forwarded to Pods even though they are running.\n\n### Mechanism\n~~~text\nService (selector: app=orders)\n        |  label match?\n        v\nPod labels: app=orders  -> added to Endpoints -> receives traffic\nPod labels: app=order   -> NO match  -> ignored\n~~~\n- Kubernetes creates an Endpoints/EndpointSlice object containing IPs of Pods matching the selector and meeting conditions (usually Ready).\n- Check with: {{kubectl get svc orders -n shop}}, {{kubectl get endpoints orders -n shop}}, {{kubectl get pods -n shop --show-labels}}.\n\n~~~yaml\napiVersion: v1\nkind: Service\nmetadata: { name: orders, namespace: shop }\nspec:\n  selector:\n    app: orders      # must exactly match Pod label\n  ports:\n    - port: 80\n      targetPort: 8080\n~~~\n\n### Why the others are wrong\n- **ClusterIP blocks internal traffic**: ClusterIP is for internal cluster calls; not the cause of empty endpoints.\n- **Missing Prometheus annotation**: annotation is for metric scraping, does not affect Service routing.\n- **Only works on same node**: Service routes via kube-proxy/CNI across the whole cluster, not limited to same node.\n\n> Senior tip: Label mismatch is very common when copying YAML. Besides selector, check {{targetPort}} matches the port the container listens on and that the Pod is Ready (readinessProbe)."
  },
  'qz-aws-023': {
    q: "You want {{api.example.com}} to point to an Application Load Balancer (ALB - application-layer load balancer) on AWS. Which Route 53 (AWS DNS service) record type is most appropriate?",
    options: [
      "CNAME record pointing directly to the ALB DNS name at the zone apex ({{example.com}})",
      "A record pointing to a static IP of the ALB",
      "MX record to route HTTP to the ALB",
      "Alias A (or AAAA) record pointing to the ALB; Alias is a Route 53 feature allowing a domain to point to an AWS resource without a fixed IP"
    ],
    explain: "**Summary:** Use an **Alias record** (type A/AAAA) pointing to the ALB. ALB has no fixed static IP and its DNS name may change behind the scenes; Alias lets Route 53 track the AWS target resource automatically, and it can be used at the zone apex.\n\n### Concepts\n- **DNS (Domain Name System)**: translates names like {{api.example.com}} into addresses machines connect to.\n- **Route 53**: AWS DNS service.\n- **ALB**: HTTP/HTTPS load balancer whose IPs can change on scale/AZ change.\n- **CNAME**: an alias record pointing one name to another. Standard DNS **does not allow** CNAME at zone apex ({{example.com}}), only for subdomains ({{api.example.com}}); and pointing CNAME at some targets has query-cost/trade-off; for AWS resources, Alias is usually better.\n- **Alias** (Route 53 extension): points to ALB, CloudFront, S3 website, API Gateway... Route 53 returns the current IPs of the AWS resource.\n\n~~~text\napi.example.com (Alias A) -> dualstack.my-alb-123.ap-southeast-1.elb.amazonaws.com\nRoute 53 resolves to current ALB IPs\n~~~\n\n### Why the others are wrong\n- **CNAME at zone apex**: invalid per DNS standards; even for subdomains, Alias is the AWS-native better choice for ALB.\n- **A record to static ALB IP**: ALB does not guarantee a static IP; hardcoding IPs breaks when AWS changes them.\n- **MX**: used for mail exchange (email), not HTTP routing.\n\n> Senior tip: Use Alias with CloudFront; CNAME at apex is blocked. Check Route 53 health checks when failover between multiple endpoints is needed."
  },
  'qz-aws-024': {
    q: "A Java application in a private subnet (private network with no public IP directly reachable from the Internet) needs to connect to RDS (relational database service). The Security Group (SG - stateful firewall attached to resources) is blocking the connection. Which two statements are correct? (Choose 2)",
    options: [
      "RDS's SG must allow inbound on the DB port (e.g. 5432 PostgreSQL) from the application's SG, instead of opening 0.0.0.0/0",
      "SG is stateful: if outbound request is allowed, the return response is usually allowed automatically without a separate inbound rule for that response",
      "NACL (Network ACL - stateless firewall at subnet level) automatically allows all traffic if SG allows it",
      "To block a specific IP attacking, SG is the best place because SG supports detailed deny rules",
      "App's SG must have inbound rule opening port 5432 from the Internet to receive data from RDS"
    ],
    explain: "**Summary:** Allow app -> RDS by opening **inbound on RDS's SG** from **app's SG** (source is security group ID). SG is stateful so the response is auto-allowed. NACL is a separate stateless layer; SG has no deny rules.\n\n### Mechanism\n~~~text\n[EC2/ECS app, SG-app]\n      | outbound (usually allowed)\n      v  TCP 5432\n[RDS, SG-rds: inbound 5432 from SG-app]\n      |\n      v response returns automatically (stateful)\n~~~\n- **Stateful (SG)**: remembers the connection; return traffic is allowed.\n- **Stateless (NACL)**: checks each direction independently; needs matching outbound/inbound rules for both request and response (ephemeral ports).\n- **SG** has only allow rules, no deny rules. To deny a specific IP at subnet level, use NACL deny.\n\n### Why the others are wrong\n- **NACL auto-allows if SG allows**: NACL evaluates independently; if NACL blocks, traffic is blocked even if SG allows.\n- **Use SG to deny attacking IP**: SG does not support deny; use NACL, AWS WAF (web layer), or block at app/CDN layer.\n- **App SG must inbound 5432 from Internet**: app initiates the connection to RDS; no need to open 5432 from Internet into app.\n\n> Senior tip: SG-to-SG reference (source = sg-id) is safer than CIDR because instance IPs change. Check SG, NACL, route table, and DNS when debugging DB connectivity."
  },
  'qz-aws-025': {
    q: "You need to copy objects (files) from an S3 bucket (object storage) in region A to a bucket in region B for backup. Which condition/step is required for S3 Replication to work?",
    options: [
      "Just having two buckets with the same name makes replication run automatically",
      "Enable Versioning on both source and destination buckets, and configure a Replication rule with an IAM role having appropriate read/write permissions",
      "Disable encryption on both buckets because replication does not support encrypted objects",
      "Replication only copies objects uploaded before the rule was enabled, no further config needed"
    ],
    explain: "**Summary:** S3 Replication (CRR/SRR) requires **Versioning enabled on both source and destination**, a replication rule (with optional prefix/tag filter), and an IAM role for S3 to perform the copy. By default it applies to **new** objects after enabling.\n\n### How it works\n1. You upload a new object to the source bucket (versioning creates a version ID).\n2. S3 reads the replication rule: which destination bucket, any prefix/tag filter.\n3. S3 uses the IAM role to copy the object (and optionally metadata, tags, ACL depending on config) to the destination bucket.\n4. Objects that existed before the rule was enabled are **not** automatically copied; use S3 Batch Replication to copy old data.\n\n~~~text\nBucket A (ap-southeast-1, versioning ON)\n   -- replication rule + IAM role -->\nBucket B (us-east-1, versioning ON)\n~~~\n\n### Why the others are wrong\n- **Same bucket name auto-runs**: S3 bucket names are globally unique, cannot be duplicated; replication must be configured explicitly.\n- **Disable encryption**: replication supports encrypted objects (SSE-S3, SSE-KMS) but requires proper KMS permissions.\n- **Only copies old objects**: by default it is new objects; old objects need Batch Replication.\n\n> Senior tip: Enable \"Delete marker replication\" only if you understand the impact. Check KMS permissions if buckets use SSE-KMS. Replication is asynchronous - has latency, not an immediate consistency mechanism."
  },
  'qz-aws-026': {
    q: "Company needs to connect on-premises data center with a VPC on AWS. Comparing Site-to-Site VPN and Direct Connect (DX), which statements are correct? (Choose 2)",
    options: [
      "Site-to-Site VPN creates an encrypted tunnel over the Internet (usually via Virtual Private Gateway/Transit Gateway), deploys faster but bandwidth/latency depend on the Internet",
      "Direct Connect is a dedicated physical network connection to AWS, usually more stable with higher bandwidth, but deployment time and cost are usually larger than VPN",
      "Direct Connect automatically encrypts all data without extra config, so it always replaces VPN",
      "Site-to-Site VPN cannot be used with Transit Gateway",
      "VPN always has lower latency and is more stable than Direct Connect because it uses the global Internet"
    ],
    explain: "**Summary:** **VPN**: encrypted over the Internet, fast to set up, fits starting/backup, quality depends on Internet. **Direct Connect**: dedicated physical link, stable/high bandwidth, takes longer to deploy. Many systems use DX as primary + VPN as backup.\n\n### Comparison\n| Criterion | Site-to-Site VPN | Direct Connect |\n|---|---|---|\n| Path | Over public Internet (IPsec encrypted) | Dedicated link to AWS |\n| Deployment | Fast (minutes/hours) | Slower (port order, partner) |\n| Latency/stability | Depends on Internet | Usually more stable |\n| Bandwidth | Limited by tunnel/device | Can be very high (Gbps+) |\n| Encryption | Yes (IPsec) | Pure DX does not auto-encrypt; use VPN over DX if needed |\n\n~~~text\nOn-prem --Internet(IPsec)--> VGW/TGW  (VPN)\nOn-prem --dedicated link--> DX location --> AWS  (Direct Connect)\n~~~\n\n### Why the others are wrong\n- **DX auto-encrypts so always replaces VPN**: pure DX does not encrypt; can run MACsec/VPN over DX if encryption needed.\n- **VPN cannot be used with Transit Gateway**: it can.\n- **VPN always lower latency/more stable than DX**: the opposite in most large production cases.\n\n> Senior tip: Choose by SLA, bandwidth, data sensitivity, and budget. Design HA: 2 VPN tunnels, or DX + VPN failover."
  },
  'qz-aws-027': {
    q: "A company has 12 VPCs (virtual private networks) and one on-premises network. Currently VPCs connect in a mesh via VPC Peering (direct pairwise VPC connections). Complexity grows fast. Which AWS service simplifies the hub-and-spoke connection model?",
    options: [
      "NAT Gateway: lets private subnets reach the Internet, not used to connect many VPCs together",
      "Internet Gateway: gateway in/out of the Internet for a VPC",
      "AWS Transit Gateway: central router to connect many VPCs and on-premises networks in hub-and-spoke model",
      "S3 Gateway Endpoint: private connection from VPC to S3, does not route between VPCs"
    ],
    explain: "**Summary:** **Transit Gateway (TGW)** acts as central hub: VPCs and on-premises connections (VPN/DX) attach to TGW. Instead of N*(N-1)/2 peering links, you manage routes centrally.\n\n### Why needed\n- **VPC Peering**: 1-1 connection between two VPCs, non-transitive. Full mesh of 12 VPCs needs 66 peering links - hard to manage routes/security.\n- **Transit Gateway**: each VPC attaches to TGW; TGW route tables decide which VPC talks to which VPC/on-prem.\n\n~~~text\nVPC-A --\\\nVPC-B --- TGW --- On-prem (VPN/DX)\nVPC-C --/\n~~~\n\n### Why the others are wrong\n- **NAT Gateway**: lets instances in private subnet call out to Internet (outbound), not inter-VPC/on-prem connectivity.\n- **Internet Gateway**: attached to a VPC for Internet access, does not solve VPC mesh.\n- **S3 Gateway Endpoint**: internal endpoint for S3/DynamoDB inside a VPC, not a central router.\n\n> Senior tip: TGW charges per attachment and data processed. Design TGW route tables carefully to isolate environments (prod should not route to dev unless needed). Combine with RAM to share TGW across accounts."
  },
  'qz-aws-028': {
    q: "An application running on multiple EC2 instances (virtual machines) across multiple Availability Zones (AZ - isolated data centers within a region) needs to read/write a shared file directory over NFS (network file sharing protocol). Which AWS storage service fits best?",
    options: [
      "Amazon EBS gp3: block volume attached to one EC2 at a time/AZ (except special multi-attach cases), not a typical multi-instance NFS file share",
      "Amazon S3: object storage over HTTP API, not a direct NFS-mounted filesystem like a traditional POSIX directory",
      "Instance Store: temporary physical disk, data lost on stop/terminate, not shared",
      "Amazon EFS: managed NFS file system, can be mounted concurrently from multiple EC2/multi-AZ"
    ],
    explain: "**Summary:** **Amazon EFS** (Elastic File System) provides an NFS file system mountable by multiple EC2/containers at once, fitting multi-instance/multi-AZ shared files. EBS is block storage usually attached to 1 instance; S3 is object storage.\n\n### Storage selection\n| Need | Service | Remember |\n|---|---|---|\n| Disk for OS/DB of one instance | EBS | Block, like a hard drive, usually 1 EC2/AZ |\n| NFS shared file across many instances | EFS | File system, concurrent mount |\n| Windows/SMB files | FSx for Windows | SMB protocol |\n| Store objects (images, backup, logs) | S3 | HTTP API, not full NFS POSIX mount |\n| Cache/temp, very fast, lost on stop | Instance Store | Ephemeral |\n\n~~~bash\n# On EC2 (Linux), mount EFS over NFS\nsudo mount -t efs fs-12345678:/ /mnt/shared\n~~~\n\n### Why the others are wrong\n- **EBS gp3**: block storage, low latency for one machine; not the default multi-machine NFS sharing solution.\n- **S3**: accessed via SDK/API (PutObject/GetObject), not equivalent to an NFS directory for legacy apps needing POSIX file locks/semantics (except special solutions).\n- **Instance Store**: temporary data, lost when instance stops/host fails.\n\n> Senior tip: EFS charges by capacity/throughput mode; consider EFS IA (Infrequent Access) for rarely accessed files. Check NFS security group (2049) and mount targets in each AZ."
  },
  'qz-aws-029': {
    q: "A Java worker reads messages from Amazon SQS (message queue). Processing one message takes 90 seconds, but Visibility Timeout (time a message stays hidden after a consumer receives it) is set to 30 seconds. Which two problems/handlings are correct? (Choose 2)",
    options: [
      "Message may reappear on the queue after 30 seconds and be received by another worker, causing duplicate processing if the first worker is not done",
      "Increase Visibility Timeout (or use ChangeMessageVisibility to extend periodically while processing) to cover processing time",
      "Visibility Timeout should be set lower than processing time to speed up the queue",
      "SQS FIFO automatically removes all duplicate messages without the app needing idempotent handling",
      "When a worker deletes the message before finishing processing, the message safely returns if the worker crashes"
    ],
    explain: "**Summary:** When a consumer receives a message, SQS hides it for **Visibility Timeout**. If the timeout expires before the message is deleted, it reappears and another consumer may receive it -> duplicate processing. Timeout must be **greater** than processing time (or extended).\n\n### Mechanism\n~~~text\nt=0s   Worker A receives message (ReceiveMessage)\n       SQS hides message for 30s\nt=30s  A still processing (needs 90s) but timeout expires\n       -> message reappears\nt=31s  Worker B receives SAME message -> duplicate processing\n~~~\nCorrect approaches:\n- Set Visibility Timeout > max processing time (with buffer), or\n- Worker A calls {{ChangeMessageVisibility}} (heartbeat extension) while still processing.\n\n~~~text\nProcessing succeeds -> DeleteMessage (remove from queue)\nProcessing fails     -> let message reappear (or send to DLQ after maxReceiveCount)\n~~~\n\n### Why the others are wrong\n- **Timeout lower than processing time to speed up**: causes duplicate processing, very dangerous for business like charging/creating orders.\n- **SQS FIFO auto-removes all duplicates**: FIFO has deduplication by MessageDeduplicationId within a 5-minute window plus ordering, but does not replace end-to-end idempotent app design.\n- **Delete before finish is safe on crash**: the opposite - deleting before finishing and then crashing **loses** the message.\n\n> Senior tip: Safe principle: only DeleteMessage after processing succeeds; design consumer idempotent; use DLQ (Dead Letter Queue) with {{maxReceiveCount}} for repeatedly failing messages. Monitor {{ApproximateAgeOfOldestMessage}} and DLQ message count."
  },
  'qz-devops-059': {
    q: "Backend Pod returns 502 through Ingress. kubectl get endpoints backend shows empty endpoints, readiness probe fails. Choose the reasonable causes (Choose 2)",
    options: [
      "Readiness probe wrong port/path so pod not Ready",
      "Service selector does not match Pod labels",
      "Ingress backend servicePort wrong (targetPort)",
      "CPU limit too low causing pod kill",
      "Pod Running but container not listening on port"
    ],
    explain: "**Summary:** Empty endpoints means Service selected no Pods (selector mismatch) or Pods not Ready (readiness fail). Ingress 502 usually because no Ready endpoint exists.\n\n### Why the others are wrong\n- Ingress backend port wrong usually gives 502/503 but endpoints still exist (Service has ready pods); here endpoints are empty, so not the main cause.\n- Low CPU limit causes throttling/OOM, not empty endpoints.\n- Pod Running but not listening on port is a readiness failure (already covered by readiness).\n\n> Senior tip: debug: kubectl get ep, describe pod events, check readiness httpGet path/port; ensure targetPort matches containerPort."
  },
  'qz-devops-060': {
    q: "ConfigMap updated via kubectl apply, but pod still uses old values. Which command makes pod pick up new config?",
    options: [
      "kubectl rollout restart deployment/<name>",
      "kubectl apply -f configmap.yaml again",
      "Wait for kubelet to auto-refresh (do nothing)",
      "kubectl delete pod to recreate"
    ],
    explain: "**Summary:** A ConfigMap mounted as a volume is synced by kubelet periodically (~1 minute), but env vars from ConfigMap are injected only at pod start. Standard way: rollout restart deployment to recreate pods with new config.\n\n### Why the others are wrong\n- Re-applying ConfigMap does not auto-restart pods.\n- Kubelet volume sync has delay and does not apply env.\n- Deleting pod manually works but is not managed; rollout restart is safer.\n\n> Senior tip: Use checksum annotation in pod template to auto-rollout when config changes; or mount files and reload in app."
  },
  'qz-devops-061': {
    q: "Java app takes 90s to start (Spring Boot). Readiness probe initialDelaySeconds=10, periodSeconds=5, failureThreshold=3. Result?",
    options: [
      "Pod gets killed/restarted because readiness fails continuously during startup",
      "Pod becomes Ready right after 10s",
      "Probe automatically waits until app is ready",
      "Liveness kills pod after 90s"
    ],
    explain: "**Summary:** Readiness probe starts after 10s and fails repeatedly -> pod not Ready; if there is a similar liveness probe, the pod gets restarted. Use startupProbe for slow-starting apps.\n\n### Why the others are wrong\n- Not Ready right after 10s because app not listening yet.\n- Probe does not auto-wait; need startupProbe or large enough initialDelaySeconds.\n- Liveness only kills if probe fails; without liveness, no kill.\n\n> Senior tip: Use startupProbe with high failureThreshold (e.g. 30 x 10s) to cover startup time; readiness only checks after startup passes."
  },
  'qz-devops-062': {
    q: "Rolling update Deployment with maxUnavailable=1, replicas=3. Minimum number of pods available during update?",
    options: ["1", "2", "3", "0"],
    explain: "**Summary:** maxUnavailable=1 means at any time no more than 1 pod is unavailable relative to desired (3), so at least 2 pods remain available.\n\n### Why the others are wrong\n- 1 is the max unavailable count, not available.\n- 3 only when maxUnavailable=0 (no downtime allowed).\n- 0 is not reasonable while updating.\n\n> Senior tip: Combine with maxSurge to speed up; use backward-compatible DB migrations for zero-downtime."
  },
  'qz-devops-063': {
    q: "When draining a node, PodDisruptionBudget minAvailable=2 with 3 replicas. Result of drain?",
    options: [
      "Only 1 pod evicted, drain blocked until another node is available",
      "Evict all 3 pods",
      "Drain succeeds immediately",
      "PDB is ignored"
    ],
    explain: "**Summary:** PDB minAvailable=2 means do not evict if available count < 2. With 3 replicas only 1 pod can be evicted; drain waits for pod to be rescheduled elsewhere.\n\n### Why the others are wrong\n- Evicting all violates PDB.\n- Immediate drain only if PDB allows.\n- PDB is not ignored (except with force).\n\n> Senior tip: Set PDB for critical workloads; drain node with --ignore-daemonsets --delete-emptydir-data; monitor disruption."
  },
  'qz-devops-064': {
    q: "PVC Pending with storageClassName that does not exist and no default StorageClass. Cause?",
    options: [
      "No matching StorageClass / WaitForFirstConsumer",
      "Node not enough CPU",
      "Image pull fail",
      "RBAC missing permission"
    ],
    explain: "**Summary:** PVC Pending usually due to no matching StorageClass or WaitForFirstConsumer waiting for pod schedule. Check kubectl get sc, kubectl describe pvc.\n\n### Why the others are wrong\n- Insufficient CPU makes pod Pending, not PVC.\n- Image pull fail makes pod ErrImagePull.\n- Missing RBAC makes forbidden, not PVC pending.\n\n> Senior tip: Set default StorageClass; use WaitForFirstConsumer for topology-aware provisioning; check provisioner logs."
  },
  'qz-devops-065': {
    q: "RoleBinding in namespace team-a binds to ClusterRole pod-reader. Effect of permissions? (Choose 2)",
    options: [
      "Read pods only in namespace team-a",
      "Read pods in all namespaces",
      "Has cluster-scoped permissions (node, PV)",
      "RoleBinding only effective in namespace team-a"
    ],
    explain: "**Summary:** RoleBinding is always limited to its namespace, even if ClusterRole contains cluster-wide permissions; cluster-scoped permissions in ClusterRole are ignored when bound via RoleBinding.\n\n### Why the others are wrong\n- Reading pods in all namespaces needs ClusterRoleBinding.\n- Cluster-scoped permissions (node/PV) only via ClusterRoleBinding.\n\n> Senior tip: Pattern: ClusterRole defines permissions, RoleBinding grants within a namespace; ClusterRoleBinding grants cluster-wide. Least privilege."
  },
  'qz-devops-066': {
    q: "Pod is OOMKilled. Cause and difference from CPU throttling?",
    options: [
      "Exceeding memory limit -> kernel kills; exceeding CPU limit only throttles, does not kill",
      "Exceeding CPU limit -> kill",
      "OOMKilled due to GC pause",
      "CPU throttling also kills pod"
    ],
    explain: "**Summary:** Memory is a hard limit: exceeding it -> OOMKilled. CPU is a soft limit (throttling), does not kill pod. Set requests/limits reasonably and monitor usage.\n\n### Why the others are wrong\n- CPU limit does not kill.\n- GC pause does not directly OOM (may cause OOM if heap too large).\n- CPU throttling does not kill.\n\n> Senior tip: Java heap should be < container memory limit (leave room for metaspace/threads); use -XX:MaxRAMPercentage. Monitor throttling via container_cpu_cfs_throttled_seconds."
  },
  'qz-devops-067': {
    q: "Patroni failover: primary down. JDBC URL uses targetServerType=primary with multiple hosts. What will client do?",
    options: [
      "Try each host, connect to the new primary after failover",
      "Always connect to first host",
      "Fail immediately if first host is down",
      "Need to restart app"
    ],
    explain: "**Summary:** PostgreSQL JDBC multi-host with targetServerType=primary iterates hosts and picks the host that is primary (after Patroni promote). No app restart needed if retry/reconnect works.\n\n### Why the others are wrong\n- Not only first host; driver tries the list.\n- Does not fail immediately if retry exists.\n- App does not need restart if connection pool reconnects.\n\n> Senior tip: Set loadBalanceHosts=false, connectTimeout, socketTimeout; use HikariCP + validation query; Patroni DCS (etcd/consul) ensures single primary."
  },
  'qz-devops-068': {
    q: "Quorum in an N-node cluster. Minimum odd number of nodes to tolerate f failures?",
    options: ["2f+1", "f+1", "2f", "f"],
    explain: "**Summary:** Quorum needs majority: N >= 2f+1 to tolerate f failures (e.g. 3 nodes tolerate 1 failure, 5 nodes tolerate 2).\n\n### Why the others are wrong\n- f+1 is not enough majority in many cases.\n- 2f is one short.\n- f is too few.\n\n> Senior tip: Always use odd node count for etcd/consul/ZK; use witness node for 2-site; avoid split-brain."
  },
  'qz-devops-069': {
    q: "Redis Sentinel: client connects to sentinel. When master fails over, how does client find the new master?",
    options: [
      "Sentinel notifies new master; client subscribes + queries sentinel",
      "Client scans all nodes itself",
      "Need to restart client",
      "Slave auto-promotes and client learns via DNS"
    ],
    explain: "**Summary:** Sentinel monitors, elects new master, and notifies via pub/sub + command SENTINEL get-master-addr-by-name. Client with Sentinel support (Jedis/Lettuce) updates automatically.\n\n### Why the others are wrong\n- Client does not scan itself.\n- No restart needed if client supports Sentinel.\n- DNS is not the main mechanism.\n\n> Senior tip: Use Lettuce with Sentinel config; set readFrom REPLICA for read scaling; note: failover has short downtime."
  }
});
