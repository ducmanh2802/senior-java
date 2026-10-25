/*
 * English translation of js/data/q-aws.js — task T206. Format: js/core/i18n.js (content overlay).
 * ids: aws-001 aws-002 aws-003 aws-004 aws-005 aws-006 aws-007 aws-008 aws-009 aws-010 aws-011
 */
App.i18n.content({

  'aws-001': {
    q: `Deploy a Spring Boot service to AWS: when to choose EC2, ECS Fargate, EKS, or Lambda? What criteria really decide?`,
    a: `**Summary:** choose by the level of infrastructure control and operating model: EC2 when you need full OS control; ECS Fargate when you want to run containers without managing servers; EKS when the team already has Kubernetes or needs the K8s ecosystem; Lambda when the workload is short, event-driven, and can tolerate cold start.

### Inside each option
- **EC2**: you manage OS, patching, AMI, Auto Scaling Group, load balancer. Most flexible (install agents, kernel tuning, GPU) but you pay for instance uptime and for the operational effort.
- **ECS Fargate**: you package a Docker image, declare a task definition (CPU, memory, env, IAM task role). AWS runs the container; there is no node to patch. Fits most "normal" Spring Boot services.
- **EKS**: managed Kubernetes control plane. Strong when there are many teams needing CRDs, operators, service mesh, or an existing K8s platform. The cost is complexity: ingress, HPA, RBAC, add-ons, cluster upgrades.
- **Lambda**: function + event trigger, scales almost instantly, pay per request and execution time. Constraints: max 15 minutes per invocation, cold start, no state, connection pool is hard to manage.

### Practical comparison table
| Criteria | EC2 | ECS Fargate | EKS | Lambda |
|---|---|---|---|---|
| OS management | You | AWS | AWS + you manage nodes if using EC2 nodes | None |
| Cold start | None | Low | Low | Yes, worse with Java |
| Scale | Minutes | Minutes | Minutes (HPA) | Seconds |
| Long workload (batch, streaming) | Good | Good | Good | No (15 min) |
| What the team needs to know | Linux, systemd | Docker, task definition | Kubernetes | IAM, event model |
| Cost at low load | High (instance on 24/7) | Medium | High (control plane + nodes) | Very low |

### Decision criteria
1. If the workload is an HTTP API 24/7 with stable traffic: **ECS Fargate** is the best balance; less operation than EC2, simpler than EKS.
2. If the company already has a Kubernetes platform, many services, and needs standardized deploy: **EKS**, do not rebuild ECS.
3. If you need GPU, special software, kernel tuning, or want to leverage Reserved Instances already purchased: **EC2**.
4. If it is a short task (image processing, webhook, small cron, glue code between services): **Lambda**. With Java, always consider SnapStart and keep the function "warm".

### Production pitfalls
- Bringing a full Spring Boot onto Lambda often yields a 3-8 second cold start due to Spring context, Hibernate, connection pool. Do not choose Lambda just because it is "cheap" and then be surprised by p99.
- On Fargate, task CPU/memory determines both price and performance; setting memory too close to the limit easily leads to OOMKilled, setting it too high is wasted money. Monitor real memory utilization before settling.
- On EKS, writing YAML deployment for each service quickly leads to configuration drift; use Helm/Kustomize and policy-as-code.

> Senior tip: for most Java teams of 5-20 people, ECS Fargate + ALB + RDS is the shortest path to a stable production. Only move to EKS when there is someone actually running the cluster; the hidden cost of Kubernetes is people, not the AWS bill.`,
    follow: [
      `How does Lambda handle a 30-minute job?`,
      `Why does EKS cost more to operate than ECS even though the control plane is only about $0.10/hour?`,
      `How would you migrate a Spring Boot monolith to containers without downtime?`
    ],
  },

  'aws-002': {
    q: `Lambda running Java has high cold start. How do SnapStart, GraalVM native image, and memory/CPU optimization work, and which one should you choose?`,
    a: `**Summary:** Java cold start on Lambda includes class loading + JVM startup + initialization code (Spring context, DB pool). SnapStart snapshots JVM state after init to skip initialization; GraalVM native image reduces load time and memory; increasing memory provides more CPU and reduces init time.

### Where cold start comes from
When no execution environment is ready, Lambda must: load code, initialize the runtime, run the **init phase** (static initializers, constructors, Spring Boot), then call the handler. With Spring Boot, init takes most of the time due to component scanning, proxies, Hibernate metadata. In addition, the old VPC (before 2019) caused ENI cold start; Lambda now uses hyperplane ENI so that is usually no longer the main issue.

### SnapStart
- Applies to Java managed runtimes from Java 11 upward (11, 17, 21...); also available for Python and .NET now.
- Lambda runs init once, takes a snapshot of JVM memory + heap + loaded classes, encodes and caches it.
- When a request arrives, Lambda restores the snapshot instead of re-initializing, typically reducing cold start from several seconds to hundreds of milliseconds.
- **Not snapshotable**: open network connections, threads, entropy/random seed, file descriptors. So the code must "refresh" after restore.

~~~java
// Runtime hooks using CRaC API (org.crac): implement Resource then register into global context
public class Handler implements RequestHandler<Req, Res>, Resource {
    public Handler() { Core.getGlobalContext().register(this); }

    @Override public void beforeCheckpoint(Context<? extends Resource> ctx) {
        /* close connections, flush */
    }
    @Override public void afterRestore(Context<? extends Resource> ctx) {
        /* reopen connections, regenerate values that must be unique */
    }
    // handleRequest(...) as usual
}
~~~

Big pitfall: **unique IDs/random** are duplicated after restore if generated during init, because every restored environment uses the same snapshot. Do not generate UUID/token/seed in static initializer or constructor; generate inside the handler or in {{afterRestore}}. {{SecureRandom}} on the Lambda managed Java runtime is designed to be safe with snapshots, but {{java.util.Random}} initialized in init is not.

### GraalVM native image
Compiles AOT into a binary, removing JVM startup and JIT warm-up. Cold start can be tens to hundreds of milliseconds, with lower memory. Trade-offs: long build, reflection/resource must be declared (Spring Boot 3 has AOT + reachability metadata), some libraries are incompatible, and without JIT the peak throughput may be lower than a warmed JVM.

### Memory and CPU
Lambda allocates CPU by memory (e.g., 1.769 MB equals 1 vCPU). Increasing memory often **reduces** execution time and sometimes cost because billing is per GB-second. Do not set 512 MB for Spring Boot and complain it is slow. Measure with Lambda Power Tuning (state machine) to find the optimal cost point.

### Choosing
| Scenario | Choice |
|---|---|
| Moderate Spring Boot, keep JVM code | SnapStart |
| Small function, few dependencies, need very low cold start | GraalVM native |
| Code with a lot of reflection/agent | JVM + SnapStart, increase memory |
| Latency not sensitive | Normal JVM, optimize init |

> Senior tip: do not optimize cold start before measuring. Enable Lambda Insights or read the REPORT log line to see Init Duration; if p99 is acceptable, keep the normal JVM. SnapStart is almost always the cheapest speed boost for Java, but test connections and random after restore carefully.`,
    follow: [
      `How should connection pools to RDS be handled after SnapStart restore?`,
      `Why can increasing memory reduce Lambda cost?`,
      `How do you debug reflection errors with GraalVM native?`
    ],
  },

  'aws-003': {
    q: `Design a VPC for a microservices system: public/private subnets, NAT, Security Group vs NACL, VPC endpoints - explain and common pitfalls?`,
    a: `**Summary:** A VPC is a virtual private network; a public subnet has a route to the Internet Gateway, a private subnet reaches the Internet through NAT. Security Group is a stateful firewall attached to ENI, NACL is stateless at the subnet layer. VPC endpoint allows calling AWS services without going through the Internet.

### Reference layout
- **2-3 Availability Zones**, each AZ has one public subnet and one or more private subnets.
- **ALB** in the public subnet (or private if using CloudFront/API Gateway), app in private subnet, RDS in a separate private subnet (DB subnet group spanning at least 2 AZs).
- Public route table: {{0.0.0.0/0 -> igw-xxx}}. Private route table: {{0.0.0.0/0 -> nat-xxx}} placed in the public subnet of the same AZ.
- Each AZ should have its own NAT Gateway to avoid cross-AZ data charges and eliminate a single point of failure. NAT Gateway is billed by the hour + GB processed - an easy cost to overlook.

### Security Group vs NACL
| Criteria | Security Group | Network ACL |
|---|---|---|
| Attached to | ENI / resource | Subnet |
| Stateful | Yes (allows return traffic automatically) | No, must open both directions |
| Rules | Only allow | Allow and deny |
| Evaluation | All rules before deciding | By rule number, stops at first match |
| When to use | Main traffic control | Raw IP blocking, e.g., blocking bad IP ranges |

In practice, 95% of control should be at Security Group. Do not open {{0.0.0.0/0}} for port 3306/5432 or Redis; only allow the app SG to call the DB SG (referencing SG as source).

### VPC endpoint
- **Gateway endpoint**: S3 and DynamoDB, free, attached to route table. Use almost by default.
- **Interface endpoint (PrivateLink)**: creates an ENI in the subnet, billed per hour + GB. Used for SQS, SNS, KMS, Secrets Manager, ECR, CloudWatch Logs... so traffic does not go out to the Internet.
- Benefit: reduces NAT cost, does not rely on the Internet, complies with security requirements.
- Must enable **private DNS** for the interface endpoint so that SDK uses the standard domain name.

### Production pitfalls
- **NAT Gateway throughput/cost spike** due to pulling Docker images or sending logs through NAT. Use endpoints for ECR (api + dkr + s3) and CloudWatch Logs.
- **One NAT for multiple AZs**: if that AZ fails, egress is lost for all; cross-AZ also incurs fees.
- **NACL mistakes**: because it is stateless, opening inbound 443 but forgetting outbound ephemeral ports 1024-65535 makes connections hang in a very confusing way.
- **VPC DNS resolution**: if {{enableDnsSupport}}/{{enableDnsHostnames}} is disabled, endpoint private DNS does not work.
- **Overlapping CIDR** when connecting multiple VPCs/on-prem; plan a /16 from the start to avoid re-IP later.

> Senior tip: draw the route table before drawing the diagram. Most "service cannot call S3/Secrets Manager" failures are due to missing endpoint or route, not code. Enable VPC Flow Logs to CloudWatch/S3 for fast troubleshooting.`,
    follow: [
      `Why should each AZ have its own NAT Gateway despite the extra cost?`,
      `How does Security Group referencing another Security Group work?`,
      `When should you use AWS PrivateLink instead of VPC peering?`
    ],
  },
  'aws-004': {
    q: `How is an IAM role different from an IAM user? How do you apply least privilege to an application running on ECS/EKS/Lambda without hard-coding credentials?`,
    a: `**Summary:** An IAM user is a long-term identity tied to access keys; an IAM role is a temporary identity that is assumed, returning time-limited credentials (usually 15 minutes to 12 hours). Applications should use roles: task role on ECS, IRSA or EKS Pod Identity on EKS, execution role on Lambda, and never embed access keys in the image or environment variables.

### Mechanism
- **Principal** (who) performs **action** (what) on **resource** (which), possibly with **condition** (when). Policy evaluation: explicit deny wins everything; then explicit allow; everything else is implicit deny.
- **Role** has a trust policy defining who can assume it. When assumed, STS issues temporary credentials including an access key, secret key, and **session token**.
- **Credential provider chain** in AWS SDK for Java v2 searches in order: system property, env, profile, container credential endpoint (ECS), IMDS (EC2)... so code does not need to know where it runs.

### Per platform
- **ECS**: the task definition has a **task role** (permissions for the code) separate from the **execution role** (pull image, write logs). Confusing the two is very common: the code cannot call S3 because the permission is in the execution role.
- **EKS**: two choices. **IRSA** (IAM Roles for Service Accounts) links a Kubernetes ServiceAccount to an IAM role through an OIDC provider; the pod receives a projected volume token. **EKS Pod Identity** is a newer method using an add-on, attaching the role without editing the cluster OIDC trust policy for each cluster.
- **Lambda**: the execution role defines permissions; each function should have its own role, not share an admin role.
- **EC2**: instance profile attached to the instance; but if running containers on EC2, prefer the ECS task role instead of letting the container inherit node permissions.

### Least privilege in practice
1. Start from minimal permissions, not from {{*}}.
2. Limit resource ARNs: bucket, queue, secret, table.
3. Use conditions: {{aws:SourceVpce}}, {{aws:PrincipalTag/team}}, {{s3:prefix}}, {{aws:SourceArn}} for SNS/SQS.
4. Separate roles by workload and environment (dev/staging/prod), do not reuse a prod role for dev.
5. Use **IAM Access Analyzer** to find unused permissions and generate policies from CloudTrail.
6. For sensitive permissions, enforce MFA with {{aws:MultiFactorAuthPresent}}.

~~~json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject"],
    "Resource": "arn:aws:s3:::orders-docs/*",
    "Condition": {
      "StringEquals": {
        "aws:SourceVpce": "vpce-0123456789abcdef0"
      }
    }
  }]
}
~~~

### Production pitfalls
- Access keys in Git or image: even if deleted later, the key remains in layers/history. Rotate immediately and enable secret scanning.
- Using the root account for CI/CD: disaster. Enable MFA for root, do not create access keys for root.
- Overly broad roles: a single SSRF vulnerability can read all of S3. Limit both permissions and network paths (VPC endpoint, IMDSv2).
- On EC2, IMDSv1 is exploited by SSRF to steal credentials; enable **IMDSv2 required**.

> Senior tip: treat each service as its own principal. When reviewing, the first question is not "does it run" but "if this service is compromised, what can the attacker reach". A good role boundary turns a big incident into a small one.`,
    follow: [
      `What is the difference between ECS task role and execution role?`,
      `How does IRSA work from the time the pod starts until the SDK gets credentials?`,
      `How do you find and narrow over-granted IAM permissions?`
    ],
  },

  'aws-005': {
    q: `How do RDS, Aurora, and DynamoDB differ in nature? For a new system, which do you choose and why?`,
    a: `**Summary:** RDS is a managed relational database on traditional engines (PostgreSQL, MySQL...); Aurora is a relational engine compatible with MySQL/PostgreSQL but with distributed storage that scales reads better; DynamoDB is a fully managed key-value/document NoSQL with predictable latency at any scale but requires designing access patterns in advance.

### RDS
- Runs familiar engines; you choose instance class, storage, backup, Multi-AZ.
- **Multi-AZ** (DB instance) is a synchronous standby, automatic failover (usually 60-120 seconds), but the standby is not readable. The **Multi-AZ DB cluster** (MySQL/PostgreSQL) has 2 readable standbys.
- **Read replica** is an asynchronous copy for reading; has replication lag.
- Suitable for: applications with transactions, joins, reports, ORM/JPA, clearly relational data.

### Aurora
- Storage separated from compute, replicates 6 copies across 3 AZs, billed per GB-month and I/O (or Aurora I/O-Optimized).
- One cluster is a writer + up to 15 readers; faster failover than RDS Multi-AZ, low replica lag.
- **Aurora Serverless v2** scales by ACU, good for variable workload; min ACU > 0 still costs when idle (now can set min 0 ACU for auto-pause, but resume takes a few seconds).
- **Aurora Global Database** for cross-region DR with RPO around 1 second.
- Suitable: read-heavy workload, high HA, MySQL/PostgreSQL compatibility, large scale.

### DynamoDB
- Key-value table, each item max 400 KB; access by **partition key** (+ sort key).
- Throughput in on-demand or provisioned mode; single-digit ms latency at large scale.
- Features: GSI/LSI, TTL, Streams, transactions (limited), DAX cache.
- No joins, no flexible SQL queries; every access pattern must be known in advance.
- Suitable: sessions, carts, catalogs by key, event state, workload needing extreme horizontal scale.

### Quick selection table
| Need | Choose |
|---|---|
| Transaction, join, complex reporting | RDS PostgreSQL |
| Same but needs HA / read scale | Aurora PostgreSQL |
| Key-value, access by key, unlimited scale | DynamoDB |
| Heavy analytics, OLAP | Redshift / Athena, not the above three |
| Full-text search | OpenSearch |

### Production pitfalls
- Choosing DynamoDB then writing SQL-style queries (scanning the whole table, filtering on the client) is expensive and slow. DynamoDB requires **designing the table by access pattern** first.
- Aurora bills I/O; many small updates can cost more than expected; measure before committing.
- RDS Multi-AZ (DB instance) is not for read scaling; the standby does not accept connections; reports must point to read replicas.
- Forgetting connection pool: each app instance opens too many connections, draining {{max_connections}}. Use HikariCP with a small pool and PgBouncer/RDS Proxy if needed.

> Senior tip: my default for a new relational system is **Aurora PostgreSQL**; **DynamoDB** only when the access pattern is clear and predictable scale/latency is needed. Do not choose NoSQL because of trend and then write joins in the application layer.`,
    follow: [
      `How does Aurora Serverless v2 differ from provisioned, and when is it more expensive?`,
      `Why is DynamoDB not suitable for ad-hoc queries?`,
      `What problem does RDS Proxy solve when the app scales with Lambda?`
    ],
  },
  'aws-006': {
    q: `DynamoDB: what effect do partition key and sort key have? What is a hot partition, how does GSI work, and what are the traps?`,
    a: `**Summary:** DynamoDB splits data by the hash of the partition key; even distribution spreads throughput, skew creates hot partitions. The sort key allows range queries within the same partition. A GSI is a secondary table with a different key, updated asynchronously with its own cost.

### How DynamoDB stores data
- Each item is identified by a **partition key** (required) and **sort key** (optional).
- The partition key is hashed into physical partitions. Each partition has a throughput limit (approx 3,000 RCU strong consistent read and 1,000 WCU write per second, plus a 10 GB data limit).
- If one key dominates traffic, the partition holding it becomes hot; other partitions are idle. That is a **hot partition**, showing localized throttling even though the table still has capacity.
- **Adaptive capacity** helps by giving extra capacity to hot partitions, but it does not save a single key with extreme traffic.

### Key design
- Choose a key with high cardinality and even distribution: {{userId}}, {{orderId}} (UUID) are good; {{status}}, {{country}}, {{date}} are usually bad because of few values.
- Write using **single-table design**: common partition key {{USER#123}}, sort key {{ORDER#2024-...}} to retrieve multiple entity types in one query.
- If forced to use a skewed key, add a **shard suffix** (e.g., {{status=NEW#0..9}}) then scatter-gather on read, or use a GSI with a different key.

### GSI and LSI
- **GSI**: different partition and sort key from the base table, its own throughput, updated **asynchronously** (eventual consistency).
- **LSI**: created only at table creation, uses the same partition key, different sort key; max 5 LSI.
- GSI has its own **hot partition**: if the GSI key is {{status}}, all {{NEW}} items pile into one place. This is a very common mistake when adding GSI "for convenience".
- GSI **projection**: only project needed attributes ({{KEYS_ONLY}}, {{INCLUDE}}) to reduce cost; {{ALL}} is expensive in storage and write cost.

### Query vs Scan
- {{Query}} requires the partition key, reads by sort key range, efficient.
- {{Scan}} reads the entire table, expensive and slow; only use for small offline jobs.
- Pagination uses {{LastEvaluatedKey}}, not offset.

~~~java
QueryRequest req = QueryRequest.builder()
    .tableName("orders")
    .keyConditionExpression("pk = :pk AND begins_with(sk, :prefix)")
    .expressionAttributeValues(Map.of(
        ":pk", AttributeValue.fromS("USER#42"),
        ":prefix", AttributeValue.fromS("ORDER#")))
    .build();
~~~

### Production pitfalls
- Using a timestamp as partition key: all writes pile into the partition of the current second. Use timestamp as **sort key**, partition key as the entity id.
- GSI **back-throttling** into the base table: if the GSI does not have enough WCU, write to the base table can be affected.
- GSI does not guarantee strong consistency; a read immediately after a write may not see the data.
- Item limit 400 KB and transaction max 100 items / 4 MB; wrong size design requires rewriting.

> Senior tip: DynamoDB design starts with the list of access patterns, not the ERD. If you cannot list 10 main queries with frequency, do not choose DynamoDB yet.`,
    follow: [
      `Why does using date/month as a partition key usually cause a hot partition?`,
      `How does GSI eventual consistency affect read-after-write flows?`,
      `When should LSI be used instead of GSI?`
    ],
  },

  'aws-007': {
    q: `S3: which storage class to use when, how does a presigned URL work, lifecycle, consistency, and multipart upload - what to note?`,
    a: `**Summary:** S3 is durable object storage with strong read-after-write consistency after a successful write; choose storage class by read frequency and retention; presigned URL lets a client upload/download an object within a time limit without credentials; multipart upload is practically required for large files.

### Storage class
| Class | When to use | Note |
|---|---|---|
| Standard | Hot data, low latency | Most expensive, no retrieval fee |
| Intelligent-Tiering | Unpredictable pattern | Auto-moves tiers, small monitoring fee |
| Standard-IA | Less read (~<1/month) | Retrieval fee, minimum 30 days |
| One Zone-IA | Reproducible data, rarely read | Only one AZ |
| Glacier Instant Retrieval | Long retention, still needs ms read | Minimum 90 days |
| Glacier Flexible / Deep Archive | Backup, retrieval from minutes-hours (Flexible) to 12-48 hours (Deep Archive) | Cheapest, expensive retrieval; minimum 90/180 days |

### Presigned URL
- The server signs a URL with its credential (SigV4), the URL contains the action, object key, and expiration time.
- The client uses the URL directly for PUT/GET, not through the app server -> reduces load and saves bandwidth.
- Limit: SigV4 allows up to 7 days (when signed with an IAM user); if signed with temporary credentials (role, STS), the URL expires earlier when the session expires. Anyone with the URL has the corresponding permission, so set short TTL and limit the exact key.
- Do not use presigned URL for operations requiring tight control (bulk delete); URLs should only be for uploading/downloading a specific object.

~~~java
S3Presigner presigner = S3Presigner.create();
PresignedPutObjectRequest req = presigner.presignPutObject(r -> r
    .signatureDuration(Duration.ofMinutes(10))
    .putObjectRequest(p -> p.bucket("uploads").key("user/42/avatar.png")
        .contentType("image/png")));
String url = req.url().toString();
~~~

### Lifecycle
- Rules by prefix/tag: move to IA after N days, Glacier after M days, expire after K days.
- Use to clean up incomplete multipart uploads (very important; otherwise silent cost).
- Versioning + lifecycle: delete old versions after some time; be careful with delete markers.

### Consistency
- Since late 2020, S3 provides **strong read-after-write consistency** for new PUTs and overwrites, and **strong** for list. The old eventual-consistency story in documentation is outdated.
- However, distributed systems above (CloudFront, app cache) may still return old versions; do not confuse this with S3.
- Updating metadata or copying an object is a new operation, not atomic with readers downloading.

### Multipart
- Recommended for files larger than 100 MB; object limit 5 TB (AWS raised to 50 TB by late 2025), max 10,000 parts, each part 5 MB-5 GB (last part can be smaller).
- Parallel upload of many parts increases speed significantly.
- If one part fails, only retry that part. Must call CompleteMultipartUpload; if left incomplete, use lifecycle {{AbortIncompleteMultipartUpload}}.
- Check checksums (CRC32C/SHA256) to detect data corruption.

### Production pitfalls
- Public bucket: almost always wrong. Enable Block Public Access, use CloudFront + OAC for public content.
- Enabling versioning without lifecycle: storage cost silently increases with every write.
- Using S3 as a filesystem (frequent small file edits): every PUT is a new object, expensive; if a shared filesystem is needed, use EFS.
- Not setting {{Content-Type}} on a presigned PUT: the browser may handle the file incorrectly.

> Senior tip: by default, enable versioning + Block Public Access + lifecycle abort multipart for every bucket. For client uploads, use presigned POST with {{content-length-range}} in the POST policy to prevent huge files (presigned PUT cannot limit size by range).`,
    follow: [
      `Why should a presigned URL not have a long TTL?`,
      `What hidden cost appears when versioning is enabled without lifecycle?`,
      `When should you use S3 Transfer Acceleration?`
    ],
  },

  'aws-008': {
    q: `Compare SQS standard/FIFO, SNS, EventBridge, Kinesis and MSK. How do visibility timeout, DLQ, and "at least once" affect design?`,
    a: `**Summary:** SQS is a point-to-point queue for workers; SNS is pub/sub fan-out; EventBridge is an event bus with routing by rule and SaaS integration; Kinesis is a stream for analytics/replay; MSK is managed Kafka. SQS standard is at-least-once, so consumers must be idempotent.

### Quick comparison
| Service | Model | Keeps message | Replay | Throughput |
|---|---|---|---|---|
| SQS Standard | Queue | Default 4 days, max 14 days | No | Very high, no ordering |
| SQS FIFO | Queue | Same | No | Limited by message group, ordered |
| SNS | Pub/sub | No (unless fan-out to SQS) | No | Very high |
| EventBridge | Event bus + rule | Archive can replay | Yes (archive) | High, flexible routing |
| Kinesis Data Streams | Stream | Default 24 hours, max 365 days | Yes | Per shard |
| MSK (Kafka) | Distributed log | By retention | Yes | Very high |

### SQS
- **Visibility timeout**: when a consumer receives a message, it is hidden during this period. If processing finishes before, delete it; if not, the message reappears and can be processed again.
- Visibility timeout should be larger than the p99 processing time, but not too large to slow retries. It can be extended with {{ChangeMessageVisibility}} for long jobs.
- **Long polling** ({{WaitTimeSeconds}} 20) reduces empty receives and cost.
- **DLQ**: after {{maxReceiveCount}}, the message moves to a DLQ for investigation, preventing poison messages from looping forever.
- **FIFO**: {{MessageGroupId}} ensures order within the group; {{MessageDeduplicationId}} prevents duplicates within 5 minutes. Throughput is lower than standard and requires fine group keys to avoid bottlenecks.

### Fan-out
Common pattern: SNS topic -> multiple SQS queues (one per consumer). This lets multiple services process the same event independently, with each service having its own DLQ/retry.
EventBridge fits when you need to filter by event content ({{source}}, {{detail-type}}, {{detail}}) or receive events from SaaS; rules can push to Lambda, SQS, or Step Functions.

### At-least-once and idempotency
- SQS standard, SNS, and Kinesis can all deliver duplicates. There is no true exactly-once end-to-end.
- Consumers must be idempotent: use a business key (orderId + eventType) and a dedup table, or an upsert with conditions.
- Do not assume ordering with standard queue; if ordering per entity is needed, use FIFO with {{MessageGroupId = entityId}}.

### Kinesis vs MSK
- Kinesis: fully managed, shard-based, built-in Lambda/Firehose integration; good for telemetry, clickstream, simple ingestion.
- MSK: real Kafka, fits teams already using Kafka, needs Connect/Streams ecosystem, or complex multi-consumer setups. More operational overhead (broker, storage, monitoring).

### Production pitfalls
- Visibility timeout shorter than processing time: message is processed in parallel multiple times, creating duplicates and increasing DB load.
- No DLQ: poison message retries forever, burning cost and hiding the real error.
- Using SQS as a replayable event log: SQS deletes the message after ack, not replayable; choose Kinesis/Kafka/EventBridge archive.
- FIFO with a single group: completely loses parallelism; split groups by aggregate id.

> Senior tip: every SQS consumer should have a DLQ + alarm on {{ApproximateNumberOfMessagesVisible}} + an idempotency key. When an incident occurs, the DLQ is the fastest place to see "which message is broken and why".`,
    follow: [
      `How long should visibility timeout be compared to processing time?`,
      `When should you choose Kinesis instead of Kafka/MSK?`,
      `How do you ensure processing order per order while keeping parallelism?`
    ],
  },

  'aws-009': {
    q: `Design HA and DR: how is multi-AZ different from multi-region? What are RTO/RPO and how do the DR strategies (backup, pilot light, warm standby, active-active) trade off?`,
    a: `**Summary:** Multi-AZ protects against a single AZ failure within the same region, usually automatic with RTO in minutes; multi-region protects against an entire region failure, more expensive and complex. RTO is the acceptable downtime, RPO is the acceptable data loss. Choose the DR strategy based on these two numbers, not by feeling.

### Definitions
- **RTO** (Recovery Time Objective): target recovery time. E.g., RTO 15 minutes means the system must be running again within 15 minutes.
- **RPO** (Recovery Point Objective): maximum acceptable data loss. RPO 5 minutes means up to 5 minutes of the latest data may be lost.
- Both numbers are decided by the business; engineering only states the cost to meet them.

### Multi-AZ within one region
- RDS Multi-AZ, Aurora multi-AZ, ALB spanning AZs, ASG spanning AZs, S3 already spans AZs.
- Handles: loss of one AZ, DB failover, load balancer switches traffic.
- Does not handle: entire region failure, widespread misconfiguration, control plane region attack.
- Cost: mainly doubled DB infrastructure and some components; app scales normally.

### DR strategies
| Strategy | Description | Typical RTO | RPO | Cost |
|---|---|---|---|---|
| Backup & restore | Only backup to another region, rebuild when needed | Hours to days | Hours | Lowest |
| Pilot light | Core (DB, data) runs hot in secondary region, app is off | Tens of minutes to hours | Minutes | Low-medium |
| Warm standby | Smaller full copy running in secondary region | Minutes | Seconds-minutes | Medium-high |
| Active-active | Both regions serve traffic | Near 0 | Near 0 | Highest |

### Practice
- **Aurora Global Database** replicates storage to a secondary region, RPO about 1 second; can promote the secondary region.
- **DynamoDB global tables** for active-active, but must accept last-writer-wins and handle conflicts at the app layer.
- **Route 53** failover routing with health checks; or latency routing for active-active.
- **S3 Cross-Region Replication** for objects; note replication is asynchronous and may not replicate deletions unless enabled.
- **Infrastructure as Code** must be able to build the secondary region from scratch; if it requires manual steps, DR does not exist.
- Run periodic drills (game day): actually switch regions, measure real RTO, document missing steps.

### Production pitfalls
- Having backups but never testing restore: unverified backup is not a backup.
- Long DNS TTL slows failover even when infrastructure is ready; set low TTL for failover records.
- Different configuration in the secondary region (IAM, secrets, security groups) is only discovered during an incident.
- Active-active without regional data partitioning: write conflicts and cross-region cost spikes.
- Forgetting quotas/service limits in the secondary region: when scaling is needed, you find it was not increased.

> Senior tip: start with RTO/RPO signed by the business, then choose the cheapest strategy that meets it. Most systems do not need active-active; warm standby + IaC + 6-month drills is often a much better balance than doubling infrastructure running in parallel.`,
    follow: [
      `Why is a backup that has never been restored not considered DR?`,
      `What are Aurora Global Database RPO and the promotion steps?`,
      `How do you handle write conflicts in active-active?`
    ],
  },

  'aws-010': {
    q: `Auto Scaling, ALB vs NLB, health check and graceful shutdown: how to make scale-in not drop requests?`,
    a: `**Summary:** ALB understands HTTP/HTTPS (path, host, header) and suits web APIs; NLB operates at TCP/UDP, very low latency, and holds a static IP. Auto Scaling adds/removes instances based on metrics, but scale-in is only safe when combined with deregistration delay, correct health checks, and graceful shutdown in the application.

### ALB vs NLB
| Criteria | ALB | NLB |
|---|---|---|
| Layer | L7 (HTTP/HTTPS, gRPC) | L4 (TCP/UDP/TLS) |
| Routing | Host, path, header, method | Only by port/protocol |
| Static IP | No (uses DNS) | Yes, supports Elastic IP |
| WebSocket | Yes | Yes at TCP layer |
| Latency | Slightly higher | Very low |
| When to use | Web/API, microservices path-based | DB proxy, IoT, game, needs static IP or huge throughput |

ALB fits most Spring Boot backends. NLB is used when a static IP is needed for partners, or for Kafka/DB proxy, or millions of concurrent connections.

### Health check
- ALB health check hits a light endpoint, e.g., {{/health}}, returning 200 when the app is ready to receive traffic.
- Do not make the health check strictly depend on DB: a temporary DB slowdown can mark the whole fleet unhealthy and remove them from LB, turning a small issue into a total outage.
- Conversely, too loose a health check lets traffic into broken instances.
- Distinguish **liveness** (should restart?) from **readiness** (should receive traffic?). For ECS/K8s, readiness is more important.

~~~yaml
HealthCheckPath: /health/ready
HealthCheckIntervalSeconds: 15
HealthCheckTimeoutSeconds: 5
HealthyThresholdCount: 2
UnhealthyThresholdCount: 3
~~~

### Graceful shutdown
- During scale-in, ECS/K8s sends a stop signal; the app must stop accepting new requests, complete running requests, close the pool, then exit.
- Spring Boot: enable {{server.shutdown=graceful}} (default from Boot 3.4) and {{spring.lifecycle.timeout-per-shutdown-phase=30s}}.
- For ECS, set a large enough {{stopTimeout}}; for Kubernetes, set {{terminationGracePeriodSeconds}} and {{preStop}} sleep so the LB has time to deregister.
- **Deregistration delay** of the target group (default 300 seconds) is the draining time for running requests. With ECS, the task is deregistered and waits for the delay before receiving SIGTERM, so a 300-second delay only slows deploy/scale-in. With Kubernetes, the pod receives SIGTERM at the same time it is removed from LB, so a {{preStop}} sleep of a few seconds is needed to avoid receiving new requests while shutting down. Practice is to set 20-60 seconds and increase if requests are long.

### Auto Scaling
- Target tracking is easiest: keep CPU around 60-70%, or ALB {{RequestCountPerTarget}}, or custom metric (queue depth).
- Scale-out should be fast (short cooldown), scale-in slow (long cooldown) to avoid flapping.
- For scheduled workload, use scheduled scaling. For sudden spikes, consider a warm pool or keep enough minimum capacity.
- **Do not scale by memory** if memory does not correlate with load; prefer a metric reflecting real load (RPS, queue depth).

### Production pitfalls
- DB connection pool multiplies by instance count: scaling 5 -> 50 instances can exhaust {{max_connections}}. Use a small pool, RDS Proxy/PgBouncer.
- Health check hitting a DB-heavy endpoint: creates its own load and makes itself unhealthy.
- Scaling the app without scaling downstream: SQS consumer increases 10x but DB locks.
- Forgetting connection draining during deploy: running requests are cut in the middle, users see 502 errors.

> Senior tip: always test scale-in by reducing desired count while under load. If you see occasional 5xx errors during scale-in, the cause is almost certainly deregistration delay + graceful shutdown not aligned - not business logic.`,
    follow: [
      `Why can a DB-dependent health check cause a total system failure?`,
      `How long should deregistration delay be compared to request processing time?`,
      `When should you choose NLB over ALB?`
    ],
  },

  'aws-011': {
    q: `ElastiCache Redis: for which use cases? Cluster mode, eviction policy, and common production errors?`,
    a: `**Summary:** Redis is an in-memory store used for cache, session, rate limit, distributed lock, leaderboard. ElastiCache provides the managed version (Redis OSS or Valkey engine, an open-source Redis-compatible fork that is cheaper). Cluster mode splits data across shards to exceed single-node memory/throughput limits; eviction policy decides what Redis removes when memory is full.

### Use cases
- **Cache-aside**: app reads Redis first, on miss reads DB then writes back with TTL. Most common, easy to get wrong if TTL is not appropriate.
- **Session store**: shared session across instances, TTL by login duration.
- **Rate limiting**: use INCR + EXPIRE or a Lua script for atomicity.
- **Distributed lock**: Redisson or SET NX PX; be careful with split-brain and lock hold time.
- **Leaderboard / light queue**: sorted set, list.

### Cluster mode
- **Disabled**: one primary + replica, data fits in one shard. Simple, fits medium dataset.
- **Enabled**: data split by hash slot (16,384 slots) across multiple shards, each with replicas. Increases memory and throughput horizontally.
- Cluster mode requires a client that supports it (Lettuce has it, Jedis has it). Some multi-key commands only work when keys share a slot, so use a hash tag by putting the common part (e.g., user prefix) inside curly braces at the start of the key.
- **Not fully transparent auto-resharding** when adding nodes; requires online resharding and correct client configuration.

### Eviction
When {{maxmemory}} reaches the threshold, the policy decides:
| Policy | Behavior |
|---|---|
| noeviction | Reject writes, return OOM error (Redis OSS default; ElastiCache parameter group default uses volatile-lru) |
| allkeys-lru | Remove least recently used, all keys |
| volatile-lru | Only delete keys with TTL |
| allkeys-lfu | Remove least frequently used |
| volatile-ttl | Delete keys closest to expiring |

For pure cache, {{allkeys-lru}} or {{allkeys-lfu}} is usually appropriate. If Redis holds data that must not be lost (lock, session) and also serves as cache, use {{volatile-*}} and ensure important keys have no TTL - but best is to separate clusters.

### Production pitfalls
- **Cache stampede**: many requests miss the same hot key simultaneously and all hit the DB. Use a mutex/lock when rebuilding or TTL jitter.
- **Big key**: a key with hundreds of thousands of elements blocks Redis. Split or use a different structure.
- **Hot key**: one key receiving most traffic, bottlenecking a single shard even in cluster mode. Add a local cache or replicate the key.
- Using {{KEYS *}} on production: blocks the entire Redis. Use {{SCAN}}.
- Not setting TTL: memory fills gradually, eviction starts removing important data.
- Treating Redis as a durable database: losing a node can lose unpersisted data; backup/AOF is not a replacement for a transactional DB.

> Senior tip: every cache must answer three questions: what is the TTL, when is it invalidated, and what happens when Redis dies. If the app cannot survive Redis being down, it is no longer a cache but a required dependency - design HA and have a fallback.`,
    follow: [
      `What is cache stampede and how do you avoid it?`,
      `Why is using KEYS dangerous on production?`,
      `When should you enable cluster mode instead of increasing instance size?`
    ],
  }
});
