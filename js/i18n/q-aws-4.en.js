/*
 * English translation of js/data/q-aws.js — task T392. Format: js/core/i18n.js (content overlay).
 * ids: aws-023 aws-024 aws-025 aws-026 aws-027
 */
App.i18n.content({
  'aws-023': {
    q: 'Region, Availability Zone, and edge location: how do they differ? If most users are in Vietnam, which region would you choose, what criteria apply, and which services are global vs. regional?',
    a: `**Summary:** A **region** is a geographic area (e.g., Singapore) containing multiple **Availability Zones (AZs)**; each AZ is one or more independent datacenters with its own power, cooling, and network. An **edge location** is a network point for the CDN, placed closer to users to serve static content quickly. EC2, RDS, ECS, Lambda, S3 buckets, etc., are tied to a region; IAM, Route 53, and CloudFront are global services. For users in Vietnam, the default choice is **ap-southeast-1 (Singapore)**, with ap-southeast-3 (Jakarta) or ap-east-1 (Hong Kong) as alternatives based on cost, real latency measurements, and required service availability.

### Quick Understanding
Think of a **region** as a city, and **AZs** as buildings within that city: each building has its own power and network, so if one building burns down, the others continue running, but the whole city could still lose power. An **edge location** is like a small delivery kiosk spread everywhere: popular items (images, JS, CSS) are kept nearby, while unique items still come from the main warehouse (the region). **Global services** are like a nationwide switchboard: you don't choose "which city's switchboard," whereas **regional services** are like hospitals: you must choose the right city to get treatment.

### Terminology
- **Region**: Independent geographic area, e.g., {{ap-southeast-1}} is Singapore, {{us-east-1}} is North Virginia.
- **AZ**: Independent datacenter(s) within a region, named like {{ap-southeast-1a}}; distance between AZs in the same region is typically a few to tens of kilometers.
- **AZ ID**: Stable identifier for a physical AZ (e.g., {{apse1-az2}}). Names like {{a/b/c}} are randomly assigned per AWS account, so your "AZ a" might be your colleague's "AZ c".
- **Edge location / POP**: CloudFront points of presence; not where you run EC2.
- **Regional service**: Resources reside fixedly in one region and do not spontaneously appear in others.
- **Global service**: Data/configuration shared globally; region selection isn't required during creation.
- **Data transfer**: Fees for transmitting data out to the Internet or between AZs/regions; often overlooked in cost estimation.

### Step-by-Step Mechanism: A request from Hanoi to a Spring Boot service on ECS
1. User opens {{https://api.example.com/orders}}. Browser queries DNS; **Route 53** (global) answers. If named as an alias pointing to CloudFront, CloudFront's DNS returns the IP of the edge closest to the user's resolver (usually an edge in Vietnam or Singapore).
2. **CloudFront** handles TLS at the edge, checks cache. Static images/CSS/JS can be served immediately at the edge. Why: reduces transmission path from ~30–50 ms (Hanoi → Singapore) to a few ms.
3. On cache miss, CloudFront calls the **origin**, which is the ALB placed in {{ap-southeast-1}}. The Hanoi → Singapore leg still occurs; this is the floor latency for dynamic APIs.
4. **ALB** resides in 2–3 AZs; its DNS returns multiple IPs. The request hits one AZ, ALB forwards it to a target (ECS task or EC2) in the **target group**. ALB has cross-zone enabled by default, so a request hitting AZ-a can be forwarded to a target in AZ-b — better load distribution, at the cost of one extra hop between AZs.
5. The task calls **RDS primary**. If primary is in another AZ in the same region, latency adds ~0.5–2 ms per round-trip; multiplied by 20 N+1 queries, that's 10–40 ms — noticeable in p99.
6. The task writes **S3**: Bucket belongs to one region. Writing from another region is both slower and incurs data transfer fees outside the region.

### Which services are global vs. regional
| Scope | Services | Note |
|---|---|---|
| Global | IAM, STS, Route 53, CloudFront, Organizations, WAF on CloudFront | Created once, used in all regions; but IAM data is global, so permission bugs affect everything |
| Regional | EC2, EBS, ECS, EKS, Lambda, RDS/Aurora, ElastiCache, SQS, SNS, Kinesis, KMS keys, Secrets Manager | Must be recreated in DR regions if desired |
| Regional + global namespace | S3 | Bucket name is globally unique, but data resides in your chosen region and is **not** automatically replicated |
| Regional (special) | ACM certificate | Cert for ALB must be in the same region as the ALB; cert for CloudFront must be in {{us-east-1}} |

### Choosing a region for Vietnam users
1. **Measure real latency**, don't guess: use {{curl}} with {{-w}} to print time_connect to health check endpoints for each region, or CloudWatch RUM from real machines on various networks (Viettel, VNPT, FPT, 4G). From Vietnam, Singapore is usually lowest, followed by Hong Kong, Tokyo, Jakarta; results vary by ISP and cable routes.
2. **Service availability**: not every region has every instance family or latest service feature. Large regions like {{us-east-1}} get features first; smaller ones may lag by months.
3. **Cost**: identical configurations can differ by 5–20% between regions; Singapore is usually costlier than North Virginia. However, saving a few USD/month at the cost of 20 ms p99 latency is the wrong trade-off for interactive APIs.
4. **Compliance and client contracts**: is personal data allowed to leave Vietnam? Do enterprise clients require data stored locally?
5. **DR**: if multi-region is needed, choose a region pair with equivalent services and stable interconnect; greater distance increases async replication lag.

For a small team with a single environment, place everything in one region and spread across **at least 2 AZs**; multi-region is a separate, much costlier challenge.

### Common pitfalls
- **Following {{us-east-1}} default tutorials.** Symptom: API p50 from Vietnam is 200 ms even though the server is "healthy." How to avoid: verify region for all resources before creation; set default region in AWS CLI profile and CI.
- **Running production in a single AZ.** Symptom: an AZ issue kills the service even though the region is alive. How to avoid: ALB with subnets in at least 2 AZs, ECS service spread across 2 AZs, RDS Multi-AZ.
- **Thinking S3 is global and thus auto-replicated.** Symptom: main region fails, bucket in backup region is empty because replication was never enabled. How to avoid: understand buckets belong to a region; need DR? Enable Cross-Region Replication or AWS Backup.
- **Hard-coding regions in code.** Symptom: deployment to a backup region fails because app calls the old region. How to avoid: read region from environment variables or SDK credential/region provider chain, don't write {{Region.AP_SOUTHEAST_1}} (SDK v2) everywhere.
- **Ignoring cross-AZ transfer fees.** Symptom: chatty microservices calling each other 5,000 requests/second between AZs, data transfer bill increases by hundreds of USD. How to avoid: monitor data transfer metrics, reduce chatty behavior, use the same AZ when sensible, or accept the availability trade-off.

### One-minute pitch
"A region is a geographic area containing multiple independent AZs, while an edge location is closer to users for CDN. Most daily services like EC2, ECS, RDS, Lambda, and S3 buckets are region-bound, while IAM, Route 53, and CloudFront are global. For users in Vietnam, I default to Singapore based on real latency measurements, pricing, service availability, and compliance. Production always spans at least two AZs; multi-region is only for RTO/RPO requirements. I also remember ACM certs for ALB must be regional, and use AZ IDs instead of a/b/c names when cross-referencing between AWS accounts."

> Senior tip: don't trust the feeling that "Singapore is fastest" — measure it using CloudWatch RUM or scripts from multiple ISPs, as cable routes and ISPs change. When doing multi-AZ, use **AZ IDs** in documentation and dashboards: a/b/c names are mapped randomly per account, so two accounts saying "AZ a" might be running in two totally different buildings, causing you to draw wrong incident diagrams.`,
    follow: ["Why are a/b/c AZ names not used for cross-referencing between AWS accounts?", "An API runs in Singapore but users in Vietnam complain of slowness: where do you measure and improve?", "When is multi-region needed instead of just multi-AZ?"]
  },
  'aws-024': {
    q: 'A Spring Boot service runs on EC2: how do you choose the instance family and size, do you use EBS or instance store, what purchase option is best for cost optimization, and how do you access the server securely?',
    a: `**Summary:** Choose an **instance family** based on the workload shape (compute, memory, general purpose) and the **size** based on real measurements (p95 CPU, RSS, heap) rather than intuition. Use **EBS** (gp3) for persistent data; use instance store only for temporary cache. Purchase **Savings Plans** for 24/7 steady-state workloads, and **Spot** instances for fault-tolerant batch processing. Access the server via **SSM Session Manager** — never open port 22 or maintain key pairs.

### Quick Understanding
Renting an EC2 instance is like renting a vehicle: the **family** is the vehicle type (light truck, 16-seater, heavy truck), the **size** is the capacity, and the **generation** is the model year (higher numbers usually perform better for the same cost). **EBS** is like an external hard drive: if the vehicle breaks down, you move the drive to another vehicle and your data is safe. **Instance store** is like a built-in glove compartment: fast but wiped if the vehicle is stopped/started or hardware fails; only use it for cache. **Savings Plan** is like a monthly subscription, while **Spot** is like standby tickets: much cheaper but the airline can cancel/rebook your flight with short notice.

### Terminology
- **vCPU**: Virtual CPU; on most Intel/AMD instances, 1 vCPU is one hyperthread, not a physical core.
- **Instance family**: The first letter in the name, e.g., {{t}} burstable, {{m}} general purpose, {{c}} compute, {{r}} memory, {{i}} storage; number is generation ({{m7}} is newer than {{m5}}).
- **Suffix**: {{g}} is Graviton (ARM), {{i}} Intel, {{a}} AMD, {{d}} NVMe local storage, {{n}} network optimized.
- **Burstable / CPU credit**: {{t3}}, {{t4g}} have low baseline CPU and accumulate credits; running continuously above baseline caps CPU or incurs extra charges in unlimited mode.
- **EBS**: Network-attached block storage; data life cycle is independent of the instance.
- **gp3**: Balanced EBS type, defaults to 3,000 IOPS and 125 MB/s, configurable independently.
- **IMDS**: Metadata service at {{169.254.169.254}} for instances to retrieve IAM role credentials.
- **SSM Session Manager**: Shell access over a pre-installed agent, requires no inbound ports, supports session logging.
- **Spot interruption**: AWS reclaims Spot capacity, usually warning 2 minutes ahead via metadata/EventBridge.

### Step-by-Step: From real load to instance size
1. **Measure load**: Requests/second, p95 CPU, RSS (actual memory used), heap after full GC, thread count, DB connections. Don't use average CPU — it hides peaks.
2. **Calculate JVM memory**: heap + Metaspace + code cache + thread stack + direct buffers + OS/agent overhead. A Spring Boot service with 200 threads, 256 MB Metaspace, and 2.5 GB heap typically requires **at least** a 4 GB instance.
3. **Set heap as percentage**: Use {{-XX:MaxRAMPercentage=75}} to leave 25% for OS, page cache, thread stacks, and JNI. For an 8 GB instance, heap should be around 6 GB.
4. **Choose family**: CRUD APIs typically use {{m7g}} or {{t4g}}; compute-intensive tasks (reports, crypto, image processing) use {{c7g}}; large in-memory caches use {{r7g}}.
5. **Choose size**: If p95 heap is 2.5 GB and CPU p95 is 40%, 2 vCPU/8 GB is reasonable; if CPU p95 is 85%, scale vCPU before RAM.
6. **Verify with load testing** (Gatling/k6) at 1.5–2x projected peak load, then monitor for 2 weeks. Right-size periodically using **Compute Optimizer** and CloudWatch data.

### Selecting family by workload
| Family | Workload shape | Typical Use |
|---|---|---|
| t4g / t3 | Low load, occasional peaks | Internal APIs, cron jobs, dev environments |
| m7g / m6i | Balanced CPU and RAM | Most Spring Boot services |
| c7g / c6i | CPU-bound | Reports, pricing, compression, encryption |
| r7g / r6i | High RAM | Caches, large file processing, in-memory sessions |
| i4i | Local NVMe needed | Search indexes, cacheable data |

Graviton ({{g}}) is typically 10–20% cheaper for the same performance, but check native libraries: JDK, Netty, RocksDB, compression libs all have ARM support; older drivers or monitoring agents might not.

### EBS vs instance store
- **EBS gp3** for root volumes and persistent data: incremental snapshots, resizeable online, reattachable to other instances.
- **io2/io1** for high IOPS and high durability (self-managed DBs); **st1/sc1** for high throughput, cheap.
- **Instance store** only for reproducible data: caches, scratch space, temp files. Stop/start or hardware failure clears it.
- Always separate **small root volume** (e.g., 30 GB) and **dedicated data volume** for easier snapshotting and instance replacement.

### Purchase Options
| Option | Discount | Suitable for |
|---|---|---|
| On-Demand | 0% | Experimentation, unpredictable loads |
| Savings Plans (1–3 years) | up to ~66% (Compute SP), ~72% (EC2 Instance SP) | Steady 24/7 workloads; Compute SP applies to Fargate/Lambda too |
| Reserved Instance | up to ~72% | Similar, commit by instance type/region |
| Spot | up to ~90% | Batch, CI runners, stateless workers |

True discounts depend on term and prepayment: 1-year no-upfront usually only yields ~20–30%.
Spot is not for singleton instances, self-managed DBs on a single node, and requires fault-tolerant code: jobs must be idempotent and workers must handle interruption signals.

### Secure Access
Old way: opening port 22 in SG for office IP, keeping {{.pem}} file in repo — risky, key loss, audit-trail nightmare.
Recommended way: attach instance profile with {{AmazonSSMManagedInstanceCore}}. SSM agent is pre-installed on Amazon Linux 2/2023. Instance must reach SSM endpoints (via NAT or VPC endpoints {{ssm}}, {{ssmmessages}}, {{ec2messages}}), then:

~~~bash
aws ssm start-session --target i-0abc123def456 --region ap-southeast-1
# No port 22 needed, no key pair needed.
# Session can be logged to S3/CloudWatch for audit.
~~~

### Common pitfalls
- **Setting {{-Xmx}} to total instance RAM.** Symptom: Java process killed by Linux OOM killer ("Out of memory: Killed process"), log dies without traces. How to avoid: {{MaxRAMPercentage}} 70–75 and measure actual RSS.
- **Running {{t3}}/{{t4g}} for steady CPU load.** Symptom: CPU throttled to baseline in standard mode, or bill explodes in unlimited mode. How to avoid: monitor {{CPUCreditBalance}}, choose {{m}}/{{c}} family for steady loads.
- **Using instance store for persistent data.** Symptom: reboot wipes files, SQS message cache lost. How to avoid: use EBS/S3 for persistent data, instance store for cache only.
- **Running singletons on Spot.** Symptom: instance reclaimed during peak hours, scheduler dies. How to avoid: Spot for stateless workers, On-Demand/Savings Plan for primary services.
- **SSH open to {{0.0.0.0/0}} and key pair in repo.** Symptom: scanned and brute-forced continuously, key leaked means machine compromised. How to avoid: SSM Session Manager, no static long-lived keys, enable GuardDuty.
- **Using old AMIs for years.** Symptom: missing security patches, outdated JDK. How to avoid: golden AMI + periodic pipeline rebuilds, or Systems Manager Patch Manager.

### One-minute pitch
"I right-size instances by measuring real load — CPU p95, RSS, heap, threads — and choose families based on workload shape: m7g for general, c7g for compute, r7g for high RAM. I set JVM heap to 75% of RAM to leave overhead for OS/stack/buffer, and I verify with load tests at 1.5–2x peak load. Persistent data lives on EBS gp3; instance store is for temporary cache only. For steady 24/7 loads, I commit to Savings Plans; for stateless batch workers, I use Spot. I never open port 22; I use SSM Session Manager for secure, audited shell access, and I right-size periodically with Compute Optimizer."

> Senior tip: the biggest savings rarely come from negotiating instance prices, but from **reducing over-provisioned instances**. A 2 vCPU service running at 15% CPU all day is money wasted; merge services, reduce replicas, or move to Fargate/Lambda before committing to a 3-year Savings Plan for an incorrectly sized instance.`,
    follow: ["Why shouldn't you set -Xmx to the full RAM of the instance?", "When choosing Graviton, what risks should you check?", "How do you protect EC2 from unauthorized access without opening port 22?"]
  },
  'aws-025': {
    q: 'You are assigned to deploy the team\'s first Spring Boot service to ECS Fargate behind an ALB. Go step-by-step: where is the image stored, what is declared in the task definition, how do the service and target group connect, and how can a broken deployment automatically rollback?',
    a: `**Summary:** Build the image and push to **ECR**; write a **task definition** (image by tag/digest, CPU/RAM, port 8080, {{awslogs}} log driver, task role, and execution role); create an **ECS service** running N tasks in private subnets, attached to an **target group** (target type {{ip}}) of the ALB; perform rolling updates with {{minimumHealthyPercent}}/{{maximumPercent}} and enable **deployment circuit breaker** with rollback for automatic reversion on failures.

### Quick Understanding
Think of ECS as a **temporary staffing agency**. **ECR** is the uniform warehouse (images). **Task definition** is the job description: what uniform to wear, how much strength is needed (CPU/RAM), which desk to sit at (port), where to log activity (logs), and what keys they hold (IAM role). **Service** is the contract "always have exactly 3 employees on this shift; replace anyone who leaves immediately." **ALB + target group** is the front desk that distributes customers to ready employees. **Fargate** means you don't worry about the office building (EC2 host) — AWS manages the seats.

### Terminology
- **ECR**: AWS private Docker registry, access controlled via IAM.
- **Task definition**: A versioned specification ({{orders-api:12}}) describing the container to run. Edits create new **revisions**, they aren't modified in place.
- **Task**: An instantiated copy of a task definition (like a Pod in Kubernetes).
- **Service**: Maintains desired task count, replaces dead tasks, registers tasks into the target group, orchestrates rolling updates.
- **Execution role**: Permissions for the **ECS agent** (pull image from ECR, read secrets at startup, write logs). **Task role**: Permissions for **your code** (call S3, SQS…).
- **awsvpc**: Mandatory network mode for Fargate — each task has its own ENI and IP in the subnet, so the target group must use target type {{ip}}.
- **Deployment circuit breaker**: Mechanism for ECS to mark deployments FAILED when new tasks continuously fail to start, and (if rollback is enabled) revert to the previous good revision.

### Step-by-Step
1. **Build and push**: CI builds the image, tags with git SHA, {{docker push}} to ECR. Why no {{latest}}: task definition pointing to a fixed tag ensures you know exactly what is running and makes rollbacks deterministic.
2. **Task definition**: Choose valid CPU/RAM pairs for Fargate (e.g., 1 vCPU = {{1024}} goes with 2–8 GB), declare {{portMappings}} 8080, environment variables, secrets from Secrets Manager/Parameter Store, and {{awslogs}} log driver.
3. **Service**: Select cluster, task count (e.g., 2), **at least 2 private subnets in 2 AZs**, and a security group allowing ALB traffic on port 8080.
4. **Attach ALB**: Listener 443 of ALB → rule {{/api/*}} → target group (type {{ip}}, health check {{/actuator/health/readiness}}). The service automatically registers new task IPs and deregisters old ones.
5. **Rolling update**: Switch revision → ECS runs new tasks, waits for target group to report healthy, then stops old tasks. With {{minimumHealthyPercent=100}} and {{maximumPercent=200}}, service capacity never drops below the desired count.
6. **Circuit breaker**: If new tasks repeatedly crash or fail health checks, ECS marks the deployment FAILED and, with {{rollback: true}}, automatically redeploys the last known good revision.

~~~text
CI ──push──► ECR (orders-api:3f9c2a1)
                    │ task def orders-api:12
                    ▼
ALB :443 ──/api/*──► target group (type ip, health /actuator/health/readiness)
                    ├── task 10.0.11.23 (AZ-a, private subnet)
                    └── task 10.0.12.41 (AZ-b, private subnet)
                         │ log → CloudWatch Logs /ecs/orders-api
~~~

### Key task definition snippet
~~~json
{
  "family": "orders-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024", "memory": "2048",
  "executionRoleArn": "arn:aws:iam::123456789012:role/orders-exec",
  "taskRoleArn": "arn:aws:iam::123456789012:role/orders-task",
  "containerDefinitions": [{
    "name": "app",
    "image": "123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/orders-api:3f9c2a1",
    "portMappings": [{ "containerPort": 8080 }],
    "environment": [{ "name": "JAVA_TOOL_OPTIONS", "value": "-XX:MaxRAMPercentage=75" }],
    "logConfiguration": { "logDriver": "awslogs", "options": {
      "awslogs-group": "/ecs/orders-api", "awslogs-region": "ap-southeast-1",
      "awslogs-stream-prefix": "app" } }
  }]
}
~~~
In the service, safety is configured in {{deploymentConfiguration}}: {{deploymentCircuitBreaker}} with {{enable: true}} and {{rollback: true}}, plus {{healthCheckGracePeriodSeconds}} (e.g., 90) so ALB doesn't kill the Spring Boot task while it's still starting.

### Container orchestration comparison
| Choice | You manage | Best for |
|---|---|---|
| ECS on Fargate | Image, task definition | Small teams, minimal operations |
| ECS on EC2 | Plus: OS patching, node scaling | GPU needs, specialized instances, deep cost optimization |
| EKS | Plus: Kubernetes, add-ons, cluster upgrades | Kubernetes standards, multiple teams |

### Common pitfalls
- **Confusing task role with execution role.** Symptom: task starts but code gets {{AccessDenied}} calling S3; or task fails to pull image ({{CannotPullContainerError}}). How to avoid: Code permissions → task role; pull image, read secrets, write logs → execution role.
- **Target group type {{instance}} with Fargate.** Symptom: cannot create service. Fargate uses awsvpc, so must be {{ip}}.
- **Private subnet with no route to ECR.** Symptom: task hangs in PENDING then STOPPED with pull error. How to avoid: NAT gateway or VPC endpoints for ECR ({{ecr.api}}, {{ecr.dkr}}), S3 gateway endpoint, and CloudWatch Logs.
- **Health check grace period too short.** Symptom: Spring Boot takes 60s to start, ALB marks unhealthy at 30s, ECS kills the task, infinite loop. How to avoid: grace period > actual startup time, health check points to readiness.
- **Deploying with tag {{latest}}.** Symptom: "redeploy" doesn't change anything, or new scaled tasks pull a different version than old ones. How to avoid: tag with git SHA, enable tag immutability on ECR.

### One-minute pitch
"I push images to ECR tagged with git SHA. The task definition specifies the image, Fargate-valid CPU/RAM, port 8080, awslogs driver, and two IAM roles: execution role for ECS tasks, and task role for application permissions. The service runs at least two tasks across two private subnets in two AZs, attached to an ALB target group of type {{ip}}, with a readiness health check and a grace period sufficient for Spring Boot. Deployments create new revisions; rolling update with minimumHealthyPercent 100 ensures zero capacity drop, and I enable deployment circuit breaker with rollback so broken deployments revert to the previous revision automatically."

> Senior tip: let CI **render task definitions from files in your repo** (updating the image SHA) and register them, rather than editing in the console — console configurations "drift" from Git. Circuit breaker only catches tasks that fail to start or fail health checks; it won't catch "deployments that start but behave incorrectly," so you still need 5xx/latency alarms on the ALB hooked into a rollback process.`,
    follow: ["Why does Fargate require awsvpc mode and how does it affect subnet IP exhaustion?", "Circuit breaker doesn't catch broken business logic: what do you add?", "When do you choose blue/green via CodeDeploy instead of ECS rolling updates?"]
  },
  'aws-026': {
    q: 'The team needs to put an API on domain api.shop.vn with HTTPS, behind an ALB. How do you configure Route 53 and ACM: alias records vs CNAMEs, recommended TTL, how are certificates validated/renewed, and what causes users to see certificate warnings?',
    a: `**Summary:** Create a **hosted zone** for {{shop.vn}} on Route 53 and point the domain registrar's nameservers there; request an **ACM certificate** for {{api.shop.vn}} via **DNS validation** (add a CNAME record; ACM renews automatically as long as the record exists and the cert is in use); attach the cert to the 443 listener of the ALB, redirect 80 to 443; finally, create an **alias A record** for {{api.shop.vn}} → ALB. Alias differs from CNAME by working at the **zone apex** ({{shop.vn}}), automatically tracking ALB IP changes, and incurring no Route 53 query fees.

### Quick Understanding
DNS is the Internet's **phonebook**: it translates names ({{api.shop.vn}}) into addresses (IPs). A **hosted zone** is the private phonebook for {{shop.vn}}. **CNAME** is like saying "call Nam's number" — it requires another lookup. **Alias** is a Route 53-specific feature: the phonebook copies the ALB's current number directly; if the ALB changes number, the phonebook updates itself. A **TLS certificate** is like an ID document stamped by a CA: the browser checks if the name on the ID matches the domain and if it hasn't expired.

### Terminology
- **Hosted zone**: Container for DNS records for a domain on Route 53; public zone answers for the Internet, private zone answers inside a VPC.
- **NS record / delegation**: Domain registrar (e.g., {{.vn}} providers) must point NS records to the 4 Route 53 nameservers provided.
- **TTL**: Seconds a resolver is allowed to cache the answer; longer TTL means changes take longer to take effect.
- **Alias record**: Route 53 A/AAAA record pointing to AWS resources (ALB, CloudFront, S3 website); TTL is managed by Route 53 based on the target.
- **Zone apex**: The root name {{shop.vn}}; DNS standards **forbid** CNAME here.
- **ACM**: Service for issuing and renewing public certificates, usable with ALB, CloudFront, API Gateway; private keys are not exportable.
- **DNS validation**: Proof of domain ownership via a specific CNAME record required by ACM.

### Step-by-Step
1. **Create hosted zone** {{shop.vn}}, get 4 NS records, update registrar. Why often slow: NS records of parent domains have long TTLs; could take hours.
2. **Request ACM cert** in the **exact region as the ALB** (e.g., {{ap-southeast-1}}), for {{api.shop.vn}} (or {{*.shop.vn}}). Choose DNS validation, click "create record in Route 53" — ACM turns Issued in minutes.
3. **Listener 443** of ALB attached to the cert; use a modern TLS security policy (TLS 1.2+). **Listener 80** has one action: 301 redirect to HTTPS.
4. **Alias A record** {{api.shop.vn}} → ALB (and AAAA if dualstack). Enable "evaluate target health" if using failover routing.
5. **Verify** with {{dig api.shop.vn}} and {{curl -v https://api.shop.vn/actuator/health}}: check returned IP and name on the cert.
6. **Renewal**: ACM automatically renews DNS-validated certs before expiration, provided the CNAME validation remains and the cert is attached to a resource.

~~~text
Browser ─ query api.shop.vn ─► ISP resolver ─► .vn NS ─► Route 53 NS (zone shop.vn)
                                                            │ alias A → ALB (current IP)
Browser ─ TLS (SNI: api.shop.vn) ─► ALB :443 cert ACM CN=api.shop.vn
                                          └─► target group → Spring Boot task :8080 (internal HTTP)
~~~

### Alias vs CNAME
| Feature | Alias (Route 53) | CNAME |
|---|---|---|
| Works at zone apex | Yes | No (violates DNS standard) |
| Points to | AWS resources, other records in zone | Any hostname |
| Query fee | Free for AWS resources | Charged like regular queries |
| Lookup count | Returns IP immediately | Resolver must resolve target hostname |
| TTL | Managed by target | Manually configured by you |

### TTL recommendations
- Stable records: 300–3600 seconds.
- **Before migration** (ALB changes, region changes): lower TTL to 60 seconds **at least one old TTL cycle beforehand**, perform migration, then restore TTL. Why: resolvers cache old values until the old TTL expires; lowering too late is useless.
- Remember JVM also caches DNS: Java has {{networkaddress.cache.ttl}}; if too long, Java client calls the old ALB IP.

### Common pitfalls
- **Cert requested in wrong region.** Symptom: cert not found when attaching to ALB. How to avoid: cert for ALB in same region; cert for CloudFront must be in {{us-east-1}}.
- **Cert has {{*.shop.vn}} but accessed {{shop.vn}}.** Wildcards don't include the root domain, nor {{a.b.shop.vn}}. How to avoid: include both {{shop.vn}} and wildcard in Subject Alternative Names.
- **Deleting CNAME validation record "to clean up".** Symptom: cert fails renewal a year later, customers see "expired" warning. How to avoid: keep the record, set alarms on ACM expiration events.
- **Forgetting 80 → 443 redirect** or app generates {{http://}} links because it ignores {{X-Forwarded-Proto}}. How to avoid: listener 80 redirect; in Spring Boot, set {{server.forward-headers-strategy=native}} (or framework equivalent) so the app knows the original request was HTTPS.
- **Changing NS at registrar before zone has all records.** Symptom: email and old website die. How to avoid: copy all records (MX, TXT, etc.) to Route 53 first, then update NS.

### One-minute pitch
"I create the hosted zone on Route 53 and update registrar NS records after copying all existing records. ACM cert is requested in the ALB's region with DNS validation — a simple CNAME record. As long as that CNAME exists and the cert is attached, ACM renews it automatically. ALB 443 listener uses the cert with modern TLS, and 80 redirects to 443. Finally, I use an alias A record for the domain pointing to the ALB. Aliases are allowed at the apex, track ALB IP changes automatically, and are free. Before any DNS migration, I lower TTLs well in advance, and I ensure Spring Boot trusts headers so it generates HTTPS links correctly."

> Senior tip: the two most common certificate issues I see aren't caused by ACM, but by humans: deleting validation records, and having certs in the wrong region or missing Subject Alternative Names. Put Route 53 records and ACM certs into IaC (Terraform/CDK) so nobody can edit them manually, and set up EventBridge alarms for ACM expiration — much cheaper than a morning where customers report "unsafe website".`,
    follow: ["When do you need a private hosted zone and how does it help internal VPC services?", "How does Route 53 failover routing work with health checks?", "Why does TLS terminate at the ALB and is ALB → task HTTP acceptable?"]
  },
  'aws-027': {
    q: 'At 14:05, a developer accidentally runs a DELETE without a WHERE clause on the production RDS PostgreSQL orders table, deleting 120,000 rows; other tables are still receiving writes. How do you recover using automated backup, point-in-time recovery, and snapshots, and why can\'t you "restore over" the running instance?',
    a: `**Summary:** RDS **always restores to a NEW instance** — it cannot rewind a running instance. Method: use **point-in-time recovery (PITR)** to create a temporary instance at the moment just before the accidental deletion (if the command ran at 14:05:12, choose **14:05:00**), then **copy only the orders table** (or exactly the 120,000 deleted rows) from the temporary instance back to production, then delete the temporary instance. Do not restore over the whole DB because other tables are receiving legitimate writes after 14:05 — overwriting them would cause data loss.

### Quick Understanding
Automated backup is like **continuous security camera footage**: daily full snapshots, plus transaction logs for changes in between. Want to see "what the warehouse looked like at 14:04:59"? AWS takes the nearest snapshot then replays the footage to that exact second — but the result is rendered as **a new warehouse next door**, not rewinding the real warehouse. You walk over to the new warehouse, grab the missing items, bring them back, and the real warehouse continues business as usual.

### Terminology
- **Automated backup**: RDS takes snapshots daily during backup window and continuously logs transactions; retained per **retention period** (1–35 days; setting to 0 disables it).
- **PITR**: Restore to any point in time within the retention period, accurate to the second; latest restorable time is typically a few minutes behind now.
- **Manual snapshot**: Snapshot you take manually, persists until deleted (even if instance is deleted) — use before major migrations.
- **Restore**: Always creates a **new DB instance** with a new endpoint; you choose instance class, subnet group, security group, parameter group.
- **RPO/RTO**: Maximum tolerable data loss / Maximum tolerable time to restore.

### Step-by-Step
1. **Stop the bleeding**: Determine exact timing from app logs or {{pg_stat_activity}}/Postgres logs (log_statement, audit) — assume deletion ran at 14:05:12. Notify the team, temporarily lock {{orders}} table writes if necessary.
2. **PITR**: Console → Restore to point in time → choose **14:05:00** (a few seconds before the deletion), maybe a smaller instance class, **place in private subnet, security group allowing only operator machine**. Why manual selection: default might use wrong security/parameter groups compared to production.
3. **Wait for instance available** — time proportional to storage size and log volume, minutes to hours. This is the biggest part of RTO.
4. **Extract data**: {{pg_dump --table=orders --data-only}} from the temporary instance, or create table {{orders_restored}} in production then {{INSERT ... SELECT}} via {{postgres_fdw}}/dblink. Only insert rows **missing** in production (based on PK) to avoid disrupting writes after 14:05.
5. **Verify**: Count rows, compare totals, cross-check related tables (order_items, payments).
6. **Cleanup**: Delete temporary instance (billing ends), write postmortem, add guardrails.

~~~text
00:30          backup window: daily snapshot
00:30 ... 14:05 continuous transaction log ───────────────►
                                   14:05:12 DELETE orders (incident)
PITR = snapshot 00:30 + replay log to 14:05:00
     → NEW instance "orders-restore" (different endpoint)
     → copy 120,000 orders rows to production
~~~

### Comparing recovery methods
| Method | Restore unit | Data loss | When to use |
|---|---|---|---|
| PITR to new instance + copy table | Specific table/rows | Virtually none | Accidental partial data loss (this case) |
| PITR and switch app to new instance | Whole DB | All writes after restore point | DB entirely corrupted, accept data loss window |
| Restore from manual snapshot | Whole DB | Everything after snapshot | Major migration failure, have snapshot right before |
| Read replica | — | — | **Won't** help: DELETE propagates to replica immediately |

### Common pitfalls
- **Thinking Multi-AZ or read replica is backup.** Symptom: DELETE runs on primary, standby and replica lose data in seconds. How to avoid: understand Multi-AZ/replica protects against **hardware failure**, PITR/backup protects against **human error**.
- **Retention set to 1 day or off (0).** Symptom: incident found after 2 days, no restorable point exists. How to avoid: production minimum 7–14 days, longer for financial data, plus AWS Backup.
- **Restoring with default config.** Symptom: temporary instance uses open security group or wrong parameters. How to avoid: specify explicit subnet group, security group, parameter group.
- **Restoring over production just for one table.** Symptom: all orders, payments, writes after 14:05 are lost. How to avoid: copy only the missing data.
- **Dev having direct production write access.** How to avoid: read-only account for queries, data changes via reviewed scripts, verify row impact in transaction before COMMIT.

### One-minute pitch
"RDS does not rewind a running instance; all restores create new instances. Since other tables are receiving valid writes after 14:05, I don't restore over the entire DB. I determine the exact deletion time from logs, use PITR to create a temporary instance at the moment just before deletion, and place it in a private subnet with specific security and parameter groups. Once ready, I dump the orders table, or use {{postgres_fdw}} to insert only the missing rows back to production, verify row counts and totals, and finally delete the temporary instance. The main lessons: Multi-AZ and read replicas are not backups, retention must be long enough, and developers should never have direct production write access."

> Senior tip: **practice restoring** every quarter and measure the actual time — most teams only find out their RTO during a real crisis, and are often surprised that PITR for a few hundred GB takes an hour. For Aurora, **database cloning** (copy-on-write) gives you a copy for investigation in minutes; Aurora MySQL also has Backtrack for rewinding a cluster, but it's not available for Aurora PostgreSQL.`,
    follow: ["What do Multi-AZ, read replica, and automated backup protect against respectively?", "How can you reduce RTO for multi-TB databases?", "How do you design production DB access for devs to avoid accidents?"]
  }
});
