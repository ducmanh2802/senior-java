/*
 * English translation of js/data/q-aws.js — task T970. Format: js/core/i18n.js (content overlay).
 * ids: aws-057 aws-058 aws-059 aws-060 aws-061
 */
App.i18n.content({
  'aws-057': {
    q: '(SA case study) A ticket sale event is expected to bring 400,000 people in at the same time during the first 5 minutes (50 times normal). The system uses CloudFront, API Gateway, Lambda, and ECS. Which limits (quotas) will break first, and how do you design so it does not collapse?',
    a: `**Summary:** Under sudden load, what breaks first is usually **not CPU** but **quotas and scale speed**: account Lambda concurrency (default 1,000/region), Lambda and ECS scale speed, API Gateway throttling, DB connections, and payment partner rate limits. Design: a **virtual waiting room** at the entry to only let through as many people as the system can handle, **offload reads** to CDN/cache, **buffer writes** with SQS, **atomic holds** in DB/Redis, **scale ahead**, and **request quota increases weeks ahead**.

### What breaks first (check before the event)
| Component | Limit to check |
|---|---|
| Lambda | Account concurrency (default 1,000/region, request increase); per-function scale speed (about 1,000–2,000 concurrency per 10 seconds); Java cold start (SnapStart) |
| API Gateway | Account default throttle (about 10,000 rps, burst 5,000 — request increase), throttle per stage/method |
| ECS/EKS | Time to add task/node (minutes), IP limits in subnet, Fargate vCPU quota |
| DB | Max connections, IOPS, row locks on ticket inventory |
| Partners | Payment gateway rate limit, SMS OTP |
| Account | Other Service Quotas: ENI, NAT bandwidth, KMS request rate |

### Architecture
~~~seq
title: Ticket sale with virtual waiting room
actors: User | CloudFront | WaitingRoom | API | Queue | Worker
User -> CloudFront: open event page (static page, cached)
CloudFront -> WaitingRoom: request entry slot
WaitingRoom --> User: queue number, wait your turn
WaitingRoom --> User: entry token (valid 10 minutes)
User -> API: hold seats (with token)
API -> API: atomic hold (Redis/DB), return hold code
API -> Queue: order waiting for payment
Queue -> Worker: process payment at gateway's allowed rate
~~~
- **Waiting room** (AWS Virtual Waiting Room solution or equivalent): let in at a tested pace (e.g., 2,000 people/minute), fair ordering, block bots with signed tokens.
- **Reads**: event page and seat map are static on CloudFront; remaining seats refresh every few seconds from cache.
- **Hold**: atomic operation with a 10-minute expiry; on expiry, seats are returned.
- **Payment**: asynchronous via SQS, worker calls payment gateway within its limit; user sees "processing".
- **Scale ahead**: provisioned concurrency for hot Lambdas, raise minimum ECS tasks from 1 hour before, warm DB/cache.

### Real-world example
First sale without a waiting room: within 90 seconds Lambda hit the 1,000 concurrency limit, API Gateway returned 429 in bulk, clients retried automatically tripling the load; DB ran out of connections; blank page for 12 minutes, social media flooded with complaints. Next time: requested Lambda concurrency raised to 5,000 and API Gateway limits 3 weeks ahead, waiting room admitted 3,000 people/minute, holds via Redis + conditional UPDATE in DB, payment through SQS. Peak 420,000 people, no significant 5xx errors, sold all 18,000 tickets in 41 minutes, no oversell.

### Pitfall
- Load testing the app while forgetting account and partner quotas.
- Expecting autoscaling to react to a burst within a few tens of seconds.
- Client retries without backoff → self-DDoS.
- Waiting room present but backend API does not check the token → bots bypass.

### Interview answer
"With a 50x burst, what breaks first is usually quotas and scale speed, not CPU: Lambda account concurrency defaults to a thousand per region, the rate of adding concurrency, API Gateway throttling, ECS task add time, DB connections, and payment gateway rate limits. So I inventory those limits and request increases weeks ahead. Architecturally, I put a virtual waiting room at the entry to admit only as many people as load-tested, with a signed token the API verifies. Reads go to CloudFront and cache. Holds are atomic operations with expiry. Payment is pushed to SQS so workers process within the gateway's limit. I scale ahead with provisioned concurrency and minimum task counts, and clients retry with backoff."

> Senior tip: open **Service Quotas** and list every quota the event flow touches, record the current value, the needed value, and the date requested. Quotas are limits that do not show up in load tests in another account — and increases can take days.`,
    follow: [
      'How do provisioned concurrency and SnapStart differ for Lambda Java?',
      'How do you load test at 400,000 users without spending too much?',
      'If the payment gateway is slow mid-event, how do you handle hold expiry fairly?'
    ]
  },
  'aws-058': {
    q: '(SA case study) A bank\'s core payment runs in one AWS region. Regulators require RTO 30 minutes and RPO under 1 minute on loss of an entire region, but the DR budget is only 25% of current cost. Which DR strategy do you choose and how do you prove it works?',
    a: `**Summary:** With RTO 30 minutes and RPO under 1 minute, **backup & restore** (RPO hours, RTO many hours) fails and **active-active** meets the target but exceeds budget and requires the app to handle multi-region writes. The reasonable choice is **pilot light / warm standby at reduced size**: **continuous data replication** (Aurora Global Database, S3 Replication), standby infrastructure in the secondary region **provisioned via IaC but running minimally** (0–2 ECS/EKS tasks, scale on failover), traffic shift via **Route 53 Application Recovery Controller**, and **timed drills** to prove the numbers.

### Comparing four strategies
| Strategy | RPO | RTO | Cost vs prod | Note |
|---|---|---|---|---|
| Backup & restore | Hours | Many hours | ~5–10% | Fails requirements |
| Pilot light | Seconds–minutes | 30–60 min | ~15–25% | Data ready, compute built when needed |
| Warm standby | Seconds | 10–30 min | ~30–50% | Runs small, just scale up |
| Active-active | Near 0 | Near 0 | ~100%+ | App must handle multi-region writes |
Choose **upgraded pilot light**: DB and data always ready; compute runs minimally for continuous health checks; fast scaling thanks to images already present in the secondary region.

### Components
- **Data**: Aurora Global Database (lag usually under 1 second → RPO met); S3 Replication with RTC for documents; secrets and KMS keys already replicated (multi-region keys); ECR replication for images.
- **Infrastructure**: same Terraform module; secondary region runs at minimum task count; quotas (vCPU, IP, Lambda concurrency) pre-requested for full load.
- **Traffic shift**: Route 53 ARC routing control (enable/disable traffic by region with safety rules against shutting off both); readiness checks comparing the two regions' configs.
- **Failover process**: (1) decide failover (authorized person, clear criteria); (2) promote Aurora in secondary; (3) scale compute; (4) switch routing control; (5) verify sample transactions; (6) notify. Each step automatable.

### Proving it with drills
Drill every quarter: simulate loss of primary region (block traffic, failover Aurora), measure each step's time, verify data (reconcile transactions before/after). Drill results are the **evidence** for audit; slow steps become improvement tasks.

### Real-world example
First drill took **2 hours 10 minutes**: Secrets Manager secrets not replicated, Fargate vCPU quota in secondary region only enough for 20% load, ACM certificates not created, one job had the DB endpoint hard-coded to the primary region. After 2 improvement rounds (replicate secrets and KMS multi-region, request quotas, parameterize endpoint, automate runbook via Systems Manager): third drill reached **24 minutes**, measured RPO 0.8 seconds. DR cost about 21% of prod.

### Pitfall
- Replicating data but forgetting secrets, keys, images, quotas, certificates, DNS.
- No criteria or designated decision-maker for failover → an hour lost to meetings.
- Failback (returning to primary) not planned.
- Never drilled → RTO numbers are guesses.

### Interview answer
"With RTO 30 minutes, RPO under one minute, and a budget around one quarter, backup and restore fails and active-active is too expensive and requires multi-region writes. I choose upgraded pilot light: data continuously replicated via Aurora Global Database with lag under one second and S3 Replication; secondary-region infrastructure provisioned with the same Terraform but running minimally, with images, secrets, KMS keys already replicated and quotas pre-requested for full load. Traffic shifts via Route 53 Application Recovery Controller. The failover process has clear criteria and decision-maker, with automatable steps. Most importantly, drills every quarter with timing and data reconciliation, whose results serve as audit evidence and an improvement list."

> Senior tip: the real RTO always lives in things beyond data — secrets, quotas, certificates, an endpoint hard-coded in a rarely remembered job. The first drill almost always fails; schedule it early, before a real incident.`,
    follow: [
      'How do you fail back to the primary region without losing data?',
      'When should you move from pilot light to active-active?',
      'How do you avoid both regions accepting writes (split-brain) during failover?'
    ]
  },
  'aws-059': {
    q: '(SA case study) The analytics team runs reporting queries directly on production Aurora, slowing transactions. They need near-real-time data (under 5 minutes lag) for dashboards and risk models. How do you design the data pipeline to the analytics platform on AWS?',
    a: `**Summary:** Separate **OLTP** from **analytics** with **CDC** (Change Data Capture — reading the DB change log instead of querying tables): the simplest choice is **Aurora zero-ETL integration with Amazon Redshift** (data replicates to Redshift in seconds, no pipeline to write); if you need an open data lake and multiple sources, use **Debezium (MSK Connect) or DMS** to push changes via Kafka/Kinesis into **S3 as Apache Iceberg tables**, queried by Athena/Redshift/Spark. Add a **data governance** layer: mask personal data, column/row-level permissions (Lake Formation), catalog.

### Why a read replica is not enough
A read replica reduces load on the primary, but analytical queries (scanning hundreds of millions of rows, joining many tables) are still slow on a row-based DB, hold long transactions that lag the replica, and the analytics team still depends on the application schema (schema changes break reports).

### Two architectures
| Criterion | Aurora zero-ETL → Redshift | CDC → Kafka → S3 Iceberg |
|---|---|---|
| Lag | Seconds | Seconds to minutes |
| Ops effort | Low (managed service) | Higher (connectors, schema, compaction) |
| Data sources | Supported Aurora/RDS | Anything (multiple DBs, app events) |
| Open format / multiple engines | Tied to Redshift | Iceberg readable by Athena, Spark, Redshift |
| Fits | Few DBs, small team | Multi-source data platform |

### CDC flow in detail
~~~seq
title: CDC from Aurora to data lake
actors: Aurora | Debezium | Kafka | Sink | S3Iceberg | Athena
Aurora -> Debezium: read logical replication (WAL)
Debezium -> Kafka: change events per table (key = primary key)
Kafka -> Sink: consume in batches every 1-2 minutes
Sink -> S3Iceberg: MERGE into Iceberg table (upsert by key)
Athena -> S3Iceberg: query dashboards and risk models
~~~
Note: logical replication holds WAL if the consumer stops → **monitor the replication slot** so the primary disk does not fill; Iceberg tables need **periodic compaction** (many small files).

### Data governance
- Classify columns (PII, financial); mask or hash phone numbers and national IDs before they reach the shared analytics zone.
- Lake Formation grants permissions per table/column/row to each group; all queries audited.
- **Data contract**: application team notifies schema changes; pipeline validates schema and alerts instead of breaking silently.

### Real-world example
A consumer lending company: risk dashboard ran an 8-minute query on Aurora every 15 minutes, p99 disbursement API increased 4x during runs. Phase 1 enabled Aurora zero-ETL to Redshift Serverless: dashboard ran under 10 seconds with ~15 second lag, Aurora load down 35%. Phase 2, needing to combine CRM data and app events, added Debezium → MSK → Iceberg for those sources. Once a CDC consumer stopped for 6 hours due to a permission error, the replication slot held 180GB of WAL — since then there is slot lag alerting.

### Interview answer
"I separate analytics from OLTP with CDC, i.e., reading the DB change log instead of querying tables directly. If the source is Aurora and the need is mainly analytics on Redshift, I choose zero-ETL integration: data reaches Redshift in seconds with no self-built pipeline. If I need a multi-source data platform with open formats, I use Debezium or DMS to push changes via Kafka into S3 as Iceberg tables with upsert by key, queried by Athena or Spark, remembering periodic compaction. Two operational points matter: monitor the replication slot so a stopped consumer does not fill the primary's WAL, and have a data contract so schema changes do not silently break reports. Plus data governance: mask personal data, column/row permissions via Lake Formation."

> Senior tip: set an alert on **replication slot lag** (WAL retained) from day one of enabling CDC. This is the most common way an "harmless" analytics pipeline fills the disk and takes down the production DB.`,
    follow: [
      'How do you handle schema changes (add/change columns) in a CDC pipeline?',
      'Why do Iceberg tables need compaction and how do you schedule it?',
      'Personal data in the data lake: mask where, who sees the original?'
    ]
  },
  'aws-060': {
    q: '(SA case study) To cut cost, the team moved EKS nodes to EC2 Spot. Since then there are occasional 5xx bursts lasting 1–2 minutes and some half-finished jobs are lost. How do you investigate and redesign so it stays both cheap and stable?',
    a: `**Summary:** Spot is cheap (up to ~70–90% off) but EC2 can be **reclaimed with a 2-minute warning**. 5xx bursts and lost jobs are signs the **app and cluster do not handle interruption**: nodes reclaimed without proper drain, too many replicas on one instance type reclaimed together, jobs without checkpoints. Redesign: **diversify instance types and AZs**, **handle interruption signals** (Karpenter or Node Termination Handler to cordon and drain), **PodDisruptionBudget**, correct **graceful shutdown**, keep **some on-demand** for critical components, and jobs must be **idempotent + checkpointed**.

### Investigation
- Correlate error times with **EC2 Spot Interruption** events (EventBridge) and NotReady node events in the cluster.
- Check which nodes the failing service's pods ran on: if 4/6 replicas all sat on one instance type (e.g., only m5.xlarge in one AZ), a single reclamation wave takes most capacity.
- Check whether pods receive SIGTERM and finish within the allowed time (preStop, terminationGracePeriodSeconds), whether readiness is dropped early.

### Redesign
| Problem | Handling |
|---|---|
| Mass reclamation | Diversify: many instance families/sizes (m5, m6i, m6a, c6i…), multiple AZs; Karpenter picks from a broad list preferring pools least often reclaimed |
| Node taken before pod drain | Karpenter (interruption queue) or AWS Node Termination Handler: receive 2-minute warning / rebalance recommendation → cordon, drain, create replacement node first |
| Many replicas gone together | PodDisruptionBudget (e.g., minAvailable 70%), topologySpreadConstraints by AZ and node |
| In-flight requests cut | Graceful shutdown: preStop sleep, server.shutdown=graceful, total time < 2 minutes |
| Job loses progress | Idempotent jobs, checkpoint per batch, queue with visibility timeout so unfinished work is reassigned |
| Critical components | On-demand node pool for stateful, ingress controller, CoreDNS, payment service |

### Real-world example
A food-delivery platform moved 100% of nodes to Spot, saved 62% of EC2 cost but had 3–4 5xx bursts per week. Investigation: node group used only 2 instance types in one AZ; no Node Termination Handler so nodes vanished abruptly; a 40-minute commission job had no checkpoint. After switching to Karpenter with 14 instance types across 3 AZs, enabling interruption handling, PDB and topology spread, moving CoreDNS/ingress/payment to an on-demand pool (~20% of nodes), splitting jobs into checkpointed batches: savings still 54% but no Spot-related 5xx bursts in 2 months; interrupted jobs resumed from the last batch.

### Pitfall
- Picking only one or two "cheapest" instance types → mass reclamation.
- terminationGracePeriodSeconds longer than 2 minutes on Spot → killed mid-flight.
- Running critical DB, Kafka brokers, or stateful sets on Spot without a plan.
- No PDB → draining many nodes at once takes all replicas.

### Interview answer
"Spot can be reclaimed with a two-minute warning, so 5xx bursts and lost jobs show the system does not handle interruption. I investigate by correlating error times with Spot interruption events and checking where the service's replicas ran; usually too few instance types cause simultaneous reclamation, and there is no drain mechanism. The redesign includes: diversify many instance types and AZs; use Karpenter or Node Termination Handler to receive the warning, cordon, drain, and create replacement nodes first; PodDisruptionBudget and topology spread so not many replicas disappear at once; graceful shutdown completing within two minutes; idempotent jobs with checkpoints using a queue to reassign unfinished work. Critical components like ingress, DNS, stateful, and payments go on on-demand nodes. This keeps large savings while stable."

> Senior tip: deliberately simulate Spot interruption with **AWS Fault Injection Service** (action sending interruption to Spot instances) in staging and measure user-facing errors. If not tested, the drain mechanism almost certainly has one misconfigured spot.`,
    follow: [
      'How does Karpenter differ from Cluster Autoscaler in choosing Spot instances?',
      'Which workloads should absolutely not run on Spot?',
      'How do you calculate a reasonable on-demand vs. Spot ratio for a cluster?'
    ]
  },
  'aws-061': {
    q: '(SA case study) A dev account IAM access key leaked to public GitHub. 2 hours later, 40 GPU instances were created in 5 regions for crypto mining, and the bill is rising fast. How do you respond in the first hour, and what changes prevent recurrence?',
    a: `**Summary:** The first hour follows **block → revoke → investigate → clean up**: disable the access key, restrict the exposed identity, find and delete **all** resources the attacker created (including **persistence** like new IAM users/roles/keys, Lambda, EventBridge rules) in **all regions** based on CloudTrail; contact AWS Support about the bill. Long term: **eliminate long-lived access keys** (SSO, roles, OIDC for CI), **SCPs** blocking unused regions and expensive instance types, **GuardDuty**, budget/anomaly alerts, secret scanning that blocks on push.

### First hour — step by step
1. **Disable** the access key (do not delete immediately, keep evidence); if unsure of scope, attach a deny-all policy to that user. AWS often auto-attaches an isolation policy (AWSCompromisedKeyQuarantine) on detecting a public key — but **do not rely** on it.
2. **Who did what**: CloudTrail Lake/Athena filtered by access key ID: {{RunInstances}}, {{CreateUser}}, {{CreateAccessKey}}, {{AttachUserPolicy}}, {{CreateRole}}, {{PutBucketPolicy}}, {{CreateFunction}}… across **all regions**.
3. **Stop the damage**: terminate instances in every region (check Spot requests, Launch Templates, Auto Scaling groups the attacker created to respawn); delete newly created IAM users/roles/keys; check buckets for changed permissions (data exposure?).
4. **Check data exposure**: any {{GetObject}}/{{ListBucket}} on sensitive buckets; did the key assume roles into other accounts?
5. **Notify**: security team, management; open a case with AWS Support (they often assist reviewing charges from an incident once the customer has remediated).
6. **Rotate** every secret that may have been exposed in the same repo.

### Why this happens
Dev long-lived keys with broad permissions ({{AdministratorAccess}} "for convenience"), no region restriction, no hourly cost alerts. Bots scan GitHub for AWS keys within minutes of a push.

### Prevention
| Layer | Measure |
|---|---|
| Identity | IAM Identity Center (SSO, temporary credentials), CI via OIDC (GitHub Actions → role), forbid creating long-lived access keys via SCP |
| Limits | SCP allow only regions in use; block GPU/expensive instance types in dev accounts; low quotas in dev accounts |
| Detection | GuardDuty (detects crypto mining, API calls from unusual IPs), Security Hub, organization CloudTrail |
| Cost | AWS Budgets per day, Cost Anomaly Detection instant alerts |
| Code | Secret scanning + push protection, pre-commit hook (gitleaks) |

### Real-world example
A startup hit exactly this: an admin key of a dev sat in a .env file that was committed. Within 3 hours the attacker created 48 GPU instances across 7 regions and a new IAM user for later re-entry. The team detected it via a budget alert when daily cost exceeded 5x normal; cleanup took 2 hours, and the attacker's "backup" IAM user was found only by querying full CloudTrail. Charges incurred ~$11,000, most of which AWS reviewed and assisted with after receiving the remediation report. Afterward: SSO for everyone, OIDC for CI, SCPs blocking regions and GPUs in dev, GuardDuty enabled for the whole Organization.

### Interview answer
"In the first hour I follow block, revoke, investigate, clean up. Disable the access key immediately and attach deny-all to the exposed identity. Use CloudTrail filtered by that access key across all regions to learn what the attacker did: created instances, created IAM users or keys for persistence, changed bucket policies, created Lambda or rules. Then delete all resources and persistence mechanisms, check whether data was read, rotate related secrets, notify the security team, and open an AWS case about charges. Long term, I eliminate long-lived access keys with SSO and OIDC for CI, use SCPs to limit regions and instance types in dev accounts, enable GuardDuty, daily budget and anomaly alerts, and secret scanning that blocks on push."

> Senior tip: **query all of CloudTrail** before declaring "cleanup done". Professional attackers almost always create a re-entry path (new IAM user, access key, or role trusted by a foreign account) — deleting instances while missing it means a second incident is waiting.`,
    follow: [
      'Why disable before deleting the key?',
      'How do you design an SCP that blocks unused regions without blocking global services like IAM and CloudFront?',
      'How does CI/CD use OIDC to obtain AWS permissions?'
    ]
  }
});
