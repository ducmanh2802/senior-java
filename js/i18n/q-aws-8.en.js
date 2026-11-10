/*
 * English translation of js/data/q-aws.js — task T969. Format: js/core/i18n.js (content overlay).
 * ids: aws-047 aws-048 aws-049 aws-050 aws-051 aws-052 aws-053 aws-054 aws-055 aws-056
 */
App.i18n.content({
  'aws-047': {
    q: 'VPC: route table, NAT Gateway, VPC Endpoint (Gateway vs Interface) — why do NAT costs spike when EC2 calls S3?',
    a: `**Summary:** NAT Gateway is billed per GB of data processed; calling S3 through NAT means paying NAT + S3. Use an S3 Gateway Endpoint (free, just add a route to the route table) so traffic stays inside the AWS network, avoiding NAT and its cost.

### What a route table is
A route table is the "signpost" of a subnet: each row is {destination CIDR -> target}. For example 10.0.0.0/16 -> local (inside the VPC), 0.0.0.0/0 -> nat-xxx (out to the internet). A subnet is associated with one route table.

### NAT Gateway
NAT Gateway sits in a public subnet, has an Elastic IP, and lets a private subnet reach the internet (outbound only). Billing: ~$0.045/hour + $0.045/GB processed. Important: "processed" means every byte going through NAT, including S3.

### VPC Endpoint
- Gateway Endpoint: only for S3 and DynamoDB. Free, adds a route in the route table (pl-xxx -> vpce). Traffic does not go through NAT/the internet.
- Interface Endpoint (PrivateLink): for most AWS services, creates an ENI in the subnet, billed per hour + per GB. Use when you need private access or the service has no Gateway Endpoint.

### Why NAT costs spike with S3
A private-subnet EC2 downloading 1 TB from S3: traffic goes through NAT -> $45 NAT + S3 transfer. With a Gateway Endpoint: $0 NAT (S3 transfer within the same region is free). Many teams forget the endpoint -> huge NAT bill.

### In production
- Symptom: abnormally high NAT Gateway bill, CloudWatch NatGatewayBytesProcessed large.
- Measurement: Cost Explorer filtered to NAT Gateway; metric NatGatewayBytesProcessed.
- Tuning: create an S3 Gateway Endpoint for every VPC whose EC2 calls S3; enable S3 bucket policy requiring the VPC endpoint; use Interface Endpoints for ECR/Secrets Manager if private.
- Pitfall: Gateway Endpoint does not support cross-region; Interface Endpoint needs an SG for the ENI; the default endpoint policy allows all -> tighten it.

### Comparison
| | NAT Gateway | S3 Gateway Endpoint | Interface Endpoint |
|---|---|---|---|
| Cost | $/hour + $/GB | free | $/hour + $/GB |
| Services | all internet | S3, DynamoDB | most AWS |
| Security | out to internet | AWS backbone only | private |

### Real-world example
A team's bill jumped by $4,200 in one month after moving an image-processing service into a private subnet: each pod read/wrote about 90TB/month to S3 through the **NAT Gateway**, paying NAT data-processing fees on every GB. Adding an **S3 Gateway Endpoint** (free, just add a route to the private subnet's route table) — S3 traffic goes straight over the AWS network, NAT fees for that part drop to near zero. Next, Interface Endpoints for ECR (api, dkr), CloudWatch Logs and Secrets Manager because pods pull images and send logs continuously; Interface Endpoints bill per hour and per GB but cheaper than NAT at this volume. Verified with VPC Flow Logs: traffic through NAT dropped 92%. Note: endpoint policy can restrict access to only the company's buckets, improving security.

### Sample interview answer
"Route tables decide where packets from a subnet go: a public subnet has a route to the Internet Gateway, a private subnet routes to a NAT Gateway when it needs to reach outside. NAT Gateway is billed per hour and per GB of data processed, so when EC2 or pods in a private subnet call S3 at high volume, all that traffic goes through NAT and incurs processing fees, spiking the bill. The fix is VPC Endpoints: S3 and DynamoDB have a free Gateway Endpoint, just add a route to the route table; other services like ECR, CloudWatch Logs and Secrets Manager use Interface Endpoints via PrivateLink, which cost money but are cheaper than NAT at high volume, and traffic never leaves the AWS network. I verify with VPC Flow Logs, and use endpoint policy to allow only company resources."

> Senior tip: always create the S3 Gateway Endpoint first when building a VPC; check the NAT bill monthly — if NatGatewayBytesProcessed > 1 TB/month and most of it is S3, you are burning money.`,
    follow: [
      'How do Gateway Endpoint and Interface Endpoint differ, and when do you choose each?',
      'How do you force S3 traffic to go through the VPC endpoint (bucket policy)?',
      'How do VPC Flow Logs help debug routing?'
    ],
  },
  'aws-048': {
    q: 'ALB vs NLB: layer 7 vs layer 4, preserving client IP, idle timeout causing 502/504 with Java app keep-alive',
    a: `**Summary:** ALB understands HTTP (routing by path/host, WebSocket), NLB is layer 4 preserving client IP with low latency. ALB's idle timeout (default 60s) cuts Tomcat/Netty keep-alive connections -> 502/504 if the target keep-alive timeout is shorter than ALB's idle timeout. Fix: set the target keep-alive timeout longer than ALB's idle timeout, or disable keep-alive.

### Layer
- ALB (Application LB): layer 7, HTTP/HTTPS/gRPC/WebSocket. Routing by host, path, header, query. Terminates TLS. WAF integration.
- NLB (Network LB): layer 4, TCP/UDP/TLS. Preserves client IP, latency ~ microseconds, static IP/EIP per AZ. Does not understand HTTP.

### Preserving client IP
- ALB: app sees the ALB's IP; client IP is in the X-Forwarded-For header. Configure Tomcat RemoteIpValve or Spring server.forward-headers-strategy=framework.
- NLB: app sees the real client IP (with target type instance/ip). Good for non-HTTP protocols or when you need the real IP.

### Idle timeout and 502/504
ALB has an idle timeout (default 60s). If the connection between ALB and target is idle longer than the timeout, ALB closes it. If the app (Tomcat keep-alive timeout 20s? Actually Tomcat default keepAliveTimeout ~20s; if the app sets it large) or the client sends a request on a connection ALB already closed -> 502 Bad Gateway or 504 Gateway Timeout.

Symptom: scattered 502/504, often with long-polling, SSE, or batch uploads. ALB logs: target_connection_error_count, http_5xx_count.

### Fix
- Key rule: **target keep-alive timeout must be LONGER than ALB's idle timeout** (ALB default 60s). If the target closes the connection first, ALB still sends a request to it -> 502. Example: set Tomcat {{server.tomcat.keep-alive-timeout=65s}} (longer than 60s).
- For SSE/long-poll: raise ALB idle timeout to 300-3600s (max 4000s) or use NLB.
- Disable keep-alive in the app for short traffic: {{server.tomcat.keep-alive-timeout=1}}.
- Client-ALB: client timeout should be larger than ALB idle timeout so the client does not drop the connection before ALB does.

### In production
- Metrics: ALB TargetResponseTime, HTTPCode_Target_5XX_Count, TargetConnectionErrorCount.
- ALB access log: look for 502/504 and elapsed time.
- Pitfall: health check path returns 200 quickly; deregistration delay (default 300s) waits for connection drain during deploy.

### Real-world example
A Spring Boot service behind an ALB occasionally returned **502** at about 0.1%, with no errors in the application log. Cause: ALB idle timeout was 60 seconds (default), while Tomcat's keep-alive timeout ({{server.tomcat.keep-alive-timeout}}, defaulting to the connection timeout around 20 seconds) was **shorter** — Tomcat closed idle connections while ALB still thought they were usable and sent a new request right when one was closed -> 502. Fix: set Tomcat keep-alive **longer** than ALB idle timeout (e.g. 65 seconds). 502s disappeared. Another service needed the real client IP for fraud detection: with ALB read the {{X-Forwarded-For}} header (configure {{server.forward-headers-strategy}} in Spring Boot); with NLB enable client IP preservation or Proxy Protocol v2.

### Sample interview answer
"ALB operates at layer 7: it understands HTTP, routes by path and host, supports WAF, certificates and sticky sessions, suited for web APIs. NLB is layer 4: it forwards TCP/UDP with very low latency, static IPs, huge throughput, used for non-HTTP protocols or when a fixed IP is needed for partner whitelisting. For client IP, ALB passes it via the X-Forwarded-For header so the app must be configured to read that header; NLB can preserve the original source IP or use Proxy Protocol. Occasional 502s after ALB are usually because the server keep-alive timeout is shorter than ALB's idle timeout: the server closes the connection while ALB still sends requests into it. The fix is to set Tomcat keep-alive longer than ALB's idle timeout."

> Senior tip: the correct order is **target keep-alive timeout > ALB idle timeout** (ALB default 60s) and **client timeout > ALB idle timeout**. If the target closes the connection before ALB, ALB sends requests into a closed connection -> 502. Setting Tomcat {{keep-alive-timeout}} longer than ALB's idle timeout is the most common fix.`,
    follow: [
      'When do you choose NLB instead of ALB for a Java service?',
      'How do you configure Spring Boot to receive the real client IP through ALB?',
      'How does deregistration delay affect deploys?'
    ],
  },
});
App.i18n.content({
  'aws-049': {
    q: 'RDS Multi-AZ failover in practice: DNS, timing, read replica lag, RDS Proxy with Lambda',
    a: `**Summary:** Multi-AZ is synchronous replication to a standby in another AZ; failover changes the DNS endpoint (low TTL) in 1-2 minutes, open connections are dropped -> the app must retry. Read replica is async -> lag. RDS Proxy pools connections, fitting Lambda (many concurrent connections).

### Multi-AZ mechanism
- Primary in AZ A, synchronous standby in AZ B. The standby does not serve reads (standby only). Automatic failover when the primary fails (hardware, AZ outage, patch).
- Failover: promote the standby, change the DNS CNAME endpoint to the new instance. TTL ~5s. Real time 60-120s (detection + promote + DNS propagate). Open connections reset -> SQLException.

### What the Java app must do
- Use a connection pool (HikariCP) with a validation query and retry. Set connectionTimeout, maxLifetime < failover time? In practice: catch SQLException, retry with backoff. Spring @Retryable.
- Multi-AZ does not increase read capacity (the standby does not read). To scale reads -> Read Replica.

### Read replica lag
- Async replication: replica can lag a few ms to a few seconds (or minutes under high load). Reading right after a write -> stale data. Use for reports/analytics, not for critical read-after-write.
- Cross-region replica has higher lag for DR.

### RDS Proxy with Lambda
- Lambda opens a connection per invocation -> thousands of concurrent connections overwhelm RDS. RDS Proxy is a pooler between Lambda and RDS, reuses connections, reduces connection churn, supports IAM auth and faster failover (proxy keeps connections).
- Pinning: transactions or session state (SET, temp tables, advisory locks) prevent the proxy from reusing connections -> loss of benefit. Avoid session-level state.

### In production
- Metrics: DatabaseConnections, ReplicaLag, Failover events (RDS events).
- Test failover periodically (reboot with failover) in a maintenance window.
- Pitfall: app caches DNS for a long time -> after failover it still points at the old instance; set JVM DNS TTL low (networkaddress.cache.ttl=5) or use a proxy.

### Real-world example
RDS PostgreSQL Multi-AZ failover drill: the DB switched to the standby in about 60 seconds, but the Spring Boot application errored for **6 minutes**. Cause: the JVM cached DNS (old image set {{networkaddress.cache.ttl}} to infinite via the legacy security manager), and the HikariCP pool kept dead connections because there was no read timeout — requests hung until the OS TCP timeout. Fix: {{networkaddress.cache.ttl=30}}, set {{socketTimeout}} on the JDBC driver, shorter Hikari {{maxLifetime}}, and bounded retry for connection errors. Next drill: the application recovered about 75 seconds after DB failover. For Lambda groups calling the same DB, switching to **RDS Proxy** keeps client-side connections during failover and further reduces error time.

### Sample interview answer
"RDS Multi-AZ keeps a synchronous standby in another AZ; when the primary fails, RDS points the DNS endpoint at the standby, usually within tens of seconds to about two minutes. Read replica is different: asynchronous replication used to split read load, with lag, and it must be promoted to become primary. The Java application must prepare: the JVM must not cache DNS for long, the pool must drop dead connections quickly via socket timeout and maxLifetime, and there must be bounded retry for connection errors. Otherwise the DB fails over in one minute but the app errors for several minutes. With Lambda, RDS Proxy pools connections and keeps client connections during failover. I always drill failover and measure application-side error time, not just DB-side."

> Senior tip: Multi-AZ is for HA, Read Replica is for read scale — don't confuse them. With Lambda always use RDS Proxy, and check the pinning metric; high pinning means session state is being used and the proxy is useless.`,
    follow: [
      'How do you test RDS failover without user downtime?',
      'When do you use Aurora instead of RDS PostgreSQL?',
      'How do you measure read replica lag and what threshold should alert?'
    ],
  },
});
App.i18n.content({
  'aws-050': {
    q: 'SQS: visibility timeout, at-least-once, FIFO + message group, DLQ and redrive',
    a: `**Summary:** SQS is at-least-once: a message can be delivered multiple times. Visibility timeout hides a message after receive; if processing finishes without delete -> it is received again. FIFO + MessageGroupId guarantees order within a group. DLQ catches messages failing many times; redrive replays them.

### Visibility timeout
When a consumer receives a message, SQS hides it for the visibility timeout (default 30s). The consumer must process and delete the message before the timeout. If it crashes -> the message reappears -> another consumer processes it. If processing exceeds the timeout -> duplicate processing. Set the timeout >= worst-case processing, or extend it (ChangeMessageVisibility) for long work.

### At-least-once
Standard queue: duplicates possible (network retry, timeout). Consumer must be idempotent: use message ID / business key for dedup. FIFO queue: exactly-once processing (dedup within 5 minutes via MessageDeduplicationId) but still at-least-once delivery; the dedup ID prevents duplicates.

### FIFO + Message Group
FIFO guarantees order by MessageGroupId. Multiple consumers can process different groups in parallel, but within the same group processing is sequential. FIFO throughput: 300 msg/s (or 3000 with batching) per queue; partitioned by group.

### DLQ and redrive
- DLQ: receives a message after N failures (maxReceiveCount). Keeps the main queue from being blocked.
- Redrive: after fixing the bug, move messages from the DLQ back to the main queue (redrive) or handle them manually.
- Redrive allow policy: the DLQ must allow the source queue to redrive.

### In production
- Metrics: ApproximateNumberOfMessagesVisible, NumberOfMessagesSent/Received, DLQ depth.
- Alert when DLQ depth > 0.
- Pitfall: visibility timeout too short -> duplicate storm; too long -> retry delay.
- Poison message handling: log payload + message ID, do not retry forever; use DLQ.

### Standard vs FIFO comparison
| | Standard | FIFO |
|---|---|---|
| Order | best-effort | strict per group |
| Throughput | near unlimited | 300-3000/s |
| Dedup | none | 5 minutes |
| Use when | high throughput, no order needed | order / exactly-once needed |

### Real-world example
An SQS consumer sending order confirmation emails: visibility timeout 30 seconds but during peak the email provider call took 40-50 seconds -> the message **reappeared** before processing finished, another consumer picked it up and sent again; customers received 2-3 duplicate emails. Fix: raise visibility timeout to about 6x the max processing time (per the recommendation for Lambda event sources), extend visibility ({{ChangeMessageVisibility}}) for long work, and most importantly make processing **idempotent** by {{orderId}} (a "sent" table). Configure a DLQ with {{maxReceiveCount}} = 5 so a repeatedly failing message does not block the queue; after fixing the provider issue, use **DLQ redrive** to move messages back to the main queue. For flows requiring strict order of order status, use FIFO with {{MessageGroupId = orderId}}.

### Sample interview answer
"SQS delivers messages at-least-once: when a consumer receives a message it is hidden for the visibility timeout; if the consumer does not delete it in time, the message reappears and may be processed again. So visibility timeout must be longer than max processing time, extendable for long work, and the consumer must always be idempotent. The DLQ receives a message after a number of failed receives so a bad message does not block the queue; after fixing, use redrive to return them. Standard queue has near-unlimited throughput but no ordering guarantee; FIFO guarantees order within each message group and dedup within the deduplication window, at the cost of throughput limits. I use FIFO with a message group per entity id when order matters, e.g. order status."

> Senior tip: design the consumer to be idempotent from the start (business key + DB unique constraint) — that is the only way to survive at-least-once. Visibility timeout = processing time * 2 + buffer.`,
    follow: [
      'How do you implement an idempotent consumer with SQS?',
      'When do you use SNS fan-out + SQS instead of Kafka?',
      'Redrive policy and how to replay a DLQ safely?'
    ],
  },
});
App.i18n.content({
  'aws-051': {
    q: 'DynamoDB: partition key, hot partition, adaptive capacity, GSI eventual consistency, single-table design',
    a: `**Summary:** DynamoDB distributes by partition key hash; a hot partition occurs when one key receives large traffic exceeding that partition's capacity. Adaptive capacity self-adjusts but does not save a single hot key. GSI is async -> eventual consistency. Single-table design uses composite keys + overload.

### Partition key and partitions
- Table is partitioned by hash(partition key). Each partition has a throughput limit (~3000 RCU / 1000 WCU) and 10GB storage.
- If the partition key is userId and one user is hot (celebrity) -> hot partition -> throttling even though total capacity remains.

### Adaptive capacity
DynamoDB automatically shifts unused capacity from cold partitions to hot ones. But if a single partition key exceeds the partition's hard limit, adaptive is not enough -> redesign the key (sharding, random suffix).

### Hot partition fix
- Choose a high-cardinality key (userId + timestamp bucket).
- Write sharding: add a random suffix (0-9) to the PK for write-heavy workloads; reads must query all shards.
- Use on-demand capacity or provisioned with auto-scaling.

### GSI eventual consistency
- GSI replicates asynchronously from the base table. Write to base -> GSI updates after a few ms. Read GSI right after a write -> may not see it. Do not use GSI for critical read-after-write; use base table query or strongly consistent read (base table only).
- GSI has its own throughput; a hot GSI also throttles.

### Single-table design
- One table holds multiple entity types, using PK/SK composite. Example PK=USER#123, SK=PROFILE; PK=USER#123, SK=ORDER#456. Query with begins_with.
- GSI overload: GSI1PK/GSI1SK for another access pattern. Reduces number of tables, ACID transactions within the same table.

### In production
- Metrics: ConsumedRead/WriteCapacityUnits, ThrottledRequests, UserErrors.
- CloudWatch Contributor Insights finds hot partitions.
- Pitfall: scanning the whole table -> large cost; always query with a key.

### Real-world example
A DynamoDB table storing IoT events with partition key {{date}} (e.g. "2026-11-07"): all writes during the day pile into **one partition key** -> throttling even though total capacity is far from exhausted (per-partition limit ~1,000 WCU and 3,000 RCU). Adaptive capacity helps partially but cannot save a single key receiving all traffic. Fix: partition key = {{deviceId}}, sort key = {{timestamp}}; the query "all events in a day" moves to a GSI with **write sharding** ({{date#shard}}, shards 0-9) and reads run in parallel across 10 shards. Throttling drops to 0. Another bug: reading from GSI right after a write does not see the data — because GSI is always **eventually consistent**; flows needing read-after-write must read the base table with strongly consistent read.

### Sample interview answer
"DynamoDB distributes data by hash of the partition key, each partition having its own throughput limit, so partition key design determines scalability. Keys with few values or concentrated traffic, such as date or status, create hot partitions and get throttled even though total capacity remains. Adaptive capacity redistributes to hot partitions but cannot save a single key receiving all traffic; then I choose a high-cardinality key like user or device id, or write sharding with a random suffix and parallel reads. GSI is always eventually consistent so it is not used for read-after-write flows. Single-table design groups multiple entity types into one table by access pattern, reducing calls, but access patterns must be known upfront and are hard to change later."

> Senior tip: DynamoDB rewards good key design and punishes bad; before coding, list access patterns then design PK/SK. Hot partition is a design bug, not a capacity bug.`,
    follow: [
      'When do you use DynamoDB instead of RDS?',
      'How do you debug a hot partition with CloudWatch?',
      'Single-table design trade-offs vs multi-table?'
    ],
  },
});
App.i18n.content({
  'aws-052': {
    q: 'IAM policy evaluation logic: explicit deny, SCP, permission boundary, role for workload',
    a: `**Summary:** IAM (Identity and Access Management — AWS's service for managing identities and permissions) evaluates permissions by the principle that "explicit deny wins everything" (an explicit deny always wins), then a matching "allow" is needed and it must not be blocked by SCP (Service Control Policy — a policy limiting at the AWS Organizations level) or permission boundary (the maximum permissions a user/role may have). For a request to be allowed: **no deny** matches, there is an **allow** from identity policy or resource policy, and that allow is **permitted by SCP and boundary**. Understanding this logic helps grant correct (least privilege — minimum needed) permissions to workloads (applications running on EC2/ECS/Lambda/EKS).

### What: policy types and roles
- **Identity-based policy**: attached to an IAM user, group, role (e.g. an ECS task role). Says "this principal may/may not do X on resource Y".
- **Resource-based policy**: attached to a resource (S3 bucket policy, SQS queue policy, KMS key policy). Says "who may access this resource". Supports cross-account clearly.
- **SCP (Service Control Policy)**: applied at AWS Organizations (OU/account). SCP **does not grant** permissions, only sets the maximum ceiling; even an admin in the account cannot exceed an SCP deny/non-allow.
- **Permission boundary**: policy attached to a user/role to cap the maximum permissions that principal can be granted (even if identity policy is broader). Useful when delegating role creation to teams while still controlling them.
- **Session policy**: further restricts when assuming a role (e.g. STS session) — narrows, never widens.
- **Explicit deny**: a statement with {{Effect: Deny}} matching action/resource/condition. **Implicit deny**: the default denial when there is no Allow.

~~~seq
title: IAM evaluation flow (simplified)
actors: Principal | IAMEngine | SCP | Resource
Principal -> IAMEngine: Call API (e.g. s3:GetObject)
IAMEngine -> SCP: Any explicit Deny or no Allow?
SCP --> IAMEngine: SCP blocks -> Deny
IAMEngine -> Resource: Check resource policy
Resource --> IAMEngine: Allow/Deny per policy
note IAMEngine: Explicit Deny anywhere -> Deny
IAMEngine --> Principal: Allow if it passes all layers
~~~

### Why evaluation works in this order
AWS designed "deny priority" for safety: as long as one protection layer says "no", it is blocked, preventing exposure from a misconfigured policy. Mechanism (simplified for the common case):
1. **Explicit Deny?** If any Deny matches in identity policy, resource policy, SCP, boundary or session policy -> **Deny** immediately.
2. **Matching Allow?** Need an Allow from identity policy and/or resource policy (depending on same-account/cross-account and service type). If no Allow -> **Implicit Deny**.
3. **SCP allows?** SCP must not block (in an allow-list SCP model, the action must be Allowed; in a deny-list model, not Denied). If blocked -> **Deny**.
4. **Permission boundary allows?** Boundary must Allow that scope. If not -> **Deny**.
5. Pass all -> **Allow**.

Cross-account note (e.g. accessing an S3 bucket in another account): usually needs **both** identity policy on the principal side to allow **and** resource policy on the bucket side to allow (and still subject to SCP/boundary).

### Applying to workloads (role for the application)
- **EC2**: instance profile attaches an IAM role; app uses AWS SDK to get temporary credentials from metadata.
- **ECS/Fargate**: task role (permissions for the app to call AWS) separate from task execution role (permissions for ECS to pull images, write logs). This is a commonly confused point.
- **Lambda**: execution role.
- **EKS**: IRSA or EKS Pod Identity to attach a role per ServiceAccount/pod.
Principle: grant exactly the action/resource (avoid {{*}}), add {{Condition}} where appropriate ({{aws:SourceVpc}}, {{aws:PrincipalTag}}, {{kms:ViaService}} constraint...), separate roles per service (payment does not share a role with reporting).

### Real-world example
Multi-account banking platform (AWS Organizations): a workload account running an ECS service writes files to S3 in the same account and reads secrets from Secrets Manager. Incident: deploying a new version got {{AccessDenied}} on {{s3:PutObject}}, even though the task role "looked sufficient".
- CloudTrail shows {{errorCode AccessDenied}}, {{userIdentity}} is task role {{arn:aws:iam::111122223333:role/pay-svc-task}}.
- Identity policy of the role has {{s3:PutObject}} on {{arn:aws:s3:::pay-bucket/*}} -> an Allow exists.
- Bucket policy: no Deny.
- **Permission boundary** attached to the role (applied by the platform team for delegation): boundary only allows {{s3:GetObject}}, no {{s3:PutObject}} -> boundary blocks despite the identity Allow.
- SCP at the OU: no S3 deny.
- Fix: update the boundary (through the review process) to add {{s3:PutObject}} for the exact prefix {{inbox/*}}; add a {{Condition}} restricting it. After applying, the request succeeds. Also add permission tests in the pipeline (IAM Policy Simulator / integration tests) to detect early.
- Result: no more {{AccessDenied}}, audit records why the boundary changed.

### Production pitfalls
- **Wildcard {{Action:*}} / {{Resource:*}}**: convenient in dev but high risk; use Access Analyzer and periodic review to narrow.
- **Confusing execution role and task role (ECS)**: app lacks permissions because policy is attached to the wrong role.
- **Forgetting SCP/boundary**: debugging only identity policy leaves you "stuck". Always check all layers.
- **Implicit resource policy deny**: bucket policy has a {{Deny}} not matching VPC endpoint/KMS condition -> confusing errors.
- **Credential precedence on EC2/EKS**: app accidentally uses env credentials instead of the intended role.

### Sample interview answer
"I understand IAM evaluation by the principle that explicit deny wins everything. For a request to be allowed, first no Deny may match in identity policy, resource policy, SCP or permission boundary; then there must be a matching Allow, and that Allow must not be blocked by SCP or permission boundary. SCP at Organizations sets the ceiling for the whole account, while permission boundary sets the ceiling for each user or role. When granting permissions to workloads like ECS or Lambda, I use a dedicated role, separate task role and execution role on ECS, apply least privilege, avoid wildcards and add conditions when needed. When I hit AccessDenied, I read CloudTrail to find the real principal and action, then check identity policy, resource policy, SCP and boundary in order — because very often the cause is a boundary or SCP blocking, not a missing Allow."

> Senior tip: design IAM like code: version control, review changes, use permission boundaries for self-service models, and set SCP denies for dangerous actions (disabling CloudTrail, deleting logs). When debugging {{AccessDenied}}, always read CloudTrail first — 80% of causes are condition, boundary or SCP.`,
    follow: [
      'How do permission boundary and SCP differ?',
      'How do you audit unused permissions in AWS?',
      'Which condition keys are commonly used to restrict by VPC/tag?'
    ],
  },
});
App.i18n.content({
  'aws-053': {
    q: 'IRSA / EKS Pod Identity: role for pod, why not use the node instance profile',
    a: `**Summary:** IRSA uses OIDC federation: a pod has a service account annotated with an IAM role ARN; kubelet injects a token (JWT) into the pod, AWS STS AssumeRoleWithWebIdentity exchanges the token for AWS credentials. Pod Identity is a newer, simpler mechanism (agent on the node). Do not use the node instance profile because all pods share the same permissions -> violates least privilege.

### Problem with node instance profile
Every pod on a node uses the node's same instance profile -> if one pod is compromised, the attacker gets all of the node's permissions (S3, DynamoDB...). Cannot distinguish pods.

### IRSA (IAM Roles for Service Accounts)
- EKS cluster has an OIDC provider (IAM identity provider).
- Create an IAM role with trust policy: Principal = OIDC provider, condition StringEquals sub = system:serviceaccount:ns:sa.
- Annotate the K8s ServiceAccount with eks.amazonaws.com/role-arn.
- Pod using that SA: webhook injects env AWS_ROLE_ARN and AWS_WEB_IDENTITY_TOKEN_FILE (JWT mounted).
- AWS SDK automatically calls STS AssumeRoleWithWebIdentity -> temporary credentials. Rotates automatically.

### EKS Pod Identity
- Newer mechanism (2023): agent (eks-pod-identity-agent DaemonSet) on the node intercepts AWS SDK calls, assumes role based on Pod Identity Association mapping (namespace+SA -> role). No OIDC, no SA annotation. Simpler, supports session tags, fast revocation.

### Comparison
| | IRSA | Pod Identity |
|---|---|---|
| Setup | OIDC provider + trust policy condition | association API |
| Annotate SA | required | not required |
| Revocation | delete SA/role | delete association |
| Recommendation | legacy | preferred for new clusters |

### In production
- Principle: one role per service (payment-service, order-service), not shared.
- Trust policy condition must be tight (namespace + SA name), avoid wildcards.
- CloudTrail logs AssumeRoleWithWebIdentity with pod source IP.
- Pitfall: pod without an annotated SA -> falls back to node role -> vulnerability. Enforce via admission policy (OPA/Kyverno) requiring the SA to have a role.

### Real-world example
An EKS cluster attached S3 permissions to the **node's instance profile**: every pod on the node — including a marketing service — could read the bucket holding customer records. A security test compromised a pod through a library vulnerability and called S3 using credentials taken from instance metadata (IMDS). Fix: move each service to **EKS Pod Identity** (or IRSA): each ServiceAccount gets a role with access only to the needed bucket/prefix; block pod access to node metadata (set IMDSv2 hop limit = 1 or use NetworkPolicy) so pods cannot fetch the node's credentials; remove S3 permissions from the node role. In the next test, a compromised pod only had that service's own permissions.

### Sample interview answer
"If permissions are attached to the node's instance profile, every pod running on that node has those permissions, so one compromised pod exposes all of them. I attach permissions per pod. IRSA uses the cluster's OIDC provider: the ServiceAccount is annotated with a role, and the SDK exchanges the ServiceAccount token for temporary credentials via AssumeRoleWithWebIdentity. EKS Pod Identity is newer and simpler: an agent runs on the node and links ServiceAccount to role through the EKS API, with no need to manage OIDC providers per cluster and easy reuse of roles across clusters. Either way, I also block pods from reaching node metadata using IMDSv2 with hop limit 1 or NetworkPolicy, and remove application permissions from the node role."

> Senior tip: IRSA/Pod Identity is "zero-trust for pods": credentials live in pod memory, rotate automatically, no secret mounted. Combine with network policy and read-only root filesystem to harden.`,
    follow: [
      'How do IRSA trust policy conditions StringEquals vs StringLike differ?',
      'How do you migrate from IRSA to Pod Identity?',
      'How do you debug a pod with no AWS permissions?'
    ],
  },
});
App.i18n.content({
  'aws-054': {
    q: 'RDS Proxy with Lambda and Aurora storage 6 copies: failover and connection pooling',
    a: `**Summary:** Aurora storage is a distributed volume with 6 copies across 3 AZs, self-repairing; failover only promotes a reader (10-30s) because data is shared. RDS Proxy in front of Lambda pools connections, avoiding connection storms and shortening perceived failover. Combination: Aurora + Proxy for serverless workloads.

### Aurora storage
- Distributed volume, 6 copies across 3 AZs (2 per AZ). Self-healing: if one copy is damaged, it rebuilds from the others. No data loss if up to 2 copies are lost.
- Storage auto-grows up to 128 TB, no provisioning needed.
- Write quorum 4/6, read quorum 3/6 -> high durability.

### Aurora failover
- Primary fails -> promote an Aurora Replica to primary. Because storage is shared, no data copy needed -> failover 10-30s (vs RDS 60-120s). Cluster endpoint (writer/reader) updates automatically.
- Reader endpoint load-balances read traffic.

### RDS Proxy + Lambda
- High Lambda concurrency -> each invocation opens a DB connection -> RDS connection limit (max_connections by instance size) exhausted -> timeout. Proxy is a pooler: Lambda connects to proxy (fast, many), proxy holds few connections to DB.
- Proxy supports IAM auth (no password in code) and fast failover: proxy detects primary failure and routes to the new primary, app does not need to reconnect.
- Pinning: transactions, session variables, advisory locks, temp tables pin a connection -> reduced reuse. Avoid SET SESSION; use transaction-level.

### In production
- Metrics: DatabaseConnections, Proxy client connections, pinning count (CloudWatch metric DatabaseConnections for the proxy).
- Alert: pinning > 5% connections -> review code.
- Pitfall: long transactions hold connections -> pool exhaustion; set timeouts.

### RDS vs Aurora comparison
| | RDS | Aurora |
|---|---|---|
| Storage | EBS, single AZ (Multi-AZ standby) | distributed 6 copies |
| Failover | 60-120s | 10-30s |
| Read scale | read replica (async lag) | Aurora Replica (lag < 10ms) |
| Cost | cheaper | more expensive |

### Real-world example
An API using Lambda calling Aurora PostgreSQL: during a promotion, Lambda concurrency reached 800, each execution environment opened its own connection -> Aurora hit max_connections, mass "too many connections" errors. Adding **RDS Proxy**: Lambda connects to the proxy, proxy uses about 100 real connections to the DB; authentication via IAM instead of passwords in env vars. During a later Aurora failover, the proxy kept Lambda-side connections and switched to the new writer, clearly reducing application error time compared to direct connections. Caution: code setting session variables ({{SET}}) causes the proxy to **pin** the connection, losing pooling benefit — monitor the pinning metric and remove those statements.

### Sample interview answer
"Aurora separates compute from storage: data is written as six copies across three AZs at the storage layer, so losing an AZ or a few copies still allows reads and writes, and read replicas share storage so lag is usually very low. When the writer fails, Aurora promotes a replica to writer, usually within about a minute, and the cluster endpoint points to the new writer. Lambda has its own problem: each execution environment opens a connection, so high concurrency exhausts max_connections. RDS Proxy pools connections, keeps client connections during failover, and supports IAM authentication. I monitor the proxy's pinning, because session variables or session-level features force the proxy to pin a connection to that client."

> Senior tip: for Lambda + DB, always use RDS Proxy + Aurora; the pinning metric is a key KPI — high pinning means the proxy is being disabled.`,
    follow: [
      'How does Aurora Replica lag differ from RDS read replica?',
      'How do you reduce pinning in RDS Proxy?',
      'When is Aurora Serverless v2 appropriate?'
    ],
  },
});
App.i18n.content({
  'aws-055': {
    q: '(SA case study) The company AWS bill rose from 18,000 to 31,000 USD in one month while traffic only rose 10%. The director demands an explanation and a reduction plan within 2 weeks. How do you investigate and handle it?',
    a: `**Summary:** I treat this as an incident with a process: **narrow down** with Cost Explorer (by service -> account -> usage type -> tag), find the **2-3 cost lines that grew the most** (usually 80% of the increase), find the **technical root cause** of each line (NAT, cross-AZ data transfer, logs, forgotten resources, autoscaling config), fix in order of "fast - safe - large", then build **prevention mechanisms**: mandatory tags, per-team budgets, Cost Anomaly Detection, cost review in the design process.

### Step 1 — Narrow down in 1-2 days
- **Cost Explorer**: compare this month vs last by *Service*, then *Usage type* (e.g. {{NatGateway-Bytes}}, {{DataTransfer-Regional-Bytes}}, {{DataProcessing-Bytes}} of CloudWatch Logs).
- **CUR / Data Exports** into Athena when detail by resource ID and hour is needed (know exactly which day it started rising -> compare with deploy calendar).
- Filter by **tag** team/service; a large "untagged" share is a finding on its own.

### Step 2 — Common causes and how to confirm
| Rising cost line | Common cause | How to confirm |
|---|---|---|
| NAT Gateway (data processing) | Pods pulling images, calling S3/DynamoDB through NAT | VPC Flow Logs by destination; missing VPC endpoint |
| Cross-AZ data transfer | Service calls across AZs, Kafka/DB replica in another AZ | Usage type {{DataTransfer-Regional-Bytes}} |
| CloudWatch Logs ingestion | DEBUG enabled, request bodies logged | Log group with sudden ingest spike |
| EC2/EBS | Forgotten test environments, orphaned volumes/snapshots | Trusted Advisor, Compute Optimizer, missing owner tag |
| RDS | Instance upsized "temporarily" not downsized, excess provisioned IOPS | Sustained low CPU/IOPS metrics |

### Step 3 — Real-world example (real analysis)
The $13,000 increase comprised:
- **NAT Gateway +$5,200**: after moving to EKS, each node pulled a 1.2GB image from ECR through NAT on every scale (autoscaler created/deleted nodes continuously). Fix: VPC endpoint for ECR, S3 (free gateway endpoint), smaller images, more stable nodes.
- **CloudWatch Logs +$3,800**: one service enabled DEBUG and logged full payloads, 9TB/month. Fix: back to INFO, sampling, 14-day retention, low-value logs to S3.
- **Cross-AZ data transfer +$2,100**: Kafka consumer reading from a broker in another AZ. Fix: enable {{client.rack}} (read from follower in same AZ).
- **Forgotten environments +$1,600**: 3 load-test clusters running all month. Fix: TTL tag + Lambda auto-shutdown outside hours.
Next month's bill returned to $17,400 (lower than before the incident) with no performance impact.

### Step 4 — Prevention
- Mandatory tags (owner, service, env) via SCP/Tag Policy; untagged resources are warned.
- **AWS Budgets** per account/team, **Cost Anomaly Detection** alerting via Slack same day.
- Weekly cost dashboard per service sent to each team (showback).
- Add a cost question to design review: "how many GB/month does this data flow move through NAT, across AZ, across region?".

### Sample interview answer
"I handle a cost spike like an incident. First narrow down with Cost Explorer by service, then usage type, then tag, and use Cost and Usage Report in Athena to know exactly which day it started rising and which resource, comparing with the deploy calendar. Usually two or three lines account for most of the increase. Then find the technical root cause per line: NAT gateway rising because of missing VPC endpoint for S3 or ECR, cross-AZ data transfer because a service or consumer calls across AZs, CloudWatch Logs rising because someone enabled DEBUG, forgotten test resources. I fix in order of fast and safe first, measuring after each change. Finally mechanisms so it does not repeat: mandatory tags, budgets and Cost Anomaly Detection alerting same day, per-team cost reporting, and a cost question in design review."

> Senior tip: track **cost per business unit** (USD per 1,000 transactions, per active customer) as the monitored metric. Total bill rising with business growth is normal; rising cost per transaction is the architectural problem.`,
    follow: [
      'Why is cross-AZ data transfer often overlooked, and how do you reduce it without sacrificing HA?',
      'Savings Plans and Reserved Instances: when do you commit, and what percentage?',
      'How do you get teams to own their costs (showback/chargeback)?'
    ],
  },
});
App.i18n.content({
  'aws-056': {
    q: '(SA case study) You design a B2B SaaS platform on AWS for 800 companies, where 5 large customers require strong data isolation and dedicated performance commitments. Do you choose silo, pool or bridge, how do you isolate tenants, and how do you charge cost per tenant?',
    a: `**Summary:** I use a **hybrid (bridge)** model: most tenants run in **pool** (shared infrastructure, data separated by tenant_id + tenant-aware access control), large customers or those with compliance requirements run in **silo** (dedicated account/VPC/DB, same codebase and pipeline). Isolation in pool has multiple layers: **identity carrying tenant** (claim in token), **attribute-based IAM (ABAC) with session tags** so each request can only access that tenant's data, RLS or tenant partition key at the data layer. Cost per tenant is measured by **application metering** combined with tags/accounts for silo.

### The three models
| Model | Isolation | Cost / tenant | Operations | Fits |
|---|---|---|---|---|
| Silo | Strongest (dedicated account/DB) | High | Many deployments | Large customers, legal requirements |
| Pool | Logical (tenant_id, IAM, RLS) | Low | One deployment | Most small and mid customers |
| Bridge | Combined by layer or customer group | Medium | More complex | Most real-world cases |

### Isolation in pool — multiple layers
1. **Identity**: users log in via Cognito/IdP; token carries {{tenant_id}}; API Gateway/application never trusts tenant_id sent by the client.
2. **IAM ABAC**: service assumes a role with a **session tag** {{tenant_id}}; policy only allows access to DynamoDB items whose partition key starts with that tenant (condition {{dynamodb:LeadingKeys}}) or the tenant's S3 prefix — even a code bug forgetting the condition cannot read another tenant's data.
3. **Data**: PostgreSQL RLS by tenant (session variable set at the start of the transaction), or separate schema/DB for large tenants; dedicated KMS key for tenants that require it.
4. **Noisy neighbor**: rate limit and quota per tenant (API Gateway usage plan, or token bucket in the app), separate queues per tenant for heavy jobs.

### Silo for large customers
Each large customer gets a **dedicated AWS account** in its own OU, built with the same Terraform module/pipeline (automated tenant onboarding); deploy in "waves": pool first, silo later, and large customers may stay one version behind per contract.

### Cost per tenant
- Silo: dedicated account -> cost visible in Cost Explorer.
- Pool: application **records usage metrics per tenant** (request count, estimated CPU time, GB stored, AI tokens) then allocates shared cost by ratio. Result used for pricing tiers and detecting loss-making tenants.

### Real-world example
An accounting SaaS initially ran 100% pool. When signing a large enterprise, they required a dedicated DB, dedicated encryption key and dedicated SLA; another customer's year-end reports slowed every tenant by 40 minutes. Moved to bridge: 6 large customers to silo (dedicated account, Aurora, KMS key), pool for the remaining 790 customers with ABAC + RLS and per-tenant report quotas. Metering showed 3% of tenants consumed 41% of pool cost -> pricing adjusted by usage. No more "one tenant slows the whole system".

### Sample interview answer
"I usually choose the hybrid model. Most small and mid tenants run in pool to optimize cost and operations; large customers or those with compliance requirements run in silo with dedicated account, DB and encryption key, but the same codebase and pipeline, onboarding automated with Terraform. In pool I isolate in multiple layers: tenant comes from the token, not trusted from the client; the service accesses data through a role with a tenant session tag, IAM policy only allows reading that tenant's partition or prefix, so a code bug cannot leak another tenant's data; the DB layer adds RLS. Noisy neighbor is handled by per-tenant quotas and rate limits. Silo cost is visible per account, pool cost is allocated by application usage metrics per tenant, used for pricing and detecting loss-making tenants."

> Senior tip: write an automated test "tenant A cannot see tenant B's data" running on **every** API and background job, on every deploy. Cross-tenant leakage is an incident that can end a SaaS business, and it usually appears where few expect it: exports, caches, search indexes.`,
    follow: [
      'How do you move a tenant from pool to silo without downtime?',
      'How do you isolate per tenant in caches and search indexes (ElastiCache, OpenSearch)?',
      'How do you safely deploy a new version to hundreds of silo tenants?'
    ],
  },
});
App.i18n.content({
});
