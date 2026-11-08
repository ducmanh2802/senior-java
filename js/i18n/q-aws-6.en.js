/*
 * English translation of js/data/q-aws.js — task T1146. Format: js/core/i18n.js (content overlay).
 * ids: aws-031 aws-032 aws-033 aws-034 aws-035 aws-036 aws-037 aws-038 aws-039 aws-040
 */
App.i18n.content({
  'aws-031': {
    q: 'Route 53 supports A, AAAA, CNAME, Alias and MX/TXT records. Why can a CNAME not be placed at the apex (root domain), and how does TTL affect a cutover?',
    a: `**Summary:** DNS on Route 53 has A/AAAA (name -> IP), CNAME (name -> another name), MX (mail server), TXT (verification) and Alias (Route 53-specific). A CNAME cannot sit at the apex because the DNS standard forbids a CNAME from coexisting with other records at the same name; use an Alias instead. TTL must be lowered before a cutover so clients pick up the new value quickly, then raised again once stable to cut DNS cost and load.

### What each record does
- **DNS resolver**: the component that answers "what IP is this name?" (your machine, ISP DNS, or a public resolver). It caches answers for the TTL.
- **A**: name -> IPv4 (e.g. 203.0.113.10). **AAAA**: name -> IPv6.
- **CNAME (Canonical Name)**: name -> another name; the resolver then asks again for the target name. Example: www.example.com -> app-alb-123.ap-southeast-1.elb.amazonaws.com.
- **MX (Mail Exchange)**: declares the mail server for a domain with a priority (lower number = higher priority) for mail failover.
- **TXT**: free-form text used for SPF/DKIM/DMARC (anti-spoofing email) and domain ownership verification.
- **Alias (Route 53)**: an AWS-specific record that looks like A/AAAA but points at an AWS resource (ALB, CloudFront, S3 website, API Gateway, another Route 53 record). Route 53 tracks the resource's IPs; Alias queries are usually free and Alias works at the apex.

### Why a CNAME cannot sit at the apex
The apex is the root of the zone, e.g. example.com. Per RFC 1034/1912, a name that has a CNAME must not have any other record of the same name, because CNAME means "this name is only an alias for that other name". But the apex must carry NS (Name Server) and SOA (Start of Authority) records. Putting a CNAME at the apex collides with NS/SOA; resolvers may return SERVFAIL or behave unpredictably, risking both the website and email (MX). Therefore:
- Apex: use an **Alias A/AAAA** pointing at ALB/CloudFront (or a static A if the target is a fixed IP).
- Subdomains such as www or api: use CNAME (or Alias). Common practice: Alias apex -> ALB, CNAME www -> apex or the same ALB.

### How TTL affects a cutover
TTL (seconds) is how long an answer may stay cached. A DNS cutover changes a record to point at the new system (e.g. a new ALB or region). Steps:
1. **24-48 hours before cutover**: lower the TTL of the affected records to 60-300s. This must happen earlier than the old TTL (if the old TTL was 86400s = 24h, lower it at least 24h ahead so stale caches expire).
2. **Cutover**: change the record value (new IP or new Alias target).
3. **Propagation**: resolvers whose cache expired re-query and get the new value. Real-world time is roughly "remaining old TTL + new TTL". Note some ISPs/devices enforce a minimum TTL (e.g. 300s) even if you set 60s.
4. **After stability (a few hours to a day)**: raise TTL to 3600-86400s to reduce DNS query count (Route 53 charges per query, except Alias to some AWS resources) and load.

Alias TTL is managed by AWS (typically 60s for ALB/CloudFront), so cutovers through Alias are usually faster and less dependent on the TTL you set.

### Common pitfalls
- Forgetting to lower TTL **before** cutover: clients keep the old IP for the whole old TTL, so some users hit the new system and some the old one - very hard to debug.
- Forgetting dependent records in a CNAME/Alias chain (www -> apex, apex -> new ALB): miss one link.
- Putting a CNAME at the apex out of habit from another DNS provider: some providers "flatten" CNAMEs, but that is not standard behaviour; on Route 53 use Alias.
- Breaking MX/TXT when changing zones: email stops receiving - always check MX, SPF, DKIM after cutover.

> Senior tip: Before every DNS cutover, record the current value and TTL, verify propagation with dig +trace, and keep a rollback path (old system still running) for a few hours. For a bank, DNS is the fastest rollback point but also the easiest place to cause cascading failures if MX/TXT are forgotten.`,
    follow: ['How do weighted, latency-based and failover routing policies differ in Route 53?', 'How do Route 53 health checks work and when does failover kick in?', 'When migrating a domain from on-prem DNS to Route 53, in what order do you do the steps to avoid downtime?']
  },
  'aws-032': {
    q: 'A request through the ALB returns HTTP 400 while the backend is still alive and traffic is heavy. What are the possible causes, and how do you tell an ALB-generated response from a target-generated one using metrics and access logs?',
    a: `**Summary:** HTTP 400 through an ALB (Application Load Balancer, AWS layer-7 HTTP/HTTPS load balancer) can come from the ALB itself (malformed request/header, abnormal Host header, oversized header/URI, HTTP desync mitigation blocking) or from the target (backend app, e.g. Spring Boot) returning 400 (validation failure, bad JSON). Tell them apart with two CloudWatch metrics: HTTPCode_ELB_4XX_Count (generated by the ALB) and HTTPCode_Target_4XX_Count (returned by the target), combined with ALB access logs (elb_status_code vs target_status_code).

### What the two sources are
- **ALB (layer 7)** receives HTTP from the client, performs basic validity checks, then forwards to the target (EC2/ECS/IP). If the request violates HTTP rules or ALB limits, the ALB returns an error **without ever calling the target**.
- **Target** is your application (Spring Boot). If the request reaches the app but the data is wrong (missing field, bad JSON syntax, wrong CSRF token), the app returns 400.

Correctly identifying the source decides the direction of investigation: edge/client/WAF issue vs code/validation issue. Getting it wrong wastes hours reading app logs while the request never reached the app.

### Causes where the ALB answers 400 (ELB-side)
- **Invalid headers**: control characters, newlines inside a header, wrong format. Related to HTTP request smuggling attacks.
- **HTTP desync mitigation**: the ALB detects an ambiguous request (e.g. both Content-Length and Transfer-Encoding present in a dangerous way) and blocks it for safety.
- **Size limits exceeded**: total headers typically limited to ~16 KB, URI ~16 KB (check current ALB limits). Oversized cookies/JWTs are a common cause.
- **Host header** missing or not matching the routing rules the configuration requires.
- **HTTP method/version** not supported in the given context.

### Causes where the target answers 400 (Target-side)
- Spring @Valid / Bean Validation failure, @RequestBody JSON parse error, enum mismatch.
- Missing Content-Type: application/json when the API requires it.
- Wrong CSRF token (traditional web apps), wrong request signature (HMAC-signed APIs).

### Telling them apart with metrics and access logs
1. **CloudWatch metrics** (set alarms early):
   - HTTPCode_ELB_4XX_Count: 4xx generated by the ALB. A sudden spike while target 4xx stays flat -> problem at the edge/request.
   - HTTPCode_Target_4XX_Count: 4xx returned by the target. Rising -> look at validation/app logs; possibly a newly deployed client or dirty data.
   - Compare the two series over the same 1-minute window to narrow down in ~30 seconds.
2. **ALB access log** (stored in S3, a few minutes of delay): each line has elb_status_code and target_status_code. If target_status_code is "-" (or no target), the ALB did not forward -> ELB-side. Filter by time, client:port, request_url, user_agent to reproduce.
3. **Application tracing**: if it is a target 400, find the traceId/requestId in Spring logs to see the exception (MethodArgumentNotValidException, HttpMessageNotReadableException).

### Common pitfalls
- Cookies accumulating (tracking, A/B tests) make headers grow -> random 400s depending on the user.
- Reproducing with a minimal curl but forgetting to send the "dirty" real header -> no reproduction.
- ALB access logs lag ~5 minutes: use metrics first during an incident, logs later to confirm.
- WAF attached to the ALB: WAF can return 403/400 per its rules; check WAF logs in parallel.

> Senior tip: Always enable ALB access logs and set alarms on both HTTPCode_ELB_4XX_Count and HTTPCode_Target_4XX_Count. In the first 30 seconds of an incident, comparing the two metrics tells you "error at the door" vs "error in the house" and prevents investigating the wrong layer.`,
    follow: ['How do ALB 502/503/504 responses differ and what causes each?', 'How do you configure connection draining and deregistration delay?', 'When do you use an NLB instead of an ALB (TCP/UDP, static IP, PrivateLink)?']
  },
  'aws-033': {
    q: 'Moving data between regions: S3 Cross-Region Replication, data transfer costs, and the options for databases (cross-region read replica, Aurora Global Database, DMS).',
    a: `**Summary:** For objects, use S3 Replication (Cross-Region Replication, requires versioning; optionally enable Replication Time Control for a 99.99% within-15-minutes SLA). For databases: cross-region read replica (RDS) for serving reads near users and simple DR; Aurora Global Database for DR with replication lag usually under 1s and fast failover; DMS when you need conversion, filtering or a different engine. Always budget cross-region data transfer (charged per GB, multiplied by replication volume) - it is usually the biggest surprise on the bill.

### How S3 Replication works
- Requires **versioning** on both source and destination buckets; replication runs asynchronously for objects written **after** it is enabled (pre-existing objects need S3 Batch Replication).
- Can change storage class at the destination (e.g. Glacier for DR copy), change owner, replicate to another account (good protection against deletion if the source account is compromised).
- **Delete markers** are not replicated by default (configurable); version deletes are never replicated - so an accidental delete at the source does not propagate to the destination unless you explicitly enable it.
- SSE-KMS objects need permissions on the KMS key in the destination region.

### Databases across regions
| Option | Replication lag | Failover | When to use |
|---|---|---|---|
| RDS cross-region read replica | A few seconds (async) | Manual promote to standalone DB | Reads near users, simple DR |
| Aurora Global Database | Usually under 1s (storage-level replication) | Managed failover (no data loss on planned failover) or detach-and-promote on failure, RTO ~minutes | Serious DR, global reads |
| DMS (full load + CDC) | Seconds to minutes | Not a failover tool | Engine change, filtering/transforming, migration |
| DynamoDB Global Tables | Usually under 1s | Writable in every region (last writer wins) | Multi-region key-value data |

### Costs to budget
- Cross-region data transfer is charged **per GB sent** (rates vary by region pair) - replicating 5TB/month is a real line item; add request charges and RTC fees if enabled.
- Aurora Global Database adds replication I/O fees and instance cost in the secondary region.
- Reduce cost: replicate only the needed prefix/tags, compress, put the DR copy in a cheaper storage class.

### Common pitfalls
- Forgetting that replication does not copy objects that existed before it was enabled.
- Enabling delete-marker replication without Object Lock -> an accidental delete propagates to the DR copy.
- Not measuring replication lag -> assuming RPO is 1s when it is actually 10 minutes at peak.
- Replicating data without preparing infrastructure, config and secrets in the secondary region.

> Senior tip: DR is not just data. My checklist always includes: AMI/image, secrets and KMS keys in the secondary region, service quotas, DNS, and a rehearsed runbook. Missing one item turns an RTO of minutes into hours.`,
    follow: ['With S3 CRR, delete markers and versioning: what is the risk of an accidental delete propagating to the other region?', 'How do automatic and manual failover differ in Aurora Global Database?', 'How do you measure replication lag and alert on it for a cross-region database?']
  },
  'aws-034': {
    q: 'Private connectivity from on-premise to AWS: Site-to-Site VPN vs Direct Connect (private/transit VIF, DX + VPN as backup). Compare deployment time, bandwidth, latency and cost.',
    a: `**Summary:** To connect on-premise (your own data center) privately to AWS, the two main options are Site-to-Site VPN (IPsec over the Internet: fast to deploy, cheap, but variable bandwidth/latency) and Direct Connect - DX (dedicated physical link: stable, high bandwidth, low latency, but takes weeks-to-months and costs more). In production, DX is usually the primary path with VPN as backup (failover via BGP).

### Components
- **VPC (Virtual Private Cloud)**: your private virtual network on AWS.
- **VPN Site-to-Site**: two IPsec tunnels: AWS side is a VGW (Virtual Private Gateway) or an attachment to a TGW (Transit Gateway, the central router connecting many VPCs/on-prem); customer side is a CGW (Customer Gateway, your device/public IP). Each VPN connection usually has 2 tunnels for HA.
- **Direct Connect (DX)**: a physical port/circuit at a DX location. On top of it you create a **VIF (Virtual Interface)**:
  - **Private VIF**: access private resources in a VPC (via VGW or a Direct Connect Gateway attached to a VGW).
  - **Transit VIF**: attach a Direct Connect Gateway to a TGW to reach many VPCs/accounts.
  - **Public VIF**: reach public AWS service endpoints (S3, DynamoDB) over the AWS network, not the Internet.
- **BGP (Border Gateway Protocol)**: exchanges routes automatically; when one path fails, routes shift to the surviving path.

### Comparison (reference values; always check current pricing by region)
| Criterion | Site-to-Site VPN | Direct Connect |
|---|---|---|
| Deployment | Minutes to a few hours (equipment in place) | 2-10 weeks (order circuit, cross-connect, configure) |
| Bandwidth | ~1.25 Gbps per tunnel; aggregating tunnels is complex | 1/10/100 Gbps (dedicated) or hosted 50 Mbps-10 Gbps |
| Latency | Variable, depends on the Internet, has jitter | Stable, lower, with SLA on the link |
| Encryption | IPsec by default | Not encrypted by default; can add MACsec (L2) or IPsec over DX |
| Cost | Per hour (~0.05 USD/hour/tunnel) + data transfer | Port-hour + data transfer out (usually cheaper per GB than Internet) + telco circuit fee |
| Reliability | Depends on the Internet | Higher; still needs HA design (2 DX / 2 locations if critical) |

### Choosing
- **Need it fast, temporary, POC, dev/test, low cost**: VPN is the right choice; can be up in a day.
- **Production, banking, latency-sensitive, large continuous data transfer (batch, DB replication)**: DX as primary + VPN backup. DX gives quality; VPN guarantees a path when DX is under maintenance or fails.
- **Many VPCs / multi-account**: use Transit VIF + TGW to avoid many separate Private VIFs/VGWs.

### Common pitfalls
- **MTU/fragmentation on VPN**: IPsec adds overhead; large packets may fragment, causing slowness or loss. Set MTU ~1400-1436 or enable TCP MSS clamping; test with ping using the DF flag.
- **DX is not encrypted by default**: banks usually require MACsec or IPsec over DX; do not assume "private link = fully secure" if policy requires encryption.
- **BGP failover not as expected**: wrong route advertisement, mismatched prefix lengths causing the backup path not to be chosen; always test failover for real (pull the cable / toggle) before go-live.
- **VPN backup lacks capacity**: DX 1 Gbps but VPN backup sustains only ~200 Mbps -> congestion on failover. Plan backup capacity for the minimum surviving traffic.
- **Hosted DX depends on the partner**: shared capacity; confirm SLA and incident process.

> Senior tip: Do not just draw an HA diagram - rehearse pulling the primary path. For banks, dual DX at two different locations + VPN backup is common, but the real value is having tested failover and measured BGP convergence time.`,
    follow: ['How do BGP route advertisement and AS path prepending make DX the preferred path?', 'When DX is down, is the VPN backup enough bandwidth? How do you plan capacity?', 'What is a Direct Connect Gateway and how does it connect multiple regions?']
  },
  'aws-035': {
    q: 'Connecting many VPCs: VPC peering (not transitive) vs Transit Gateway (route tables, segmentation) vs PrivateLink. How do you handle overlapping CIDRs?',
    a: `**Summary:** **VPC peering** connects two VPCs directly, is cheap, has no separate bandwidth limit, but is **not transitive** (A-B and B-C do not let A reach C), so with many VPCs it becomes an unmanageable mesh. **Transit Gateway (TGW)** is a central hub-and-spoke router with **route tables** for segmentation (prod cannot see non-prod), fitting from a few dozen VPCs up plus on-prem connectivity. **PrivateLink** shares **one specific service** (behind an NLB) to other VPCs via an Interface Endpoint, one-way, and **does not care about overlapping CIDRs**.

### Comparison
| Criterion | VPC Peering | Transit Gateway | PrivateLink |
|---|---|---|---|
| Model | Point-to-point | Hub-and-spoke | Service -> consumer |
| Transitive | No | Yes (per route table) | N/A |
| Overlapping CIDR | Not allowed | Not allowed (within same route domain) | Allowed |
| Cost | Data transfer only | Per-attachment hourly + per-GB processed | Endpoint hourly + per-GB |
| Access scope | Whole VPC (per SG) | Whole VPC (per route + SG) | Only one service |

### Transit Gateway and segmentation
Each VPC is an attachment; each attachment **associates** with one route table and **propagates** its routes into one or more route tables. Example: a "prod" route table contains only prod VPC routes plus shared-service VPC routes; a "nonprod" route table is similar; an inspection VPC (firewall) sits in between if you need to control east-west traffic. Combine with **AWS RAM** to share the TGW across accounts in an Organization.

### Overlapping CIDRs
- PrivateLink: no concern - the consumer reaches the service via the endpoint IP inside their own VPC.
- If you must route between networks with overlapping CIDRs: use a **private NAT gateway** to translate addresses into a non-overlapping range, or re-IP (costly but clean).
- Prevention: manage IP centrally with **VPC IPAM**, allocating non-overlapping ranges to every new VPC.

### Common pitfalls
- Peering routes must be added in **both** directions; forget one and you get silent timeouts.
- One TGW route table for everything -> prod and non-prod see each other.
- Allocating CIDRs ad hoc -> impossible to connect networks later.
- Using PrivateLink for needs that require whole-network access (it exposes only one service).

> Senior tip: Run VPC Reachability Analyzer for pairs that must never talk (non-prod -> prod DB) as a recurring CI check. Wrong network changes usually stay silent until a security incident.`,
    follow: ['How do you implement prod vs non-prod segmentation with TGW route tables?', 'PrivateLink vs peering: which do you choose for sharing a database, and why?', 'What is VPC Lattice and how does it differ from TGW/PrivateLink?']
  },
  'aws-036': {
    q: 'Several EC2/ECS instances need to share the same storage: EFS, FSx, S3 or EBS Multi-Attach? When do you use which?',
    a: `**Summary:** **EFS** is a shared NFS file system, auto-scaling, mountable from many EC2/ECS/EKS/Lambda across multiple AZs - fits shared Linux-style files. **FSx** is specialised file systems: **FSx for Windows** (SMB, Active Directory), **FSx for Lustre** (very high throughput for HPC/ML, linked to S3), **FSx for NetApp ONTAP / OpenZFS** (enterprise features, snapshots, NFS/SMB). **S3** is object storage - not a file system, but the cheapest and most durable choice when the app reads/writes whole objects via the API. **EBS Multi-Attach** is only for software that manages concurrent writes itself (cluster file system), rarely right for web apps.

### Quick choice
| Need | Choose |
|---|---|
| Many Linux containers/EC2 sharing a directory (temp uploads, config, CMS content) | EFS |
| Windows app needing SMB/AD | FSx for Windows File Server |
| ML training / large data processing needing hundreds of GB/s | FSx for Lustre (linked to S3) |
| Migrating enterprise NAS, needing snapshots, clones, multi-protocol | FSx for NetApp ONTAP |
| User files, images, documents, backups, data lake | S3 |
| Database / cluster app managing its own writes | EBS (Multi-Attach only with io1/io2 and a cluster file system) |

### EFS essentials
- Storage classes: Standard and Infrequent Access/Archive with lifecycle moving rarely used files to cheaper tiers.
- Throughput: **Elastic** (auto-scales with demand, recommended for most), **Bursting** (tied to stored size, easy to exhaust credits on small file systems), **Provisioned** (reserved).
- Latency is higher than EBS (milliseconds per op) -> not suitable for DBs or dense small-file workloads.
- With ECS/EKS: mount via EFS CSI driver or task volume config; use **access points** to limit directory and UID/GID per app, granting access via IAM.

### Common pitfalls
- Using EFS for a DB or builds with millions of small files -> very slow.
- EFS Bursting on a small volume -> credit exhaustion.
- Treating S3 as a file system (renaming a "folder" copies every object; no file locks).
- EBS Multi-Attach with ext4/xfs -> data corruption when multiple machines write concurrently.

> Senior tip: Before choosing a shared file system, ask whether the app truly needs file-system semantics. Many cases only need object storage, and dropping the shared mount makes the architecture far simpler and easier to scale.`,
    follow: ['How do EFS throughput modes Bursting, Elastic and Provisioned differ?', 'How do you mount EFS into an ECS task and what IAM permissions are needed?', 'When would you use EBS Multi-Attach instead of EFS?']
  },
  'aws-037': {
    q: 'Standing up a full environment for one application that meets HA and has backups: from the VPC, multi-AZ subnets, ALB, ECS/EKS, RDS Multi-AZ, AWS Backup, secrets, logging. List the deployment order and explain why.',
    a: `**Summary:** I build in order **foundation -> data -> compute -> entry -> operations**: account and IAM, multi-AZ VPC (public/private/data subnets), security groups and endpoints; KMS and secrets; RDS Multi-AZ and AWS Backup; ECS/EKS spread over at least 2-3 AZs on private subnets; ALB and WAF; DNS and certificates; finally logging, metrics, alarms and a rehearsal. This order ensures each layer depends only on layers already in place, and everything is created with **Infrastructure as Code** (Terraform/CDK) so it can be rebuilt.

### Deployment order
1. **Account and governance**: separate account for prod, basic SCPs, IAM Identity Center, CloudTrail enabled in every region.
2. **Network**: VPC across 3 AZs; public subnets (ALB, NAT), private (app), data (DB, no route to the Internet); a NAT gateway per AZ (so losing one AZ does not cut outbound access); VPC endpoints for S3, ECR, Secrets Manager, CloudWatch (reduces NAT cost, stays off the Internet).
3. **Encryption and secrets**: KMS keys per purpose, Secrets Manager for DB passwords (with rotation).
4. **Data**: RDS/Aurora **Multi-AZ** (synchronous standby in another AZ, automatic failover in 1-2 minutes), parameter group, encryption, deletion protection; **AWS Backup** with a backup plan, encrypted vault, **Vault Lock** against deletion, copy to another region/account.
5. **Compute**: ECS Fargate or EKS spread across AZs, autoscaling, a separate task role per service, images from ECR with vulnerability scanning.
6. **Entry**: multi-AZ ALB, correct health check (light readiness endpoint), HTTPS with ACM, WAF; Route 53.
7. **Operations**: centralised logs (CloudWatch Logs/OpenSearch), metrics and alarms (5xx, latency, DB CPU, replica lag), dashboards, runbooks; **rehearse** DB failover and restore from backup.

### Why this order
Network and permissions are the hardest to change later (changing a CIDR or subnet layout basically means rebuilding), so get them right first. Data needs encryption and backup **from day one** - enabling encryption on an existing RDS requires a snapshot and restore. Entry comes last so you do not expose to the Internet before the layers below are ready.

### Common pitfalls
- One NAT gateway for all AZs -> losing that AZ cuts outbound access.
- ALB health check that also checks the DB -> a slow DB marks every target unhealthy.
- Backup in the same account without lock -> deleted together with the data.
- Creating resources by hand in the console -> cannot be rebuilt when needed.

> Senior tip: A backup is only trustworthy once you have restored from it. I schedule AWS Backup restore testing (or a self-written job) to restore periodically into a temporary environment and run data checks - and record the actual restore time as the RTO.`,
    follow: ['How do RDS Multi-AZ and Read Replica differ?', 'How do you design an ALB health check that avoids false positives?', 'How do AWS Backup retention, Vault Lock and cross-region copy work?']
  },
  'aws-038': {
    q: 'Security Group stateful vs NACL stateless in a real incident: ephemeral ports blocked on the return path, and how to debug with VPC Flow Logs and Reachability Analyzer.',
    a: `**Summary:** A Security Group (SG, firewall attached to an ENI/resource such as EC2) is **stateful** (it remembers the connection: if the outbound request is allowed, the reply is allowed automatically), while a NACL (Network ACL, firewall attached to a subnet) is **stateless** (it does not remember, you must declare rules in both directions). The classic incident: the NACL allows inbound to the server but blocks the outbound ephemeral port range (temporary ports, 1024-65535) so the reply never comes back -> client timeout even though the server processed the request. Debug with VPC Flow Logs (look for REJECT) and VPC Reachability Analyzer (names the blocking hop/rule).

### What the two layers are and why they are confusing
- **ENI (Elastic Network Interface)**: the "virtual network card" of a resource in a VPC.
- **Ephemeral port (temporary port)**: when a client opens a TCP connection, the OS assigns a temporary source port (usually 1024-65535; range varies by OS) to receive the reply. Example: client 10.0.1.20:54321 -> server 10.0.2.30:443; the reply goes back 443 -> 54321.
- **Stateful (SG)**: the SG records the connection; reply packets belonging to it are automatically allowed, no separate outbound/inbound rule needed for the return path.
- **Stateless (NACL)**: every packet is evaluated independently against the subnet's inbound/outbound rules; it does not care whether the packet is a reply.

### How the ephemeral-port incident happens
Scenario: a web server in a private subnet listens on 443. The server subnet's NACL allows inbound TCP 443 from the client CIDR, but outbound only allows a few ports (e.g. 443, 53) and **forgets** the ephemeral range 1024-65535.
- Client sends SYN to 443 -> passes NACL inbound (OK) -> passes server SG (OK, stateful).
- Server returns SYN-ACK/response from 443 to client:54321 -> SG allows it out (stateful) -> NACL outbound checks destination 54321, **no matching allow rule** -> falls to the deny rule -> REJECT.
- Result: client sees timeout or "connection timed out"; sometimes the handshake partially completes then hangs. From the app server's view, the request may already have been received/processed (timing-dependent) but the response never arrives.

The reverse also happens: when the server is the client going out (calling an API), the server subnet's NACL allows outbound 443 but inbound does not allow ephemeral -> the response from the Internet/API never comes back.

### Debugging step by step
1. **Confirm the symptom**: curl from client to server times out; does it differ from inside the same subnet or when bypassing the NACL (carefully, temporarily)? Check SG first: being stateful, SG is rarely the cause of the return path.
2. **VPC Flow Logs**: enable for the ENI or subnet (to CloudWatch Logs/S3). Find the 5-tuple record: srcaddr, dstaddr, srcport, dstport, protocol, action. A REJECT with dstport in 1024-65535 in the reply direction -> the NACL is blocking the ephemeral port. Note Flow Logs lag ~5-10 minutes and contain metadata only, no payload.
3. **VPC Reachability Analyzer**: create a path from source ENI to destination ENI (port/protocol). It analyses configuration (SG, NACL, route table, IGW/NAT/TGW) and returns reachable or not, plus the blocking component. It sends no real traffic, so it is safe on production; but it does not detect runtime problems (app not listening, OS firewall).
4. **Check NACL rule order**: NACLs evaluate rules in increasing number order, first match applies; there is a final * DENY. A DENY placed early can block before an ALLOW.
5. **Check route table**: if the reply takes a different path or there is no route back to the client CIDR -> also a timeout (Flow Logs may show a different pattern).

### Common pitfalls
- Assuming "SG is open so it is fine": SG stateful helps the return path, but the **NACL can still block** before the packet leaves the subnet.
- Opening ephemeral too narrowly: Linux/Windows use different ranges; the safe choice is 1024-65535 unless there is a strict internal standard and OS control.
- Using NACL to "tighten" like an SG: stateless NACLs are hard to maintain and easy to break; many teams only use NACL for specific denies (blocking bad IPs) and keep allows broad, enforcing real control with SGs.
- Flow Logs not showing packets blocked by SG? (depends on case) - combine SG rule review with Reachability Analyzer.

> Senior tip: In banking environments, many teams keep NACLs close to allow-all and enforce security with SGs to avoid hard-to-debug outages; if compliance requires NACLs, standardise a template that opens ephemeral 1024-65535 deliberately, and review every network change through IaC plus automated tests.`,
    follow: ['When do you actually need NACLs instead of relying only on SGs?', 'What is the VPC Flow Logs format and how do you query it with Athena?', 'How does Reachability Analyzer differ from Network Access Analyzer?']
  },
  'aws-039': {
    q: '(lead) A landing zone for a bank moving to cloud: Control Tower, account vending, SCP guardrails, log archive/audit accounts, a central network account. How would you design it?',
    a: `**Summary:** A landing zone is a **multi-account AWS foundation governed in advance** before any workload goes up: AWS Organizations with an **OU** structure (Security, Infrastructure, Workloads Prod/NonProd, Sandbox), **Control Tower** to stand it up and manage guardrails, **account vending** (Account Factory or AFT) to provision new accounts to standard, **SCP** blocking what must never happen, separate **Log Archive** and **Audit** accounts, and a central **Network** account (Transit Gateway, on-prem connectivity, egress control).

### Suggested structure for a bank
~~~text
Root (management account: only Organizations and billing)
├── Security OU: Log Archive, Audit (Security Tooling: GuardDuty, Security Hub, aggregated Config)
├── Infrastructure OU: Network (TGW, Direct Connect, egress firewall), Shared Services (CI/CD, ECR)
├── Workloads OU
│   ├── Prod OU: core-payments-prod, cards-prod, ...
│   └── NonProd OU: core-payments-dev, ...-uat
├── Sandbox OU: experimentation accounts with limited budget
└── Suspended OU: accounts pending closure
~~~

### SCP guardrails (examples)
- Allow only **approved regions** (customer data stays in Vietnam/Singapore per regulation).
- Deny disabling CloudTrail, GuardDuty, Config; deny deleting logs in the Log Archive account.
- Deny creating IAM users with long-lived access keys in workload accounts; require encryption when creating EBS/S3.
SCP only **caps** maximum permissions (it never grants), applies to every principal in the account including admins - except the management account.

### Account vending
New accounts are created through **Account Factory** (Service Catalog) or **AFT** (Account Factory for Terraform: request an account via a Terraform file in Git, pipeline creates it and applies the baseline). Baseline includes: VPC per IPAM range, TGW connectivity, a CI/CD role (cross-account, trusting the Shared Services account via OIDC), SSO permission set, budget and alerts.

### Log archive and audit
Organization CloudTrail, Config and VPC Flow Logs land in an S3 bucket in the Log Archive account with Object Lock; the security team works in the Audit account with cross-account read access; no application team has log-deletion rights.

### Common pitfalls
- Running workloads in the management account.
- An SCP too strict applied to the prod OU without testing in nonprod -> blocks deploys.
- No IP strategy from the start -> VPCs with overlapping CIDRs that cannot be connected.
- Allowing account creation outside the vending process -> accounts missing the baseline.

> Senior tip: Banking regulators require segregation of duties and a complete audit trail. A landing zone with an immutable log archive and SCP guardrails is the minimum viable compliance. Start with plain Control Tower (little customisation) and only build custom automation (AFT) when you need to scale.`,
    follow: ['AWS Organizations vs Control Tower: when do you use which?', 'What is Account Factory for Terraform (AFT) and how does it differ from Account Factory?', 'How do you design a cross-account role so CI/CD can deploy?']
  },
  'aws-040': {
    q: '(lead) Migrating a database from on-prem to AWS with minimal downtime: DMS full load + CDC, SCT when changing engine, data verification, cutover plan and rollback.',
    a: `**Summary:** For minimal downtime: **DMS full load + CDC** (copy everything, then continuously sync changes) keeps the new DB close to the old one for days; **SCT** (Schema Conversion Tool) converts schema and code when **changing engine** (Oracle -> PostgreSQL); **verify data** with DMS data validation plus row counts/checksums; **cutover** within a short window: stop writes, wait for CDC to catch up, verify, switch the app; **rollback** by keeping a reverse sync stream (CDC new -> old) for a while.

### Steps
1. **Assessment**: size, rate of change (GB/hour of redo/binlog), special features (PL/SQL, sequences, data types), acceptable downtime. Same engine (MySQL -> RDS MySQL, PostgreSQL -> Aurora PostgreSQL) -> **native replication** is usually simpler and faster than DMS.
2. **Schema conversion**: SCT produces an assessment report of how much converts automatically; the parts that do not (PL/SQL packages, custom functions) must be rewritten and tested. Create the target schema **without** foreign keys and triggers during full load (re-enable afterwards).
3. **Full load + CDC**: size the DMS replication instance adequately; enable supplemental logging (Oracle) or ROW-format binlog (MySQL) on the source; CDC runs continuously after full load.
4. **Data verification**: DMS data validation; add row counts, totals and checksums per table/range; run the application against the new DB (a copy) for testing.
5. **Cutover**: notify users, switch the app to read-only or maintenance, wait for CDC latency to reach 0, final check, **reset sequences** at the target above the current max value, change the connection string (via DNS/secret), re-enable triggers/FKs, open writes.
6. **Rollback**: keep a **reverse** CDC task (new -> old) for a few days; if something goes wrong, point the app back at the old DB without losing data written after cutover.

### Common pitfalls
- Not enabling supplemental logging or ROW binlog -> CDC misses changes.
- Full load with FKs and triggers enabled -> ordering errors and slowness.
- Forgetting sequences/identity, large LOBs, time-zone differences in date types.
- No rollback path beyond "restore from backup" -> rollback means losing data written after cutover.

> Senior tip: Rehearse the cutover **at least twice** on a copy, following the exact steps with a stopwatch. The first rehearsal always surfaces details like sequences, permissions, connection strings hardcoded in a job - and real time is usually double the estimate.`,
    follow: ['When should you use native replication instead of DMS?', 'How do you handle sequences/identity values when migrating Oracle to PostgreSQL?', 'How does a blue/green deployment for a database work on AWS?']
  }
});
