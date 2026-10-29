/*
 * English translation of js/data/q-aws.js — task T207; entries re-translated in T511.
 * Format: js/core/i18n.js (content overlay).
 * ids: aws-012 aws-013 aws-014 aws-015 aws-016 aws-017 aws-018 aws-019 aws-020
 */
App.i18n.content({
  'aws-012': {
    q: 'Observability on AWS for a Java system: are CloudWatch logs/metrics/alarms enough, what do X-Ray and OpenTelemetry add, and how do you avoid log costs?',
    a: `**Summary:** CloudWatch is AWS's default platform for logs/metrics/alarms; X-Ray follows a request across services; OpenTelemetry is an open standard for instrumenting and shipping traces/metrics/logs to any backend. The three pillars are logs, metrics and traces — without traces, debugging microservices is very slow.

### Quick intuition
Observability is like the doctor's set of three instruments. **Metrics** are the vital signs (heart rate, blood pressure): a quick look tells you whether something is wrong. **Logs** are the patient chart, recording each event in detail. **Traces** are an X-ray of one injection travelling through each organ: which services a single request visited and where it got slow. Without traces you only know the patient has a fever, not where the inflammation is. **CloudWatch** is AWS's default hospital, **X-Ray** is the X-ray machine, and **OpenTelemetry** is the common standard that lets every machine speak the same language.

### Key terms
- **Log group / log stream**: a log group bundles logs per service and environment; a log stream is the log feed of one task/instance.
- **EMF (Embedded Metric Format)**: print one log line as JSON in the right shape and CloudWatch extracts a metric from it without an API call.
- **Span / trace**: a span is one unit of work (a DB call, an HTTP call); a trace is the tree of spans belonging to the same request.
- **Trace context propagation**: passing the trace ID in a header (the W3C {{traceparent}} standard) so the next service joins the same trace.
- **Sampling (head/tail)**: keep only part of the traces; head decides at the start of the request, tail decides after knowing whether the request failed or was slow.
- **OTel Collector / ADOT**: a process that receives, processes and exports telemetry; ADOT is AWS's distribution of OpenTelemetry.
- **MDC**: Mapped Diagnostic Context of SLF4J/Logback, where you put the trace ID so every log line carries it.
- **SLO**: a measurable service quality target, for example 99.9% of requests under 500 ms.

### Step by step: from one request to the on-call engineer finding the root cause
1. A request enters order-service; the OTel agent (or Micrometer Tracing) creates a trace ID and the root span. Why it is automatic: the agent already wraps Spring MVC, JDBC and HTTP clients.
2. When order-service calls payment-service, the trace ID travels in the {{traceparent}} header, so the span over there joins the same trace.
3. The trace ID is placed in the MDC, so every JSON log line of that request carries a {{trace_id}} field.
4. The collector batches spans, applies sampling and exports them to X-Ray or another backend; logs go to CloudWatch Logs; metrics go through EMF or Micrometer.
5. When a metric alarm (p99, 5xx ratio) crosses its threshold, SNS notifies the on-call engineer.
6. The engineer opens Logs Insights, filters ERROR lines, takes the {{trace_id}} and opens the trace, immediately seeing which span was slow.

~~~text
Client -> ALB -> order-service ----------> payment-service ----> RDS
                 span A 900 ms            span B 850 ms          span C 800 ms
Log order  : {"level":"ERROR","trace_id":"4bf92f...","msg":"payment timeout"}
Log payment: {"level":"WARN","trace_id":"4bf92f...","msg":"slow query"}
=> from one error log line -> trace_id -> trace -> span C (the DB query) is the culprit
Estimated log cost: 20 tasks x 2 GB/day x 30 days = 1,200 GB
  x ~0.5 USD/GB ingest  = ~600 USD/month, storage not included
~~~

Current note: for new projects AWS recommends instrumenting with OpenTelemetry (ADOT, CloudWatch agent) instead of the old X-Ray SDK/daemon; X-Ray remains the place where you view traces.

### CloudWatch
- **Logs**: log group per service/environment, log stream per task/instance. Logs Insights lets you query them.
- **Metrics**: AWS standard metrics (CPU, ALB 5xx, SQS depth) and custom metrics via EMF (Embedded Metric Format) or PutMetricData.
- **Alarms**: compare a metric with a threshold, send SNS, trigger Auto Scaling. Composite alarms reduce noise.
- **Dashboard**: gather the important metrics per service.

### Key metrics for a Java API
- ALB: {{TargetResponseTime}} p99, {{HTTPCode_Target_5XX_Count}}, {{UnhealthyHostCount}}, {{RequestCountPerTarget}}.
- JVM: heap used, GC pause, thread count (via Micrometer/CloudWatch agent).
- Business: orders created, payment failure rate — things infrastructure cannot see.
- SQS: {{ApproximateAgeOfOldestMessage}} (more important than message count), DLQ depth.

### X-Ray and OpenTelemetry
- **X-Ray** receives traces from the SDK/agent; it shows a service map, time per segment and errors. Sampling keeps the cost down.
- **OpenTelemetry (OTel)** is an open API/SDK/collector standard; on Java you use the agent or Micrometer Tracing. It can send traces to X-Ray, Jaeger, Tempo, Datadog and others.
- With Spring Boot 3, Micrometer Observation is the abstraction; add {{micrometer-tracing-bridge-otel}} and the matching exporter.
- **Correlation ID**: put the trace ID into the logs (MDC) to link logs and traces. Without it, scattered logs are very hard to join.

~~~yaml
# Example OTel configuration via environment variables
OTEL_SERVICE_NAME: order-service
OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4317
OTEL_TRACES_SAMPLER: parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG: "0.1"
~~~

### Controlling log cost
- Log ingestion is charged per GB; debug logs in production are the biggest hidden cost many teams run into.
- Set retention per log group (7–30 days for app logs, longer for audit).
- Filter before sending: only send WARN/ERROR, or sample DEBUG logs.
- Do not log full payloads (request body, tokens); it costs money and leaks data.
- Use metric filters instead of storing every line just to count errors.

### Production pitfalls
- **Alarms only on CPU.** Symptom: the system "dies" because the DB connection pool is exhausted while CPU stays low and no alarm fires. Fix: alarm on the symptoms users feel: p99 latency, 5xx ratio, age of the oldest message.
- **No SLO/alarm tied to user impact.** Symptom: you learn about the incident after customers complain. Fix: define an SLO and alarm on the error-budget burn rate.
- **100% trace sampling at high traffic.** Symptom: trace cost and overhead rise sharply. Fix: head sampling of 5–10% plus tail sampling that keeps every failed or slow trace.
- **Logs without a standard timestamp, trace ID or service name.** Symptom: during an incident you cannot join logs across services. Fix: JSON logs with fixed fields and the trace ID via MDC.
- **Too many dashboard charts and debug logs in production.** Symptom: nobody looks at the dashboard, and the log bill becomes the largest line item. Fix: 5–8 health indicators; retention per log group; send only WARN/ERROR or sampled DEBUG; use the Infrequent Access log class for logs that are rarely queried.

### One-minute spoken answer
"Observability has three pillars: metrics tell me there is a problem, logs tell me the details, and traces tell me which service the problem is in. On AWS, CloudWatch handles logs, metrics and alarms; for microservices I add tracing with OpenTelemetry, the trace ID travels in the traceparent header and is put into the MDC so every log line links to the trace, then it is exported to X-Ray or another backend. CloudWatch alone is enough for a small system, but without traces debugging microservices is very slow. On cost, log ingestion is billed per GB, so I set retention per log group, never log payloads, send only WARN and ERROR in production, and sample traces instead of keeping 100%. Alarms follow user SLOs such as p99 and the 5xx ratio, not CPU."

> Senior tip: start from the user SLO (for example 99.9% of requests under 500 ms), then pick the metrics and alarms that reflect that SLO. Observability is not "install an agent so it looks good"; it is the ability to answer a new question in minutes instead of hours.`,
    follow: [
      'Why do CPU-based alarms often not reflect a real incident?',
      'How should the trace ID be put into logs in Spring Boot?',
      'What are ways to cut CloudWatch Logs cost without losing investigation ability?'
    ],
  },
  'aws-013': {
    q: 'How does Secrets Manager differ from Parameter Store? How does KMS envelope encryption work, and when should a Java application retrieve secrets?',
    a: `**Summary:** Parameter Store is a cheap, simple place for configuration and basic secrets, encrypted through SecureString with KMS; Secrets Manager is purpose-built for secrets that need a lifecycle, automatic rotation and replication, with versions and staging labels. KMS envelope encryption encrypts data with a data key, and the data key itself is encrypted by the KMS key.

### Quick intuition
**Parameter Store** is like an internal notice board with a few lockable drawers: handy for configuration, and fine for a couple of simple passwords. **Secrets Manager** is like a safe with a treasurer: it changes the combination on a schedule (rotation), records who opened it, and keeps both the old and the new combination during the handover. **KMS envelope encryption** is like locking a document with a small key and then putting that small key into an envelope that only the bank (KMS) can open: the heavy document never travels to the bank, only the small key does.

### Key terms
- **KMS key (formerly CMK)**: the master key living inside KMS's HSM; it never leaves KMS in plaintext.
- **Data key**: an AES key generated to encrypt the real data; it is stored in encrypted form by the KMS key.
- **Envelope encryption**: encrypt the data with a data key, then encrypt the data key with the KMS key.
- **Encryption context**: a key-value pair that must match on decryption and is also written to CloudTrail for audit.
- **SecureString**: the Parameter Store parameter type encrypted with KMS.
- **Staging label**: a label pointing at a secret version: AWSCURRENT (in use), AWSPENDING (being rotated), AWSPREVIOUS (the previous one).
- **Rotation**: the process that changes a secret on a schedule, via Lambda or managed rotation.
- **Key policy**: a resource policy attached to the KMS key that decides who administers it and who may use it.

### Step by step
**Envelope encryption:**
1. The app calls {{GenerateDataKey}} with the KMS key id. KMS returns the data key in plaintext plus the same key already encrypted. Why: the KMS key never leaves KMS; only the data key comes out.
2. The app encrypts the data with the plaintext data key (AES-GCM) in memory, then wipes the plaintext key.
3. The app stores the encrypted data key next to the ciphertext.
4. To read: call {{Decrypt}} with the encrypted data key, receive the plaintext key back, and decrypt the data. Why it is fast: only a few hundred bytes go through KMS; 100 MB of data is still decrypted locally.

**Secrets Manager rotation (an RDS password):**
1. createSecret: generate a new password and tag it AWSPENDING.
2. setSecret: set the new password on the database.
3. testSecret: log in using the AWSPENDING version.
4. finishSecret: move AWSCURRENT to the new version; the old one becomes AWSPREVIOUS. Why a long-cached secret breaks: with the single-user strategy the old password stops working right at step 2; the alternating-users strategy keeps the old user valid until the next rotation.

~~~text
Encrypt: App --GenerateDataKey--> KMS
         App <-- plaintext DK + encrypted DK --
         ciphertext = AES-GCM(data, plaintext DK); wipe plaintext DK
         Store: [encrypted DK | ciphertext]
Decrypt: App --Decrypt(encrypted DK)--> KMS --> plaintext DK --> decrypt locally
~~~

### Comparison
| Criteria | Parameter Store | Secrets Manager |
|---|---|---|
| Purpose | Config + basic secrets | Secrets with a lifecycle and rotation |
| Encryption | SecureString via KMS | Encrypted via KMS by default |
| Automatic rotation | No (build it yourself with Lambda) | Yes, built in for RDS/Redshift/DocumentDB |
| Versions | Has versions, no rich staging labels | Versions + AWSCURRENT/AWSPREVIOUS staging labels |
| Cross-region | No (you replicate yourself) | Has replication |
| Cost | Standard is free, advanced has a fee | Charged per secret/month + API calls |
| Limit | 4 KB per value (standard) | 64 KB |

How to choose: if it is only a feature flag, endpoint or configuration parameter → Parameter Store. If it is a DB password that must rotate automatically, a third-party API key, or something that needs strict audit → Secrets Manager.

### Envelope encryption with KMS
- The KMS key (CMK) never leaves KMS; it is only used to encrypt/decrypt the **data key**.
- To encrypt large data: call {{GenerateDataKey}}, get the plaintext data key plus its encrypted copy. Use the plaintext key to encrypt the data with AES, store the encrypted data key next to the ciphertext, then wipe the plaintext from memory.
- To decrypt: call {{Decrypt}} with the encrypted data key to recover the plaintext key, then decrypt the data.
- Benefit: large data never goes through KMS; only the small data key does, which cuts latency and avoids the 4 KB KMS limit.
- **Encryption context** is an extra key-value binding; decryption must provide the same context, which helps prevent using ciphertext in the wrong place.

### How a Java application retrieves secrets
- Do not embed secrets in the image, do not commit them to Git, and do not put them in environment variables when you can avoid it (env leaks easily through process dumps).
- Fetch at startup through the SDK and cache in memory; **do not call the API on every request**, because it costs money and adds latency.
- For rotating secrets, refresh periodically or subscribe to notifications; if you cache forever, the old secret becomes invalid and logins start failing.
- Prefer the task/pod IAM role to call Secrets Manager, not access keys.

~~~java
SecretsManagerClient sm = SecretsManagerClient.create();
GetSecretValueResponse res = sm.getSecretValue(
    GetSecretValueRequest.builder().secretId("prod/orders/db").build());
String json = res.secretString();   // {"username":"app","password":"..."}
// parse with Jackson, create the DataSource, never log the value
~~~

With Spring Boot you can use {{spring-cloud-aws-secrets-manager-config}} or {{spring.config.import=aws-secretsmanager:prod/orders/db}} (depending on the version).

### Production pitfalls
- **Cache the secret forever, then turn rotation on.** Symptom: after the first rotation the app still uses the old password, RDS rejects it, and logins fail in bulk. Fix: cache with a TTL (say 5–15 minutes); on authentication errors reload the secret and rebuild connections; use the alternating-users strategy.
- **Log the secret while debugging.** Symptom: the password sits in CloudWatch and is hard to delete. Fix: never log the value; if it leaked, rotate immediately.
- **Grant {{secretsmanager:*}} or share one KMS key across environments.** Symptom: one compromised service exposes every secret, and dev and prod are hard to isolate. Fix: {{GetSecretValue}} on specific ARNs, separate keys and key policies per environment.
- **Call Parameter Store on every request.** Symptom: throttling at high traffic because GetParameter defaults to about 40 TPS (higher throughput has a fee). Fix: read at startup and cache with a TTL.

### One-minute spoken answer
"Parameter Store suits configuration and simple secrets: cheap, with SecureString encrypted by KMS; Secrets Manager is for secrets with a lifecycle: automatic rotation, built-in RDS integration, AWSCURRENT and AWSPREVIOUS staging labels, replication to other regions. Underneath, KMS uses envelope encryption: the KMS key never leaves KMS, it only encrypts a small data key; large data is encrypted locally with that data key, which is fast and avoids the 4 KB KMS limit. My Java application fetches the secret with its IAM role at startup, caches it in memory with a TTL rather than calling on every request, and reloads it on authentication errors. My lesson is that rotation is only safe when the application is designed to accept a new secret without a restart."

> Senior tip: a secret is data with a lifecycle, so design it like data with a lifecycle: an owner, a rotation schedule, an alert before expiry, and a way back if rotation fails. Do not turn "fetch the secret at startup" into "cache it until restart".`,
    follow: [
      'Why does KMS use envelope encryption instead of encrypting large data directly?',
      'How should a secret cached in the app refresh when rotation is enabled?',
      'Can Parameter Store SecureString replace Secrets Manager?'
    ],
  },
  'aws-014': {
    q: 'AWS cost optimization for a Java system: which levers work best, how do you measure, and which traps make cost go up instead of down?',
    a: `**Summary:** AWS cost usually concentrates in compute, database, storage and data transfer. The biggest levers are right-sizing, long-term commitments (Savings Plans/Reserved), Spot for interruptible workloads, Graviton for a better price/performance ratio, and controlling data transfer plus logs.

### Quick intuition
An AWS bill is like the utility bill of a big building: without a meter per apartment (tags), nobody knows who uses how much and nobody is responsible for saving. **Rightsizing** is swapping a 200 W bulb for a 60 W one when the room does not need that much light. **Savings Plans** are like paying for a year of electricity up front to get a discount — commit only to the part you are sure to use. **Spot** is like a cheap last-minute flight ticket: it can be cancelled. **Data transfer** is the hidden shipping fee: data crossing another AZ, going through NAT, or leaving to the Internet all costs money.

### Key terms
- **Rightsizing**: adjusting resource size to match real usage.
- **Savings Plans / Reserved Instances**: commit to a fixed hourly spend (or to a type of instance) for 1–3 years in exchange for a discount.
- **Spot**: spare EC2/Fargate capacity sold by AWS, much cheaper but reclaimable with a 2-minute warning.
- **Graviton**: ARM CPUs designed by AWS, with a better price/performance ratio than same-generation x86.
- **Cost allocation tag**: a tag (team, env, service) activated in Billing so cost can be split by group.
- **CUR (Cost and Usage Report)**: the most detailed cost file, delivered to S3 and queried with Athena.
- **Cross-AZ data transfer**: a fee per GB crossing between two AZs, charged for both directions.
- **Compute Optimizer**: a service that analyzes metrics and recommends EC2, ECS, Lambda and EBS sizes.

### Step by step: a monthly cost optimization cycle
1. **Measure**: turn on cost allocation tags, use Cost Explorer split by service and tag. Why first: without measurement you do not know where the money goes.
2. **Rank**: take the top 5 cost lines and the top 5 fastest-growing lines versus last month. Why: 80% of the money usually sits in a handful of lines.
3. **Rightsize**: look at p95 CPU/memory over 2–4 weeks through Compute Optimizer, shrink in small steps and watch latency. Why p95 and not the average: the average hides the peak hour.
4. **Commit**: only after rightsizing, buy Savings Plans for the stable baseline. Why this order: buying before trimming means prepaying for the excess.
5. **Change the architecture**: Spot for workers/batch, Graviton for Java services, endpoints instead of NAT, lifecycle rules for S3.
6. **Prevent regressions**: budgets with alerts per team, a policy that enforces tags, dev/staging turned off outside working hours.

~~~text
Example bill of 20,000 USD/month (illustrative):
  EC2/Fargate 9,000 | RDS 5,000 | NAT + data transfer 2,500 | CloudWatch 1,500 | S3 1,000 | other 1,000
  Rightsizing -20% compute          : -1,800
  Savings Plans for 6,000 baseline  : -1,500 (~25% off)
  ECR/S3 endpoints instead of NAT   :   -800
  Retention + drop debug logs       :   -700
  => ~15,200 USD/month, ~24% less with no functional change
~~~

### Reading the bill correctly
- Enable **Cost Explorer**, split by service, account and tag (team, env, service). Without tagging nobody owns the cost.
- Enable **AWS Budgets** with alerts on real thresholds and forecasts.
- Use the **Cost and Usage Report** (CUR) via Athena when you need detailed analysis.
- Review **Trusted Advisor** and **Compute Optimizer** regularly.

### Main levers
| Lever | Impact | Note |
|---|---|---|
| Rightsizing | High, no commitment | Measure p95 CPU/memory for 2–4 weeks, do not cut based on the average |
| Savings Plans / RI | 20–60% for stable compute | 1–3 year commitment; buy only the certain baseline |
| Spot | 60–90% for batch/worker | Can be reclaimed with a 2-minute warning; checkpoint needed |
| Graviton | 20–40% cheaper, good performance | Check native library/agent support for ARM |
| S3 lifecycle | High for old data | Move to IA/Glacier, delete incomplete multipart uploads |
| Data transfer | Easy to overlook | Cross-AZ, NAT and Internet egress all cost money |
| Log retention | Medium | Set retention, filter debug logs |
| Database | High | Aurora I/O-Optimized for I/O-heavy workloads; turn dev off outside hours |

### Data transfer — the hidden line
- Cross-AZ traffic between the app and DB/Redis costs money; place them in the same AZ when possible, while still ensuring HA.
- NAT Gateway is charged per GB; pulling Docker images through NAT on every deploy is expensive. Use VPC endpoints for ECR/S3.
- Internet egress is charged per GB; use CloudFront to cut cost and to cache.
- Do not forget cross-region replication fees when running DR.

### Java specifics
- The JVM often uses more memory than needed; set {{-XX:MaxRAMPercentage=75}} instead of a hard {{-Xmx}} so the container respects its real limit.
- Choose instance/task size from the real heap plus metaspace/thread-stack overhead, not by feel.
- Take advantage of Graviton (ARM64) for Java images: most pure Java libraries run fine; check native agents.
- Build pipelines pull images repeatedly: use the layer cache, ECR pull-through, and run builds in the same region.

### Production pitfalls
- **Cutting instances too aggressively.** Symptom: the app slows down, autoscaling adds instances back, total cost rises while users are still worse off. Fix: shrink one step at a time and watch p99 latency and instance count after each step.
- **Buying Reserved/Savings Plans for an unstable workload.** Symptom: a few months later you must change region or instance family, and the commitment becomes dead money. Fix: commit only the certain baseline; prefer Compute Savings Plans because they are flexible across instance family, region, and even Fargate/Lambda.
- **Spot for stateful workloads without checkpoints.** Symptom: reclaimed mid-run, work restarts from scratch, you pay double. Fix: checkpoint periodically, handle the 2-minute warning, and mix several instance types.
- **Deleting NAT to save money.** Symptom: the private subnet loses egress, people expose the app in a public subnet, and security drops. Fix: keep NAT and reduce traffic through it with VPC endpoints.
- **Forgetting dev/staging.** Symptom: large instances run 24/7 for an environment used only during office hours. Fix: scheduled scaling down to zero outside hours, and smaller instances than prod.

### One-minute spoken answer
"The AWS cost of a Java system usually concentrates in compute, database, data transfer and logs. I start with measurement: mandatory tags, Cost Explorer per team, budgets with alerts. Then I go in order: rightsizing based on p95 rather than the average, and only then Savings Plans for the stable baseline, Spot for interruptible workers, Graviton for Java services because it needs almost no code change. The commonly forgotten line is data transfer: pulling images through NAT, cross-AZ traffic, Internet egress; I handle it with VPC endpoints and CloudFront. The trade-off to remember is that cutting too hard can raise the total because autoscaling compensates. My experience is that a one-hour review every month, looking at the top 5 growing cost lines, beats any expensive tool."

> Senior tip: cost optimization is continuous work, not a one-off campaign. Enforce tags from day one, set budgets per team, and review the top 5 services by cost increase every month. A one-hour monthly review usually saves more than buying expensive tools.`,
    follow: [
      'Why is rightsizing by average CPU usually wrong?',
      'When do Savings Plans stop being worth buying?',
      'How do you control data transfer cost between microservices?'
    ],
  },
  'aws-015': {
    q: 'Infrastructure as Code: CloudFormation, CDK or Terraform? How should CI/CD for Spring Boot on AWS be organized?',
    a: `**Summary:** CloudFormation is AWS's native IaC service, CDK generates CloudFormation from a programming language, and Terraform is a multi-cloud tool with its own state. There is no universally right choice; pick based on multi-cloud needs, team skills and how much control over state you need. CI/CD should separate the infrastructure pipeline from the application pipeline, keep equivalent environments and deploy gradually.

### Quick intuition
Infrastructure as Code is like the blueprint of a house: instead of telling the builder "add a room" verbally, you edit the blueprint, everyone reviews it, the builder follows it, and building the same house again just means printing the same blueprint. **CloudFormation** is AWS's standard blueprint format (YAML/JSON). **CDK** lets you draw with a programming language such as Java or TypeScript and compiles it into CloudFormation. **Terraform** is a set of blueprints that works with many contractors (multi-cloud), but you must store the "current state book" (state) yourself. CI/CD is the automated assembly line: every code change goes through checks before reaching production.

### Key terms
- **Stack**: a group of CloudFormation resources created, updated and deleted together.
- **State (Terraform)**: a file recording which real resource corresponds to which code block; losing or corrupting state makes Terraform "forget" the infrastructure.
- **State locking**: a lock so two people cannot apply at the same time; Terraform 1.10+ can lock directly on S3 ({{use_lockfile}}), before that people usually used DynamoDB.
- **Drift**: a difference between real infrastructure and code caused by someone changing things by hand.
- **L2/L3 construct (CDK)**: an abstraction layer with good defaults (L2) or a whole architecture pattern (L3).
- **Blast radius**: how much damage a failed change can do.
- **Blue/green, canary**: blue/green builds the new version in parallel then switches traffic; canary sends a small share of traffic first.
- **Expand/contract**: changing a DB schema in two phases (add the new, backward-compatible thing first, then remove the old one).

### Step by step: a change from PR to production
1. A developer opens a PR. The pipeline builds, runs unit tests, static analysis, an IaC security scan, and {{terraform plan}} or {{cdk diff}}. Why: the reviewer sees exactly which resources will be created, changed and **deleted**.
2. Merge to main. The pipeline builds the image once, tags it with the commit SHA, pushes to ECR and scans the image. Why tag by SHA: you know exactly which code is running and can roll back.
3. Deploy to dev automatically, run integration tests; deploy to staging automatically.
4. Production needs approval; the pipeline assumes a short-lived role via OIDC instead of using a permanent access key.
5. Release with rolling, blue/green or canary; alarms (5xx, p99) watch the observation window.
6. If an alarm crosses its threshold, roll back automatically to the previous image SHA.

~~~text
PR ──> build + test + plan/diff + scan ──> review
merge ──> image orders:3f9c2a1 ──> ECR ──> dev ──> staging ──[approve]──> prod
                                                                canary 10% for 10 minutes
                                                                5xx > 1%? -> rollback
Terraform state split: network/prod | data/prod | app/prod | ... (one state file each)
~~~

### Comparison
| Criteria | CloudFormation | CDK | Terraform |
|---|---|---|---|
| Language | YAML/JSON | TypeScript, Java, Python, Go... | HCL |
| State | Managed by AWS | Managed by AWS (generates CFN) | You manage it (S3 + lock) |
| Multi-cloud | No | No (CDK for AWS) | Yes |
| Ecosystem | Slower, AWS standard | Convenient L2/L3 constructs | Rich provider ecosystem |
| Drift detection | Yes | Via CFN | Has plan/detect |
| Learning speed | Medium | Fast if you know TS/Java | Medium |

Choose CloudFormation when the team is AWS-only and wants fewer tools. Choose CDK when the team is strong at coding and wants abstraction and tests. Choose Terraform when multi-cloud, or when the organization already has Terraform standards.

### IaC principles
- **Everything in code**, including IAM, alarms and dashboards; no console clicking for production.
- **Split state by environment** (dev/staging/prod) and by layer (network, data, app) to reduce the blast radius.
- **Plan/diff before apply**, reviewed like code.
- **No hard-coded secrets**; reference Secrets Manager/Parameter Store.
- **Mandatory tags** (team, env, cost-center).
- **Periodic drift detection**; manual changes must go back into code or be reverted.

### Reference CI/CD
1. PR: build, unit tests, static analysis, {{terraform plan}}/{{cdk diff}}, security scan (Checkov/tfsec/trivy).
2. Merge: build the image, tag by commit SHA, push to ECR, scan the image.
3. Deploy to dev automatically; deploy to staging automatically after tests; production deploy requires approval.
4. Release strategy: rolling, blue/green (CodeDeploy with ALB), or canary via a weighted target group.
5. Rollback must be automatic when an alarm crosses its threshold.

~~~yaml
# Simplified GitHub Actions
- run: ./mvnw -B verify
- run: docker build -t $ECR_REPO:$GITHUB_SHA .
- run: docker push $ECR_REPO:$GITHUB_SHA
- run: aws ecs update-service --cluster prod --service orders \\
    --task-definition orders:$TASK_REV --force-new-deployment
~~~

### Production pitfalls
- **One shared Terraform state for every environment.** Symptom: a bad plan in dev touches prod resources. Fix: split state by environment and by layer.
- **Applying by hand from a laptop.** Symptom: no audit trail, infrastructure drifts from code, nobody knows who changed what. Fix: only the pipeline may apply, using a short-lived assumed role.
- **The pipeline does not pin action/image versions.** Symptom: today's build differs from yesterday's even though the code did not change. Fix: pin versions (or digests) for actions, base images and providers.
- **Blue/green but the DB migration is not backward compatible.** Symptom: rolling back the app does not save you because the schema already changed. Fix: expand/contract migrations, and separate schema deployment from app deployment.
- **Deploying infrastructure and app that depend on each other at the same time.** Symptom: the new app runs before the queue or secret it needs exists. Fix: separate the infrastructure and app pipelines, infrastructure first.

### One-minute spoken answer
"CloudFormation is AWS's native IaC and AWS manages the state; CDK lets me write infrastructure in Java or TypeScript and generates CloudFormation; Terraform is multi-cloud with a large provider ecosystem, but I must manage the state on S3 with locking. I choose by context: AWS-only with a strong coding team means CDK; multi-cloud or an organization already standardized on it means Terraform. Whatever I choose, the principles are the same: everything in code, state split by environment and layer to reduce blast radius, and plans reviewed like code. In CI/CD I separate the infrastructure pipeline from the application pipeline; the image is built once, tagged by commit SHA, and moves through dev, staging, then prod with approval, canary and automatic rollback on alarms. The biggest trap I have hit is a DB migration that is not backward compatible, so I always use expand/contract."

> Senior tip: IaC only has value when it is the only way to change infrastructure. If someone still clicks the console for prod, treat it as a process incident. Start small: network + data + one service, then expand.`,
    follow: [
      'Why should Terraform state be split by environment and by layer?',
      'How do you handle a DB schema change during a blue/green deployment?',
      'How do you detect and fix drift between code and real infrastructure?'
    ],
  },
  'aws-016': {
    q: 'Which pillars does the Well-Architected Framework have? How do you use it to review architecture instead of just answering theory?',
    a: `**Summary:** The Well-Architected Framework has 6 pillars: Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization and Sustainability. The real value is in a review process with concrete questions that identifies risks, assigns owners and tracks actions — not in memorizing the names.

### Quick intuition
The Well-Architected Framework is like a general health-check questionnaire for a system: not a textbook to memorize, but a list of questions that helps you find the "illness" before it breaks out. The six pillars are like six specialties: operations, security, reliability, performance, cost and sustainability. A good check-up ends with a **concrete prescription that has an owner and a follow-up date**, not a sheet saying "you should eat better".

### Key terms
- **Workload**: a set of resources and code that together deliver one business value, for example a payment system; the unit being reviewed.
- **Pillar**: one review angle with its own question set and best practices.
- **HRI / MRI (high/medium risk issue)**: a high or medium risk that the Well-Architected Tool records when an answer is missing a best practice.
- **Lens**: an extra specialized question set, for example the Serverless Lens, SaaS Lens or Financial Services Lens.
- **Well-Architected Tool**: a console service that stores answers, risks and milestones for each review.
- **Milestone**: a snapshot of the review at a point in time, used to compare progress.
- **Owner**: the person responsible for fixing one specific risk.
- **Blast radius**: the scope of impact when a component fails.

### Step by step: turning the framework into real change
1. **Pick the scope**: one specific workload, and invite the right people (dev lead, ops, security, product). Why: reviewing the whole company produces generic conclusions.
2. **Ask pillar by pillar**, demanding evidence: "have you tested losing an AZ, where is the result?" instead of "is it highly available?". Why: a "yes" without evidence usually means "no".
3. **Record the risk** with severity, business impact and owner.
4. **Prioritize** by impact × likelihood, combined with the cost of fixing it.
5. **Put actions into a backlog** with deadlines and save a milestone in the Well-Architected Tool.
6. **Review again** after 1–3 months, comparing the HRI count with the previous milestone.

~~~text
Priority matrix (example from reviewing a Spring Boot system):
                        High likelihood                  Low likelihood
High impact    | Losing an AZ not tested (do now)   | No DR region yet (plan it)
Low impact     | Logs missing trace ID (sprint)     | Instance 20% oversized (when idle)
Measured result: 7 HRI -> 2 HRI after 3 months
~~~

### Six pillars
- **Operational Excellence**: operate through code, be observable, learn from incidents, change safely.
- **Security**: identity is the main boundary, least privilege, encryption, data protection, detection and response.
- **Reliability**: self-healing, recovery testing, scaling with demand, managing change.
- **Performance Efficiency**: choose the right resources, monitor, optimize with data, consider serverless/edge.
- **Cost Optimization**: understand cost, choose the right model, analyze over time, do not optimize blindly.
- **Sustainability**: reduce energy consumption, choose efficient instances, use managed services, reduce wasted data.

### How to run a real review
1. Pick a specific workload (one system, not the whole company).
2. For each pillar, answer questions like: "Can the system survive losing one AZ, has it been tested?", "Who can deploy to prod, is MFA enabled?", "Which metric detects an incident within 5 minutes?".
3. Record the **risk** (high/medium/low) and the **owner**, not just "should improve".
4. Prioritize by business impact × likelihood, not by technical elegance.
5. Put actions into a backlog with deadlines; review again after 1–3 months.
6. Use the **AWS Well-Architected Tool** to store answers, but do not turn it into a box-ticking exam.

### Example pillar questions for a Spring Boot system
| Pillar | Question |
|---|---|
| Reliability | What happens to DB/app/LB when one AZ is lost? Has it been rehearsed? |
| Security | Where do secrets come from, who can read them? Any access key in the image? |
| Ops | Does deploy have automatic rollback? Do logs/traces carry a trace ID across services? |
| Performance | What is the p99 of the hot endpoint? Are there N+1 queries? Does the cache have a TTL? |
| Cost | Top 3 services by cost? Any environment running 24/7 for nothing? |
| Sustainability | Is the instance over-provisioned? Does old data have a lifecycle? |

### Production pitfalls
- **Reviewing like a checklist of ticked boxes.** Symptom: a long report and no change afterwards. Fix: every review must produce at least one decision and a backlog with deadlines.
- **Looking only at Reliability/Security and ignoring Cost/Ops.** Symptom: an architecture that is "beautiful" but expensive and impossible to operate. Fix: cover all six pillars and accept trade-offs explicitly in writing.
- **Evaluating the whole company instead of individual workloads, and having no owner.** Symptom: generic conclusions and risks that are recorded and then sit there. Fix: one workload per session, one owner per risk.
- **Ignoring people.** Symptom: a theoretically optimal architecture that a small team cannot run. Fix: the framework assumes the team has the capacity; for small teams, simpler managed services beat theoretically optimal ones.

### One-minute spoken answer
"Well-Architected has six pillars: Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization and Sustainability. I do not use it as theory but as a review process: choose one specific workload, ask each pillar questions that demand evidence — for example, have you rehearsed losing an AZ, who can deploy to prod, which metric detects an incident within five minutes. Each risk gets a severity, an owner, a spot in the backlog, and a re-review after one to three months, with a milestone saved in the Well-Architected Tool to show progress. The trade-off is that the pillars pull against each other: more reliability costs more money, so I present risks and cost to the business. For me a successful review produces a concrete decision, not a long document."

> Senior tip: use Well-Architected as a negotiation tool with the business: every risk comes with the cost of fixing it and the risk of not fixing it. The best review is one where a concrete decision is made, not one that produces a long document for the archive.`,
    follow: [
      'Why review workload by workload rather than the whole system?',
      'How do you handle high reliability requirements with a limited budget?',
      'Sustainability: which architecture decisions does it actually change?'
    ],
  },
  'aws-017': {
    q: 'You plan to put a group of APIs on API Gateway + Lambda. How do the timeout, payload and concurrency limits shape the design? REST API or HTTP API, and when should Lambda not be the backend?',
    a: `**Summary:** API Gateway + Lambda fits light APIs with variable traffic. Three limits drive the design: the integration timeout is **29 seconds** by default (HTTP API max 30 seconds), the real payload ceiling is **6 MB** because a synchronous Lambda invoke only accepts and returns 6 MB, and each execution environment handles one request at a time. HTTP API is cheaper and simpler; REST API has more features (usage plans, WAF, cache, canary, private endpoints).

### Quick intuition
API Gateway is like the reception desk of a building, and Lambda is like a temp worker called in when a guest arrives. The receptionist waits for a guest for at most about 29 seconds: past that, they tell the guest "time is up" (504) even though the worker behind is still working. Each temp worker serves one guest at a time, so 1,000 guests at once means 1,000 workers, and if all of them call the warehouse (the database), the warehouse switchboard jams. That is why long work must switch to "take a ticket, wait to be called" (202 + jobId).

### Key terms
- **Integration timeout**: the maximum time API Gateway waits for the backend before returning 504 to the client.
- **Lambda proxy integration**: API Gateway turns the whole request into a JSON event for Lambda and accepts a JSON response back.
- **Concurrency (Lambda)**: the number of execution environments handling requests at the same time; default max 1,000 per region (can be raised).
- **Reserved concurrency**: the amount reserved (and also the ceiling) for one function.
- **Usage plan / API key**: the REST API mechanism for quotas and throttling per customer/partner.
- **Authorizer**: the authentication step before calling the backend: IAM, Cognito, JWT or a custom Lambda.
- **Idempotency key**: a key sent by the client so the server recognizes a repeated request and returns the old result instead of processing twice.
- **RDS Proxy**: a managed proxy that funnels many Lambda connections into one small pool toward the database.

### Step by step: one synchronous request
1. The client calls {{POST /payments}}; API Gateway checks throttling and the authorizer. Why before Lambda: bad requests are rejected before any compute is paid for.
2. API Gateway invokes Lambda synchronously; if no environment is free, Lambda creates one (cold start), which counts against concurrency.
3. Lambda processes the request and returns a response of at most 6 MB.
4. If there is no response after 29 seconds, API Gateway returns 504, but Lambda **keeps running** until it finishes or hits the function timeout.
5. The client sees 504 and usually clicks again, creating a second request. Why an idempotency key is needed: the first attempt may already have succeeded.

~~~text
Client --POST--> API GW --invoke--> Lambda (1 request / environment)
                   |                    |
         29 s: 504 to client        keeps running until 40 s, billed to completion
Client retry ----> 2nd attempt: no idempotency key = charged twice

1,000 concurrent requests -> 1,000 environments -> up to 1,000 RDS connections
RDS PostgreSQL db.t4g.medium (4 GB): default max_connections ~400 -> connections exhausted
~~~

### Timeout: what happens past 29 seconds
- API Gateway drops the connection and returns **504** to the client, but **Lambda keeps running** (up to 15 minutes) and is still billed. If the function already completed the charge, the client gets 504, clicks again, and the transaction runs twice → any API with side effects must have an idempotency key.
- Since 2024, Regional/Private REST APIs can request an integration timeout beyond 29 seconds through Service Quotas, in exchange for a possibly lower account throttle quota. Edge-optimized and HTTP APIs do not have this option. Check the current documentation before relying on it.
- Long work should still be asynchronous: return **202 + jobId**, process via SQS/Step Functions, and let the client poll or receive a webhook.

~~~java
// Accept the request, push to SQS, return 202 immediately: independent of the API Gateway timeout
public APIGatewayV2HTTPResponse handleRequest(APIGatewayV2HTTPEvent event, Context ctx) {
    String jobId = UUID.randomUUID().toString();
    sqs.sendMessage(b -> b.queueUrl(queueUrl)
        .messageBody(jobId + "\\n" + event.getBody()));   // the worker reads jobId, processes, writes status
    return APIGatewayV2HTTPResponse.builder()
        .withStatusCode(202)
        .withHeaders(Map.of("Location", "/jobs/" + jobId))
        .build();
}
~~~

### Payload
- API Gateway accepts up to 10 MB, but a synchronous Lambda invoke limits both request and response to **6 MB**, so with Lambda proxy 6 MB is the real ceiling.
- Binary data travels base64-encoded, which inflates it by about 33%. For file upload/download, hand out an **S3 presigned URL** and keep files out of Lambda.

### REST API vs HTTP API
| Feature | REST API | HTTP API |
|---|---|---|
| Entry price (us-east-1) | about 3.5 USD/million requests | about 1 USD/million requests |
| Usage plan, API key, per-client throttling | Yes | No |
| Direct AWS WAF attachment | Yes | No (put CloudFront + WAF in front) |
| Response cache, request validation, mapping templates | Yes | No |
| Canary at stage | Yes | No |
| Endpoint types | Edge, Regional, Private | Regional |
| Authorizer | IAM, Cognito, Lambda | IAM, built-in JWT, Lambda |
| CORS | Configure OPTIONS yourself | Pre-configured |

WebSocket is a third API type and is outside this table. Choose HTTP API for simple internal APIs/BFFs authenticated with JWT; choose REST API for public APIs that need WAF, usage plans for partners, or private APIs called only from a VPC.

### When Lambda should not be the backend
1. Synchronous requests that regularly take more than a few seconds, or need long streaming: ECS Fargate behind an ALB (idle timeout up to 4000 seconds) is more natural.
2. High, steady traffic all day: paying per GB-second is often more expensive than running containers continuously; do the math with real numbers.
3. Calling RDS: 1,000 concurrent requests = 1,000 execution environments = up to 1,000 connections. Connections are reused across invocations within the same environment, but the total still explodes when scaling → you need **RDS Proxy** and a pool size of 1.
4. A heavy Spring Boot app with a large cold start that cannot use SnapStart or other optimizations.
5. Needing a GPU, or long-running background processes.

### Production pitfalls
- **Quotas are shared across the whole account/region.** Symptom: the default API Gateway throttle of 10,000 RPS with a 5,000 burst and Lambda concurrency of 1,000 are shared by every API, so one spammed API takes down the others. Fix: throttle per stage/route and use reserved concurrency for important functions.
- **Retry stacked on retry when hitting 504.** Symptom: client retries plus SDK retries multiply requests and the transaction runs several times. Fix: an idempotency key is mandatory for APIs with side effects, and cap the total number of retries.
- **API Gateway and Lambda logs are disconnected.** Symptom: you cannot join the failed request on both sides. Fix: enable access logs with the requestId and pass the requestId into Lambda logs.
- **Letting files travel through Lambda.** Symptom: payload-too-large errors because base64 inflates the file by 33% and blows past 6 MB. Fix: S3 presigned URLs.

### One-minute spoken answer
"With API Gateway plus Lambda I design around three limits. The integration timeout is about 29 seconds: past that the client gets 504 but Lambda keeps running, so APIs with side effects need an idempotency key, and long work returns 202 with a jobId and is handled through SQS or Step Functions. The real payload is 6 MB because of the synchronous Lambda invoke limit, so files go through S3 presigned URLs. Concurrency: each environment handles one request, so a thousand concurrent requests means a thousand connections to the database, which is why I use RDS Proxy with a pool size of one. On the API type, HTTP API is cheap and simple with a JWT authorizer; REST API is for WAF, usage plans, caching or private endpoints. I avoid Lambda when requests are regularly long, traffic is high and steady, or the Spring Boot app is too heavy to optimize its cold start."

> Senior tip: write down in the ADR which endpoints are allowed to run longer than 3 seconds. If that list is non-empty, split them into asynchronous flows from the start; waiting until clients see 504 means changing the whole API contract.`,
    follow: [
      'The client got a 504 but Lambda charged the card successfully: how do you design idempotency?',
      'Why does Lambda calling RDS need RDS Proxy, and how large should the pool in the function be?',
      'When do you put CloudFront in front of HTTP API?'
    ],
  },
  'aws-018': {
    q: 'The account opening process includes eKYC, scoring, manual approval and core banking account creation. Do you orchestrate with Step Functions or write a Saga in Java, and why?',
    a: `**Summary:** Step Functions is a managed orchestrator: each step's state, retry/backoff, catch, manual wait (task token) and execution history come built in, at the price of AWS lock-in and a 256 KB payload limit. Writing a Saga in Java gives full control, but you must build state persistence, retries, timeouts, compensation and audit yourself. A long, multi-step process with human approval like account opening fits **Step Functions Standard** very well.

### Quick intuition
Account opening is like an application file passing through several departments: document verification (eKYC), scoring, a manager signing off, then the account-opening department. **Step Functions** is like a professional coordinator with a tracking book: it knows which step the file is on, calls a department again when it is busy, can wait days for a signature without costing salary, and records every step for audit. **Writing your own Saga** is like doing that coordinator job yourself in code: total flexibility, but the book, the reminders, the retries and the cancellation when something is rejected are all yours to build.

### Key terms
- **Orchestration**: a central coordinator that instructs each step; the opposite of choreography, where services react to events on their own.
- **Saga**: a chain of local transactions where each step has a compensating action to undo it when a later step fails.
- **State machine / ASL**: the Step Functions workflow, written in Amazon States Language (JSON).
- **State transition**: every move from one state to another; the Standard workflow bills per one of these.
- **Task token**: an identifier for a step that is waiting; an external system sends the token back to report success or failure.
- **Execution history**: the event log of one run, including the input/output of each step.
- **Distributed Map**: a Map mode that runs thousands of child executions in parallel over a large data set.
- **Compensation**: a business undo action, for example cancelling a created file or refunding money.

### Step by step: one application file through Step Functions
1. The API starts an execution named after the case code ({{APP-2025-000123}}). Why name it: Step Functions Standard rejects duplicate names, which prevents starting the same process twice.
2. The eKYC step calls Lambda; on transient errors (throttle, timeout) Retry runs automatically with backoff of 2, 4, 8 seconds.
3. The Scoring step: the business error {{ScoreRejected}} is caught and routed to a rejection-notification branch.
4. The ManualReview step uses {{.waitForTaskToken}}: it sends the token to the review queue, and the execution pauses without consuming compute. HeartbeatSeconds/TimeoutSeconds can route to a branch when it expires.
5. A reviewer approves in an internal screen and the backend calls {{SendTaskSuccess}} with the token; the execution continues.
6. The OpenAccount step calls core banking with an idempotency key; on a permanent failure it runs compensation.

~~~text
[Start] -> eKYC --retry--> Scoring --ScoreRejected--> NotifyRejected -> [End]
                              |
                              v
                       ManualReview (task token, waits up to 3 days)
                              | SendTaskSuccess          | timeout
                              v                          v
                       OpenAccount --error--> Compensate -> NotifyFailed
                              |
                            [End]
~~~

### What Step Functions does for you
- **Standard workflow**: runs up to 1 year, records every step in the execution history (kept 90 days), and bills per **state transition**. Fits long business processes that need audit.
- **Express workflow**: up to 5 minutes, billed by request count and run time, history only available if CloudWatch Logs is enabled. Fits high-volume, short event processing.
- **Declarative Retry/Catch**: retry by error type with backoff; business errors jump to a compensation step.
- **Callback**: a step using {{.waitForTaskToken}} sends a token to an external system and pauses (with no compute cost) until someone calls {{SendTaskSuccess}} or {{SendTaskFailure}}. This is how you build the "manual approval" step.

~~~json
"Scoring": {
  "Type": "Task",
  "Resource": "arn:aws:states:::lambda:invoke",
  "Parameters": { "FunctionName": "credit-scoring", "Payload.$": "$" },
  "Retry": [{ "ErrorEquals": ["Lambda.TooManyRequestsException", "States.Timeout"],
              "IntervalSeconds": 2, "BackoffRate": 2, "MaxAttempts": 3 }],
  "Catch": [{ "ErrorEquals": ["ScoreRejected"], "Next": "NotifyRejected" }],
  "TimeoutSeconds": 30,
  "Next": "ManualReview"
}
~~~

### Writing your own Saga: what you must build
~~~java
// Self-written orchestrator: commit state after EVERY step, never wrap @Transactional around a remote call
public void advance(UUID sagaId) {
    Saga s = sagas.load(sagaId);
    try {
        if (s.step() == Step.KYC_PASSED) {
            scoring.score(s.customerId(), s.key("score"));   // the target API must be idempotent by key
            s = sagas.moveTo(sagaId, Step.SCORED);           // short transaction, local DB only
        }
        if (s.step() == Step.APPROVED) {
            coreBanking.openAccount(s.customerId(), s.key("open"));
            sagas.moveTo(sagaId, Step.DONE);
        }
    } catch (BusinessRejectException e) {
        sagas.moveTo(sagaId, Step.COMPENSATING);              // another job runs compensation, also idempotent
    }   // transient error: do nothing, the scheduler calls advance() again later
}
~~~
Beyond the snippet you still need: a scheduler that scans stuck sagas, per-step timeouts, an audit table, a lookup screen and a manual rerun mechanism. That is exactly what Step Functions gives you out of the box.

### Comparison
| Criteria | Step Functions | Self-written Saga |
|---|---|---|
| State storage, history | Built in | Design your own table + audit |
| Waiting days for human approval | Task token, no compute cost | Pending table + scheduler |
| Observability | Console shows each step with input/output | Build your own dashboard |
| Payload per step | At most 256 KB | Depends on the DB |
| Testing | TestState API per state, integration tests on a sandbox account | Plain Java unit tests |
| Lock-in, on-premises | AWS only | Portable |

### Production pitfalls
- **Passing large data between steps.** Symptom: ID-card images or OCR results exceed 256 KB and the execution fails. Fix: store them in S3 and pass only the key.
- **Loops or large Maps in Standard.** Symptom: hitting the 25,000-event history limit and the execution fails. Fix: Distributed Map or split into child executions.
- **Believing Step Functions retry makes a step idempotent.** Symptom: core banking opens two accounts for one application. Fix: the target Lambda/API must still prevent duplicates; name executions after the case code to avoid starting the process twice.
- **Stuffing business logic into ASL.** Symptom: deeply nested Choice states that are hard to test and read. Fix: ASL is only the orchestration skeleton; logic stays in code.

### One-minute spoken answer
"For account opening I lean toward Step Functions Standard. It is a managed orchestrator: each step has state, declarative retry with backoff and catch, the manual approval step uses a task token so it can wait days without compute cost, and the execution history tells auditors who approved, when, and with what input. If I wrote the saga in Java myself, I would have to persist state after every step and build the scheduler that scans stuck sagas, timeouts, compensation and a lookup screen. In exchange, Step Functions locks you into AWS, the payload per step is at most 256 KB so large documents belong in S3, and history is kept only 90 days. Whichever way I go, target steps must be idempotent; I name executions after the case code and push important events to a separate audit store."

> Senior tip: in banking the strongest reason to choose Step Functions is often audit: when auditors ask "who approved this case, when, and with what input", the execution history answers immediately. But history is kept only 90 days, so important events must still be pushed to a separate audit store with the retention period required by regulation.`,
    follow: [
      'Standard or Express for account opening, and for processing 5,000 events/second?',
      'A manual approval step waits 3 days and then times out: how do you design the timeout and compensation?',
      'When is choreography over Kafka a better fit than orchestration?'
    ],
  },
  'aws-019': {
    q: 'Aurora PostgreSQL failover finishes in about 30 seconds, yet the Spring Boot service keeps failing to write for several minutes. Why, and how do you configure the JVM, connection pool and driver to recover quickly?',
    a: `**Summary:** An Aurora failover changes the cluster endpoint's DNS record to point at the new writer, but the Java application may still use the old IP (JVM DNS cache) and the connection pool still holds connections to the old instance, which is now a reader, so writes fail with the "read-only" error. The fix: short JVM DNS TTL, a pool that discards broken connections, and ideally the **AWS Advanced JDBC Wrapper** with the failover plugin so it reconnects to the new writer using topology instead of waiting for DNS; the application must also retry transactions.

### Quick intuition
Imagine the main teller window (the writer) closing and the window next to it (a replica) being re-signed as the main window. The signpost (DNS) changed after about 30 seconds, but your customers still remember the old route (JVM DNS cache) and are still queuing at the old window (connections in the pool). The old window reopens, but now only serves lookups, not writes, so every write is rejected as "read-only". To recover quickly, customers must re-check the signpost, leave the old queue when something looks wrong, or have a guide who knows the real floor plan (the AWS Advanced JDBC Wrapper).

### Key terms
- **Cluster endpoint (writer endpoint)**: the DNS name that always points at the current writer of the Aurora cluster.
- **Reader endpoint / instance endpoint**: a DNS name that load-balances across readers / the fixed DNS name of one instance.
- **Failover**: Aurora promoting a reader to writer when the writer fails or when you request it.
- **JVM DNS cache**: the JVM remembers name-resolution results according to {{networkaddress.cache.ttl}}.
- **max-lifetime (HikariCP)**: the maximum lifetime of a pooled connection before it is replaced.
- **Socket timeout**: how long the driver waits for data on a socket before treating the connection as dead.
- **Topology**: the list of instances and their current roles (writer/reader) that the wrapper reads directly from Aurora.
- **Stalled TCP (half-open)**: the other end has died without sending RST, while the client socket still believes it is alive.

### Step by step: recovery when the configuration is right
1. Writer A fails; the efm plugin, watching on a separate thread, notices A is not responding after a few seconds instead of waiting for the operating system's TCP timeout.
2. The failover plugin reads the topology and connects straight to the new writer B without waiting for DNS. Why it is faster: it skips both Aurora's DNS TTL and the JVM DNS cache.
3. The wrapper throws {{FailoverSuccessSQLException}} into the running transaction, signalling that the connection moved to B but the old transaction was lost.
4. The application's retry layer reruns the whole transaction (if that is safe), and this time it succeeds on B.
5. The remaining pooled connections are replaced one by one thanks to max-lifetime and the broken-connection eviction mechanism.

~~~text
Time with no writes, measured from the application (illustrative numbers):
Defaults (DNS cache 30 s+, pool keeps old connections, stalled TCP) : 2-5 minutes
DNS TTL 5 s + max-lifetime 5 minutes + socketTimeout                 : ~1-2 minutes
AWS Advanced JDBC Wrapper (failover + efm) + retry                   : usually < 1 minute
~~~

### What happens during a failover
~~~text
t=0     writer A dies / is failed over
t=~5s   Aurora promotes replica B to writer
t=~30s  cluster endpoint (CNAME, TTL 5s) points to B; A restarts as reader
App:    pool still holds 20 connections to A
        JVM still caches A's IP -> new connections also go to A
        INSERT -> ERROR: cannot execute INSERT in a read-only transaction
~~~
Three layers cause the delay: the **JVM DNS cache**, **old connections in the pool**, and **stalled TCP** when the old instance dies without sending RST (the socket waits for the operating system's timeout).

### Layer 1: the JVM DNS cache
- The {{networkaddress.cache.ttl}} property: with a SecurityManager present the default is to cache forever; without one the default is about 30 seconds (implementation-dependent). AWS recommends setting it to no more than 60 seconds.
- Set it early at startup, before the first resolve: {{Security.setProperty("networkaddress.cache.ttl", "5")}}, or edit java.security in the image.

### Layer 2: the connection pool
- HikariCP does not know a connection points at a reader. Set {{max-lifetime}} to a few minutes so connections are periodically replaced, and keep {{connection-timeout}} short to fail fast.
- Set the driver socket timeout (PostgreSQL: {{socketTimeout}}) so queries do not hang forever on dead TCP.

### Layer 3: the AWS Advanced JDBC Wrapper
The wrapper wraps the native PostgreSQL/MySQL driver and adds plugins:
- **failover**: reads the cluster topology from the database itself; when the writer is lost it connects straight to the new writer without relying on DNS. After switching it throws {{FailoverSuccessSQLException}} to signal that the current transaction was lost and the application must rerun it.
- **efm** (Enhanced Failure Monitoring): monitors the host on a separate thread and detects a dead instance faster than the TCP timeout.
- There are also IAM authentication, Secrets Manager and read/write splitting plugins. Newer versions have failover2/efm2; the default plugin names change between versions, so check the current documentation.

~~~yaml
spring:
  datasource:
    url: jdbc:aws-wrapper:postgresql://core.cluster-xxxx.ap-southeast-1.rds.amazonaws.com:5432/core
    driver-class-name: software.amazon.jdbc.Driver
    hikari:
      maximum-pool-size: 20
      max-lifetime: 300000          # 5 minutes
      connection-timeout: 3000      # fail fast instead of hanging threads
      # so Hikari does not treat failover errors as a mass connection failure (per the wrapper guide)
      exception-override-class-name: software.amazon.jdbc.util.HikariCPSQLException
      data-source-properties:
        wrapperPlugins: failover,efm
        wrapperDialect: aurora-pg
~~~

### The application must still retry
- A failover always loses the in-progress transaction. Wrap service methods with 1–2 retries for failover errors, **only when the operation is idempotent** or the whole transaction is rerun from scratch.
- Errors during commit can leave the state unclear (the wrapper has {{TransactionStateUnknownSQLException}}): verify with an idempotency key before rerunning, especially for money transfers.

### Alternative: RDS Proxy
RDS Proxy keeps the connections on the client side and automatically reconnects to the new writer, shortening failover time without changing the driver. The trade-off: extra cost, an extra hop, and pinning that reduces multiplexing effectiveness when using prepared statements/session state.

### Production pitfalls
- **Testing failover only on paper.** Symptom: a real incident lasts many times longer than expected. Fix: run {{aws rds failover-db-cluster}} on staging under load and measure the write-failure time from the application side.
- **Using a hard-coded instance endpoint instead of the cluster endpoint.** Symptom: after failover the app still writes to the old instance, which is now a reader. Fix: always write through the cluster (writer) endpoint or through the wrapper.
- **Infinite retries with a tiny backoff.** Symptom: a connection storm hits the new writer exactly when it just came up. Fix: 1–2 retries with backoff and jitter, plus a short connection-timeout.
- **Retrying a non-idempotent transaction.** Symptom: an error during commit, and the rerun debits the money twice. Fix: verify with an idempotency key before rerunning.

### One-minute spoken answer
"An Aurora failover only changes the cluster endpoint's DNS to the new writer, but three layers in the Java application slow it down: the JVM caches the old IP, HikariCP still holds connections to the old instance which is now a reader so every write fails as read-only, and TCP can stall when the old instance dies without sending RST. I handle each layer: set networkaddress.cache.ttl to about 5 seconds, max-lifetime to a few minutes, and short connection-timeout and socketTimeout to fail fast. Best is the AWS Advanced JDBC Wrapper with the failover and efm plugins; it reads the topology from the database and connects straight to the new writer without waiting for DNS. Even so, the running transaction is always lost, so the application must retry with a limit and only idempotently. The target I measure is the time with no writes from the application's perspective, and I rehearse quarterly."

> Senior tip: the measurable target should be "time with no writes possible" from the application's point of view, not the failover time shown in the console. With default settings this is often several minutes; after tuning DNS TTL, the pool and the wrapper, many teams bring it below one minute. Rehearse quarterly and write the numbers into the runbook.`,
    follow: [
      'A FailoverSuccessSQLException happens in the middle of a money transfer: how do you avoid debiting twice?',
      'What is the replica-lag pitfall of read/write splitting with the Aurora reader endpoint?',
      'When should you choose RDS Proxy over the AWS Advanced JDBC Wrapper?'
    ],
  },
  'aws-020': {
    q: 'The public API of a digital wallet is being scanned by bots guessing passwords and occasionally hit by DDoS. How do you build the edge layer with CloudFront, AWS WAF and Shield, and what should be cached?',
    a: `**Summary:** Put **CloudFront** in front of ALB/API Gateway to terminate TLS at the edge, absorb network-layer attacks and cache public content; attach an **AWS WAF** web ACL with managed rules, rate-based rules and Bot Control/ATP for the login endpoint; **Shield Standard** is free and protects against L3/L4 DDoS, while **Shield Advanced** is for teams that need a DDoS response team and cost protection. Equally important: lock the origin so it only accepts traffic from CloudFront.

### Quick intuition
The edge layer is like the security system of a shopping mall. **CloudFront** is hundreds of entrances spread across the city: visitors come in at the nearest one, and shared material (flyers, price boards) is handed out right at the door (cache) instead of going to the warehouse. **AWS WAF** is the guard checking each visitor at the door: who is carrying a "weapon" (SQL injection), who goes in and out too many times (password guessing), who looks like a robot. **Shield** is the barrier against a shoving crowd (DDoS): the Standard tier is free, the Advanced tier comes with a professional response team. And importantly: the warehouse's back door (the origin) must be locked and only opened to the mall's own vehicles.

### Key terms
- **Edge location**: a CloudFront point of presence near users, where TLS is terminated and cached content is served.
- **Origin**: the real backend behind CloudFront (ALB, API Gateway, S3).
- **Cache key / cache policy**: the set of components (path, query, headers, cookies) that decide whether two requests share a cached copy.
- **Web ACL**: the set of AWS WAF rules attached to CloudFront, ALB or API Gateway.
- **Rate-based rule**: a rule that counts requests per IP or a custom key in a time window and blocks when the count exceeds a threshold.
- **Credential stuffing**: using lists of accounts/passwords leaked elsewhere to try logging in at scale.
- **CGNAT**: a mobile carrier lets many subscribers share one public IP.
- **Count mode**: a rule mode that only counts and logs, without blocking, used to trial a new rule.

### Step by step: a login request through the edge layer
1. The client resolves the domain and is routed to the nearest edge location; AWS's network layer (Shield Standard) filters SYN floods and UDP reflection.
2. CloudFront terminates TLS. Why at the edge: it saves origin CPU and reduces handshake latency.
3. WAF evaluates the web ACL in priority order: IP reputation, vulnerability rules, rate-based, Bot Control/ATP (only for {{/login}}). Any rule that Blocks returns 403 immediately, and the origin never sees the request.
4. A valid request: public paths may be served from cache; {{/login}} uses CachingDisabled so it continues to the origin with a secret header.
5. ALB only accepts traffic from CloudFront's prefix list and with the secret header; the app reads the real client IP from X-Forwarded-For.

~~~text
Credential stuffing burst (illustrative): 2 million attempts / 1 hour from 40,000 IPs
  -> each IP only ~50 requests/hour: a per-IP rate limit (say 100/5 minutes) does NOT catch it
  -> ATP matches leaked credentials + Bot Control + device signals
  -> ALB/ECS only sees a fraction of traffic, autoscaling is not triggered for nothing
~~~

### Why the edge
The closer to the user an attack is blocked, the cheaper it is: SYN floods and UDP reflection are absorbed by AWS edge infrastructure; bad L7 requests are blocked by WAF before a connection to the ALB is opened, so no Java service CPU is spent and no pointless autoscaling is triggered.

~~~text
Client -> CloudFront (TLS, cache, WAF, Shield) -> ALB (accepts only from CloudFront) -> ECS
~~~

### CloudFront: what to cache
- **Cache**: static assets, public configuration, province/bank lists, published exchange rates (short TTL of 10–60 seconds). The cache key should only include queries/headers that really change the content; extra cache keys drive the hit rate to zero.
- **Do not cache**: personalized responses (balance, transaction history), anything depending on a token. Use a CachingDisabled policy for those paths.
- The default origin response timeout is 30 seconds; endpoints that take longer need a design change, not just a bigger timeout.

### Locking the origin
- The ALB security group should only allow the managed prefix list {{com.amazonaws.global.cloudfront.origin-facing}}.
- Add a secret custom header from CloudFront and an ALB rule that rejects requests without it (because the prefix list is shared by every CloudFront customer, not just you).
- Or use a CloudFront VPC origin so the ALB stays entirely in a private subnet.

### AWS WAF: rule layers
| Layer | Rule | Purpose |
|---|---|---|
| Reputation | Amazon IP reputation, Anonymous IP list | Block botnets and anonymous proxies |
| Vulnerability | Core rule set, Known bad inputs, SQL database | SQLi, XSS, Log4Shell payloads |
| Rate | Rate-based rule per IP or a custom key | Stop floods and password guessing |
| Bot | Bot Control, Challenge/CAPTCHA | Tell bots apart from real browsers |
| Fraud | Account Takeover Prevention (ATP) | Detect credential stuffing at the login endpoint |

- A web ACL for CloudFront must be created in the CloudFront scope (region us-east-1).
- Bot Control and ATP charge extra per request: apply them only to paths that need it, such as /login and /otp, using scope-down statements.
- A new rule should always run in **Count** mode for a few days, review the logs, then switch to Block.

### Shield
- **Standard**: free, automatic, protects against L3/L4.
- **Advanced**: a fixed monthly fee (around 3,000 USD/month for the whole organization, 1-year commitment, check the current documentation), with the Shield Response Team, automatic L7 DDoS mitigation through WAF, and cost protection when DDoS drives scaling. Fits banks and wallets with SLAs and reputation risk.

### Production pitfalls
- **A per-IP rate limit that is too strict in Vietnam.** Symptom: real customers on 4G get blocked en masse because carriers use CGNAT, with thousands of people sharing one IP. Fix: key by header/device, use a separate threshold for {{/login}}, and run Count before Block.
- **The application reads the wrong client IP.** Symptom: logs and in-app rate limits all show the CloudFront/ALB IP. Fix: read X-Forwarded-For (Spring: {{server.forward-headers-strategy}}) or the {{CloudFront-Viewer-Address}} header.
- **The origin is not locked.** Symptom: attackers call the ALB directly, bypassing all of WAF and the cache. Fix: prefix list + secret header, or a CloudFront VPC origin.
- **Blocking by country, or an oversized cache key.** Symptom: customers travelling abroad cannot log in; the cache hit rate drops to zero. Fix: use CAPTCHA/Challenge instead of hard blocking, and keep the cache key limited to components that change the content.

### One-minute spoken answer
"I put CloudFront in front of the ALB or API Gateway to terminate TLS at the edge, absorb network-layer attacks and cache public content such as configuration and bank lists with a short TTL; anything personalized, such as balances, has caching turned off. On CloudFront I attach AWS WAF with managed rules for bad IPs and attack payloads, a rate-based rule, and Bot Control plus Account Takeover Prevention applied only to /login to control cost; a new rule always runs in Count first. Shield Standard handles L3/L4 DDoS for free, and Shield Advanced is for when I need a response team and cost protection. The origin must be locked with CloudFront's prefix list plus a secret header. My experience: real credential stuffing uses tens of thousands of IPs, so a per-IP rate limit is nearly useless and you have to rely on bot and device signals."

> Senior tip: measure effectiveness with WAF logs in Athena: the blocked-request ratio per rule, top IPs/ASNs, and false positives reported by customer service. A real credential stuffing campaign often uses tens of thousands of IPs with only a few requests each; a per-IP rate limit is nearly useless there, so you must rely on Bot Control/ATP and device signals.`,
    follow: [
      'How do you avoid caching one user\'s personal data for another user?',
      'Credential stuffing from 50,000 different IPs: is a rate-based rule enough?',
      'When is Shield Advanced worth the cost?'
    ],
  }
});
