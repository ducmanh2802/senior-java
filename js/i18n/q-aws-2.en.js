/*
 * English translation of js/data/q-aws.js — task T207. Format: js/core/i18n.js (content overlay).
 * ids: aws-012 aws-013 aws-014 aws-015 aws-016 aws-017 aws-018 aws-019 aws-020
 */
App.i18n.content({
  'aws-012': {
    q: 'Observability on AWS for a Java system: is CloudWatch logs/metrics/alarms enough, what do X-Ray and OpenTelemetry add, and how do you avoid log costs?',
    a: `**Summary:** CloudWatch is the default AWS platform for logs/metrics/alarms; X-Ray traces distributed requests; OpenTelemetry is an open standard for instrumenting and sending traces/metrics/logs to any backend. The three pillars are logs, metrics, traces — without traces, debugging microservices is very slow.

### CloudWatch
- **Logs**: Log group per service/environment, log stream per task/instance. Uses Logs Insights for querying.
- **Metrics**: standard AWS metrics (CPU, ALB 5xx, SQS depth) and custom metrics via EMF (Embedded Metric Format) or PutMetricData.
- **Alarms**: compare metric against threshold, send SNS, trigger Auto Scaling. Composite alarms reduce noise.
- **Dashboard**: gather key metrics per service.

### Key metrics for a Java API
- ALB: {{TargetResponseTime}} p99, {{HTTPCode_Target_5XX_Count}}, {{UnhealthyHostCount}}, {{RequestCountPerTarget}}.
- JVM: heap used, GC pause, thread count (via Micrometer/CloudWatch agent).
- Business: successful orders created, payment error rate — things infrastructure does not see.
- SQS: {{ApproximateAgeOfOldestMessage}} (more important than message count), DLQ depth.

### X-Ray and OpenTelemetry
- **X-Ray** receives traces from SDK/agent; shows service map, time per segment, errors. Has sampling to reduce cost.
- **OpenTelemetry (OTel)** is an open API/SDK/collector standard; Java uses agent or Micrometer Tracing. Can send to X-Ray, Jaeger, Tempo, Datadog, etc.
- With Spring Boot 3, Micrometer Observation is the abstraction; add {{micrometer-tracing-bridge-otel}} and the appropriate exporter.
- **Correlation ID**: put trace ID into log (MDC) to connect log and trace. Without it, scattered logs are very hard to link.

~~~yaml
# Example OTel configuration via environment variables
OTEL_SERVICE_NAME: order-service
OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4317
OTEL_TRACES_SAMPLER: parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG: "0.1"
~~~

### Controlling log costs
- Log ingestion is charged per GB; debug logs in production are the biggest hidden cost many teams face.
- Set retention per log group (7–30 days for app, longer for audit).
- Filter before sending: only send WARN/ERROR, or sample DEBUG logs.
- Do not log full payloads (request body, token); it costs money and leaks data.
- Use metric filters instead of storing every line just to count errors.

### Production pitfalls
- Alarm only based on CPU: the system can fail because of a drained DB connection pool while CPU stays low.
- No SLO/alarm based on user impact: you find out too late after customers complain.
- 100% trace sampling at high traffic: cost and overhead rise sharply; use reasonable head/tail sampling.
- Log without standard timestamp, without trace ID, without service name: useless during an incident.
- Dashboard with too many charts: nobody looks at it. Pick 5–8 indicators that reflect health.

> Senior tip: start from user SLO (e.g. 99.9% requests < 500 ms), then choose metrics/alarms that reflect that SLO. Observability is not "install an agent for show"; it is the ability to answer a new question in minutes instead of hours.`,
    follow: [
      'Why do CPU-based alarms often miss real failures?',
      'How should trace ID be included in Spring Boot logs?',
      'What are the ways to reduce CloudWatch Logs cost without losing investigation ability?'
    ],
  },
  'aws-013': {
    q: 'How does Secrets Manager differ from Parameter Store? How does KMS envelope encryption work, and when should a Java application retrieve secrets?',
    a: `**Summary:** Parameter Store is a simple, cheap place for configuration and basic secrets, encrypted via SecureString with KMS; Secrets Manager is purpose-built for secrets with lifecycle, automatic rotation, versions and replication. KMS envelope encryption uses a data key to encrypt data; the data key itself is encrypted by the KMS key.

### Comparison
| Criteria | Parameter Store | Secrets Manager |
|---|---|---|
| Purpose | Config + basic secrets | Secrets with lifecycle, rotation |
| Encryption | SecureString via KMS | Encrypted via KMS by default |
| Auto rotation | No (do it yourself with Lambda) | Built-in, integrated with RDS/Redshift/DocumentDB |
| Versions | Has versions, less rich staging labels | Versions + AWSCURRENT/AWSPREVIOUS staging labels |
| Cross-region | No (replicate yourself) | Has replication |
| Cost | Standard free, advanced has fee | Charged per secret/month + API calls |
| Limit | 4 KB/value (standard) | 64 KB |

Choice: if it is just a feature flag, endpoint, config parameter → Parameter Store. If it is a DB password that needs automatic rotation, a third-party API key, or needs strict audit → Secrets Manager.

### Envelope encryption with KMS
- The KMS key (CMK) never leaves KMS; it is only used to encrypt/decrypt the **data key**.
- When encrypting large data: call {{GenerateDataKey}}, receive plaintext data key + encrypted version. Use plaintext key to encrypt data with AES, store the encrypted data key alongside ciphertext, then delete plaintext from memory.
- When decrypting: call {{Decrypt}} with the encrypted data key to recover plaintext, then decrypt the data.
- Benefit: large data is not sent through KMS; only the small data key goes through, reducing latency and the 4 KB KMS limit.
- **Encryption context** is an additional key-value binding; decryption must provide the same context, helping prevent misuse of ciphertext.

### How a Java application retrieves secrets
- Do not embed secrets in the image, do not commit to Git, do not put in environment variables if avoidable (env leaks easily via process dumps).
- Fetch at startup via SDK, cache in memory; **do not call the API on every request** because it costs money and increases latency.
- For rotating secrets, refresh periodically or subscribe to notifications; if cached forever, the old secret will be invalid and cause login failures.
- Prefer the task/pod IAM role to call Secrets Manager, not access keys.

~~~java
SecretsManagerClient sm = SecretsManagerClient.create();
GetSecretValueResponse res = sm.getSecretValue(
    GetSecretValueRequest.builder().secretId("prod/orders/db").build());
String json = res.secretString();   // {"username":"app","password":"..."}
// parse with Jackson, create DataSource, do not log the value
~~~

With Spring Boot you can use {{spring-cloud-aws-secrets-manager-config}} or {{spring.config.import=aws-secretsmanager:prod/orders/db}} (depending on version).

### Production pitfalls
- Cache secret forever then enable rotation: app still uses the old password, RDS rejects it after rotation.
- Log secret during debugging: it ends up in CloudWatch, hard to delete, must rotate immediately.
- Grant {{secretsmanager:*}} to every service: one compromised service exposes everything.
- Use the same KMS key for all environments without limiting the key policy: isolation becomes hard.
- Forget that Parameter Store defaults to roughly 40 TPS for GetParameter (higher throughput has a fee); continuous reads at high traffic get throttled.

> Senior tip: treat secrets as data with a lifecycle: assign an owner, a rotation schedule, an alert before expiration, and a rollback path when rotation fails. Do not turn "fetch at startup" into "cache until restart".`,
    follow: [
      'Why does KMS use envelope encryption instead of encrypting large data directly?',
      'How should a cached secret refresh when rotation is enabled?',
      'Can Parameter Store SecureString replace Secrets Manager?'
    ],
  },
  'aws-014': {
    q: 'AWS cost optimization for a Java system: what are the most effective levers, how do you measure, and what pitfalls cause costs to rise unexpectedly?',
    a: `**Summary:** AWS cost is usually concentrated in compute, database, storage and data transfer. The biggest levers are right-sizing, long-term commitments (Savings Plans/Reserved), Spot for interruptible workloads, Graviton for lower price/better performance, and controlling data transfer + logs.

### Reading the bill correctly
- Enable **Cost Explorer**, split by service, account, tag (team, env, service). Without tagging nobody is responsible for cost.
- Enable **AWS Budgets** with alerts based on real thresholds and forecasts.
- Use the **Cost and Usage Report** (CUR) via Athena when detailed analysis is needed.
- Review **Trusted Advisor** and **Compute Optimizer** regularly.

### Main levers
| Lever | Impact | Note |
|---|---|---|
| Rightsizing | High, no commitment | Measure p95 CPU/memory for 2–4 weeks, do not cut by average |
| Savings Plans / RI | 20–60% for stable compute | 1–3 year commitment; only buy the certain baseline |
| Spot | 60–90% for batch/worker | Can be reclaimed in 2 minutes; need checkpoint |
| Graviton | 20–40% cheaper, good performance | Check native library/agent ARM support |
| S3 lifecycle | High for old data | Move to IA/Glacier, delete incomplete multipart uploads |
| Data transfer | Easy to overlook | Cross-AZ, NAT, Internet egress all cost money |
| Log retention | Medium | Set retention, filter debug logs |
| Database | High | Aurora I/O-Optimized when I/O-heavy; turn off dev environments outside hours |

### Data transfer — hidden cost
- Cross-AZ traffic between app and DB/Redis costs money; place them in the same AZ when possible, but still ensure HA.
- NAT Gateway charges per GB; pulling Docker images through NAT on every deploy is expensive. Use VPC endpoints for ECR/S3.
- Internet egress is charged per GB; use CloudFront to reduce cost and cache.
- Do not forget cross-region replication fees if running DR.

### Java-specific
- JVM often uses more memory than needed; set {{-XX:MaxRAMPercentage=75}} instead of a hard {{-Xmx}} so the container uses the correct limit.
- Choose instance/task size based on real heap + metaspace/thread stack overhead, not by feel.
- Take advantage of Graviton (ARM64) for pure Java code: most libraries run fine; check native agents.
- Build pipeline pulls images repeatedly: use layer cache, ECR pull-through, and run builds in the same region.

### Pitfalls that make cost rise unexpectedly
- Cutting instances too aggressively → app slows, autoscale adds instances, total cost rises and users suffer.
- Buying Reserved/Savings Plans for unstable workloads, then having to change region/instance family.
- Using Spot for stateful workloads without checkpoint: work is lost, rerun costs double.
- Removing NAT to save money but private subnet loses egress, forcing public exposure and reducing security.
- Forgetting dev/staging environments running 24/7 with large instances.

> Senior tip: cost optimization is continuous, not a one-time campaign. Enforce mandatory tagging from the start, set budgets by team, and review the top 5 cost-increasing services every month. A 1-hour monthly review usually saves more than expensive optimization tools.`,
    follow: [
      'Why does rightsizing by average CPU often fail?',
      'When do Savings Plans stop being worth buying?',
      'How do you control cross-service data transfer costs?'
    ],
  },
  'aws-015': {
    q: 'Infrastructure as Code: CloudFormation, CDK or Terraform? How should CI/CD for Spring Boot on AWS be organized?',
    a: `**Summary:** CloudFormation is AWS native IaC; CDK generates CloudFormation from programming languages; Terraform is multi-cloud with its own state. There is no absolute right choice; pick by multi-cloud needs, team skills, and state control requirements. CI/CD should separate infrastructure and application pipelines, use equivalent environments, and deploy gradually.

### Comparison
| Criteria | CloudFormation | CDK | Terraform |
|---|---|---|---|
| Language | YAML/JSON | TypeScript, Java, Python, Go... | HCL |
| State | Managed by AWS | Managed by AWS (generates CFN) | You manage (S3 + lock) |
| Multi-cloud | No | No (CDK for AWS) | Yes |
| Ecosystem | Slower, AWS standard | L2/L3 constructs convenient | Rich providers |
| Drift detection | Yes | Via CFN | Has plan/detect |
| Quick to learn | Medium | Fast if you know TS/Java | Medium |

Choose CloudFormation when the team is AWS-only and wants fewer tools. Choose CDK when the team is strong at code, wants abstraction and testing. Choose Terraform when multi-cloud, or the organization already has Terraform standards.

### IaC principles
- **Everything in code**, including IAM, alarms, dashboards; never click the console for production.
- **State separated by environment** (dev/staging/prod) and by layer (network, data, app) to reduce blast radius.
- **Plan/diff before apply**, review like code review.
- **No hard-coded secrets**; reference Secrets Manager/Parameter Store.
- **Mandatory tags** (team, env, cost-center).
- **Periodic drift detection**; manual changes must be brought back into code or reverted.

### Reference CI/CD
1. PR: build, unit test, static analysis, {{terraform plan}}/{{cdk diff}}, security scan (Checkov/tfsec/trivy).
2. Merge: build image, tag by commit SHA, push to ECR, scan image.
3. Auto deploy to dev; auto deploy to staging after tests; production deploy requires approval.
4. Release strategy: rolling, blue/green (CodeDeploy with ALB), or canary via weighted target group.
5. Rollback must be automatic when alarm exceeds threshold.

~~~yaml
# Simplified GitHub Actions
- run: ./mvnw -B verify
- run: docker build -t $ECR_REPO:$GITHUB_SHA .
- run: docker push $ECR_REPO:$GITHUB_SHA
- run: aws ecs update-service --cluster prod --service orders \
    --task-definition orders:$TASK_REV --force-new-deployment
~~~

### Production pitfalls
- Sharing Terraform state across all environments: one bad plan can affect prod.
- Applying manually from a laptop: no audit, easy to diverge. Run pipeline with short-lived assumed role.
- Pipeline not pinning action/image versions: builds are not reproducible.
- Blue/green but DB migration is not backward-compatible: rolling back the app does not save the schema. Use expand/contract migrations.
- Deploying infrastructure and app simultaneously when they depend on each other: order matters.

> Senior tip: IaC only has value when it is the only way to change infrastructure. If people still click the console for prod, treat it as a process failure. Start small: network + data + one service, then expand.`,
    follow: [
      'Why should Terraform state be separated by environment and layer?',
      'How do you handle DB schema changes with blue/green deployment?',
      'How do you detect and fix drift between code and real infrastructure?'
    ],
  },
  'aws-016': {
    q: 'What are the pillars of the Well-Architected Framework? How do you use it to review architecture instead of answering theory?',
    a: `**Summary:** The Well-Architected Framework has 6 pillars: Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, Sustainability. Real value lies in a review process with concrete questions, identifying risks, assigning owners and tracking actions — not memorizing names.

### Six pillars
- **Operational Excellence**: operate as code, observable, learn from incidents, safe change process.
- **Security**: identity is the main boundary, least privilege, encryption, data protection, detection and response.
- **Reliability**: self-healing, recovery testing, scale with demand, manage change.
- **Performance Efficiency**: choose the right resources, monitor, optimize with data, consider serverless/edge.
- **Cost Optimization**: understand cost, choose the right model, analyze over time, do not optimize blindly.
- **Sustainability**: reduce energy use, choose efficient instances, use managed services, reduce excess data.

### How to run a real review
1. Pick a specific workload (one system, not the whole company).
2. For each pillar, answer questions like: "Can the system survive losing one AZ, has it been tested?", "Who has prod deploy permissions, is MFA enabled?", "Which metric detects failure within 5 minutes?".
3. Record **risk** (high/medium/low) and **owner**, not just "should improve".
4. Prioritize by business impact × likelihood, not by technical "coolness".
5. Put actions in a backlog with deadlines; review again in 1–3 months.
6. Use the **AWS Well-Architected Tool** to record answers, but do not turn it into a formal exam.

### Example pillar questions for a Spring Boot system
| Pillar | Question |
|---|---|
| Reliability | What happens if one AZ is lost for DB/app/LB? Has it been tested? |
| Security | Where are secrets fetched from, who can read them? Any access key in the image? |
| Ops | Does deploy have automatic rollback? Do logs/traces have a trace ID across services? |
| Performance | What is the p99 of the hot endpoint? Any N+1 query? Does cache have a TTL? |
| Cost | Top 3 services by cost? Any environment running 24/7 unnecessarily? |
| Sustainability | Is the instance over-provisioned? Does old data have a lifecycle? |

### Pitfalls when using the framework
- Reviewing as a checkbox exercise: creates no change.
- Only looking at Reliability/Security while ignoring Cost/Ops: architecture looks "beautiful" but is unmanageable.
- Evaluating the whole company instead of a specific workload: conclusions are too general, nobody acts.
- No owner: risk is recorded and then sits there.
- Ignoring people: the framework assumes the team can run the system; for small teams, simpler managed services are better than theoretically optimal architectures.

> Senior tip: use Well-Architected as a negotiation tool with business: each risk comes with remediation cost and the risk of not fixing it. The best review produces a concrete decision, not a long stored document.`,
    follow: [
      'Why should reviews focus on a workload rather than the whole system?',
      'How do you handle high reliability requirements with a limited budget?',
      'How does sustainability actually change architecture decisions?'
    ],
  },
  'aws-017': {
    q: 'You are putting a group of APIs on API Gateway + Lambda. How do timeout, payload and concurrency limits affect design? REST API vs HTTP API, and when should Lambda not be used as a backend?',
    a: `**Summary:** API Gateway + Lambda fits light APIs with variable traffic. Three limits drive design: integration timeout is **29 seconds** by default (HTTP API max 30 seconds), actual payload is **6 MB** because synchronous Lambda invoke accepts/returns 6 MB, and each execution environment handles only one request at a time. HTTP API is cheaper and simpler; REST API has more features (usage plan, WAF, cache, canary, private endpoint).

### Timeout: what happens when you exceed 29 seconds
- API Gateway cuts the connection and returns **504** to the client, but **Lambda continues running** (up to 15 minutes) and continues to be billed. If the function has already charged, the client gets 504, retries, and the transaction runs twice → APIs with side effects must have an idempotency key.
- From 2024, Regional/Private REST APIs can request an integration timeout beyond 29 seconds via Service Quotas, in exchange for potentially lower throttle quota. Edge-optimized and HTTP APIs do not have this option. Check current docs before relying on it.
- Long-running work should still be asynchronous: return **202 + jobId**, process via SQS/Step Functions, then let the client poll or receive a webhook.

~~~java
// Receive request, push to SQS, return 202 immediately: independent of API Gateway timeout
public APIGatewayV2HTTPResponse handleRequest(APIGatewayV2HTTPEvent event, Context ctx) {
    String jobId = UUID.randomUUID().toString();
    sqs.sendMessage(b -> b.queueUrl(queueUrl)
        .messageBody(jobId + "\\n" + event.getBody()));   // worker reads jobId, processes, writes status
    return APIGatewayV2HTTPResponse.builder()
        .withStatusCode(202)
        .withHeaders(Map.of("Location", "/jobs/" + jobId))
        .build();
}
~~~

### Payload
- API Gateway accepts up to 10 MB, but Lambda synchronous invoke limits both request and response to **6 MB**, so 6 MB is the real ceiling when using Lambda proxy.
- Binary goes through base64, increasing size by about 33%. For file upload/download: provide an **S3 presigned URL**, do not send files through Lambda.

### REST API vs HTTP API
| Feature | REST API | HTTP API |
|---|---|---|
| Starting price (us-east-1) | ~3.5 USD/million requests | ~1 USD/million requests |
| Usage plan, API key, per-client throttle | Yes | No |
| Direct WAF attachment | Yes | No (put CloudFront + WAF in front) |
| Response cache, request validation, mapping template | Yes | No |
| Canary at stage | Yes | No |
| Endpoint type | Edge, Regional, Private | Regional |
| Authorizer | IAM, Cognito, Lambda | IAM, JWT built-in, Lambda |
| CORS | Configured manually | Built-in |

WebSocket is a third API type, not covered in this table. Choose HTTP API for simple internal APIs/BFFs with JWT auth; choose REST API for public APIs that need WAF, usage plans for partners, or private APIs called only from VPC.

### When Lambda should not be the backend
1. Synchronous requests that regularly take more than a few seconds, or need long streaming: ECS Fargate behind ALB (idle timeout up to 4000 seconds) is more natural.
2. High, steady traffic all day: paying per GB-second is often more expensive than continuously running containers; calculate with real numbers.
3. Calling RDS: 1,000 concurrent requests = 1,000 execution environments = up to 1,000 connections. Connections are reused across invocations within the same environment, but total connections can explode when scaling → need **RDS Proxy** and a pool size of 1.
4. Heavy Spring Boot with large cold start that cannot use SnapStart/optimization.
5. Needs GPU, or long-running background processes.

### Production pitfalls
- Default API Gateway throttle is 10,000 RPS, burst 5,000, **shared across all APIs in the account/region**; Lambda default concurrency is 1,000/region. One spammed API can take down others → set throttle per stage/route and reserved concurrency.
- Client retries combined with SDK retries when encountering 504 → duplicate requests.
- API Gateway logs and Lambda logs are separate: enable access logs with requestId to connect traces.

> Senior tip: clearly document in ADR which endpoints are allowed to exceed 3 seconds. If the list is non-empty, split them into asynchronous flows from the start; fixing only after clients see 504 requires changing the API contract.`,
    follow: [
      'When a client receives 504 but Lambda has already completed successfully, how do you design idempotency?',
      'Why does Lambda calling RDS need RDS Proxy, and how large should the connection pool in the function be?',
      'When should you put CloudFront in front of HTTP API?'
    ],
  },
  'aws-018': {
    q: 'Account opening process includes eKYC, scoring, manual approval and core banking account creation. Should you use Step Functions or write a Saga in Java, and why?',
    a: `**Summary:** Step Functions is a managed orchestrator: each step's state, retry/backoff, catch, manual-wait (task token) and execution history are built-in, at the cost of AWS lock-in and a 256 KB payload limit. Writing a Saga in Java gives full control but you must build state persistence, retry, timeout, compensation and audit yourself. A long, multi-step process with manual approval like account opening fits **Step Functions Standard** very well.

### What Step Functions does for you
- **Standard workflow**: runs up to 1 year, each step is recorded in execution history (kept 90 days), charged per **state transition**. Fits long business processes that need audit.
- **Express workflow**: up to 5 minutes, charged by request count + run time, history only available if CloudWatch Logs is enabled. Fits high-volume, short event processing.
- **Retry/Catch declared**: retry by error type with backoff, business errors jump to compensation steps.
- **Callback**: a step using {{.waitForTaskToken}} sends a token to an external system and pauses (without consuming compute) until someone calls {{SendTaskSuccess}} or {{SendTaskFailure}}. This is how you implement "manual approval".

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

### Self-written Saga: what you must build
~~~java
// Self-written orchestrator: commit state after EVERY step, do not wrap @Transactional around remote calls
public void advance(UUID sagaId) {
    Saga s = sagas.load(sagaId);
    try {
        if (s.step() == Step.KYC_PASSED) {
            scoring.score(s.customerId(), s.key("score"));   // target API must be idempotent by key
            s = sagas.moveTo(sagaId, Step.SCORED);           // short transaction, only writes local DB
        }
        if (s.step() == Step.APPROVED) {
            coreBanking.openAccount(s.customerId(), s.key("open"));
            sagas.moveTo(sagaId, Step.DONE);
        }
    } catch (BusinessRejectException e) {
        sagas.moveTo(sagaId, Step.COMPENSATING);              // another job runs compensation, also idempotent
    }   // temporary error: do nothing, scheduler calls advance() again later
}
~~~
Beyond the snippet above you also need: a scheduler scanning suspended sagas, per-step timeouts, an audit table, a lookup screen, a manual rerun mechanism. That is exactly what Step Functions provides out of the box.

### Comparison
| Criteria | Step Functions | Self-written Saga |
|---|---|---|
| State storage, history | Built-in | Design your own table + audit |
| Waiting for manual approval for days | Task token, no compute cost | Pending table + scheduler |
| Observability | Console shows each step, input/output | Build your own dashboard |
| Payload per step | Max 256 KB | Depends on DB |
| Testing | State API for each state, integration on sandbox account | Pure Java unit tests |
| Lock-in, on-prem | AWS only | Portable |

### Production pitfalls
- Payload exceeds 256 KB (ID photo, OCR result) causing execution failure: store in S3, pass only the key.
- Standard limit of 25,000 events in history: loops or large Maps must use Distributed Map or child executions.
- Step Functions retry does not make your step idempotent: the Lambda/target API must still prevent duplicates.
- Name executions after the case code to avoid accidentally restarting the same process.
- Do not embed complex business logic inside ASL (deeply nested Choice): ASL is the orchestration framework, logic stays in code.

> Senior tip: in banking, the strongest reason to choose Step Functions is often audit: auditors ask "who approved this case, when, what was the input" and execution history answers immediately. But history is only kept 90 days, so important events must still be pushed to a separate audit store with the retention period required by regulation.`,
    follow: [
      'Standard or Express for account opening, and for processing 5,000 events/second?',
      'A manual approval step waits 3 days then times out: how do you design timeout and compensation?',
      'When is choreography via Kafka more appropriate than orchestration?'
    ],
  },
  'aws-019': {
    q: 'After Aurora PostgreSQL failover (~30 s), the Spring Boot service still fails to write for several minutes. Why, and how do you configure JVM, connection pool, and driver to recover quickly?',
    a: `**Summary:** Aurora failover updates the cluster endpoint CNAME to point to the new writer, but the Java app may still hold the old IP (JVM DNS cache) and connections to the old instance (now a reader), so INSERT fails with "cannot execute INSERT in a read-only transaction". Fix: short JVM DNS TTL, pool knows how to discard broken connections, and ideally use the **AWS Advanced JDBC Wrapper** with the failover plugin to reconnect to the new writer based on topology instead of waiting for DNS; the application must retry transactions.

### What happens during failover
~~~text
t=0     writer A dies / is failed over
t=~5s   Aurora promotes replica B to writer
t=~30s  cluster endpoint (CNAME, TTL 5s) points to B; A restarts as reader
App:    pool still holds 20 connections to A
        JVM still caches A's IP -> new connections also go to A
        INSERT -> ERROR: cannot execute INSERT in a read-only transaction
~~~
Three layers cause delay: **JVM DNS cache**, **old connections in pool**, and **stalled TCP** when the old instance dies but does not send RST (waiting for OS-level TCP timeout).

### Layer 1: JVM DNS cache
- Property {{networkaddress.cache.ttl}}: if SecurityManager exists, defaults to cache forever; otherwise defaults to about 30 seconds (implementation-dependent). AWS recommends setting it to no more than 60 seconds.
- Set early at startup, before the first resolve: {{Security.setProperty("networkaddress.cache.ttl", "5")}}, or edit java.security in the image.

### Layer 2: connection pool
- HikariCP does not know that a connection points to a reader. Set {{max-lifetime}} to a few minutes so connections are refreshed periodically, and {{connection-timeout}} short to fail fast.
- Set driver socket timeout (PostgreSQL: {{socketTimeout}}) so queries do not hang forever on dead TCP.

### Layer 3: AWS Advanced JDBC Wrapper
The wrapper wraps the native PostgreSQL/MySQL driver and adds plugins:
- **failover**: reads cluster topology from the DB itself; when the writer is lost, connects directly to the new writer without relying on DNS. After switching, it throws {{FailoverSuccessSQLException}} to signal that the current transaction was lost and the application must rerun.
- **efm** (Enhanced Failure Monitoring): monitors instance health in a separate thread, detecting failure faster than TCP timeout.
- There is also an IAM authentication plugin, Secrets Manager plugin, and read/write splitting plugin. New versions have failover2/efm2; default plugin names change by version, so check current documentation.

~~~yaml
spring:
  datasource:
    url: jdbc:aws-wrapper:postgresql://core.cluster-xxxx.ap-southeast-1.rds.amazonaws.com:5432/core
    driver-class-name: software.amazon.jdbc.Driver
    hikari:
      maximum-pool-size: 20
      max-lifetime: 300000          # 5 minutes
      connection-timeout: 3000      # fail fast instead of hanging threads
      # so Hikari does not treat failover errors as a mass connection failure (per wrapper guidance)
      exception-override-class-name: software.amazon.jdbc.util.HikariCPSQLException
      data-source-properties:
        wrapperPlugins: failover,efm
        wrapperDialect: aurora-pg
~~~

### The application must still retry
- Failover always loses the in-progress transaction. Wrap service methods with 1–2 retries for failover errors, **only when operations are idempotent** or the entire transaction is rerun from scratch.
- Errors during commit may leave state unclear (wrapper has {{TransactionStateUnknownSQLException}}): verify again with an idempotency key before rerunning, especially for financial transactions.

### Alternative: RDS Proxy
RDS Proxy keeps connections on the client side and automatically reconnects to the new writer, reducing failover time without changing drivers. Trade-off: extra cost, extra hop, and pinning reduces multiplexing effectiveness when using prepared statements/session state.

### Production pitfalls
- Only testing failover on paper. Actually run {{aws rds failover-db-cluster}} on staging under load and measure the time writes fail.
- Using a hard instance endpoint instead of the cluster endpoint.
- Infinite retries with small backoff during failover: creates a connection storm to the new writer.

> Senior tip: the measurable target should be "time with no writes possible" from the application's perspective, not the console failover time. With default settings this is often several minutes; after tuning DNS TTL, pool, and wrapper, many teams bring it below one minute. Practice quarterly and record numbers in the runbook.`,
    follow: [
      'A FailoverSuccessSQLException occurs in the middle of a money transfer transaction: how do you prevent charging twice?',
      'What is the pitfall with Aurora reader endpoint and replica lag for read/write splitting?',
      'When should you choose RDS Proxy instead of the AWS Advanced JDBC Wrapper?'
    ],
  },
  'aws-020': {
    q: 'The public API of a digital wallet is being scanned by bots trying passwords and occasionally hit by DDoS. How do you design the edge layer with CloudFront, AWS WAF and Shield, and what should be cached?',
    a: `**Summary:** Place **CloudFront** in front of ALB/API Gateway to terminate TLS at the edge, absorb network-layer attacks and cache public content; attach **AWS WAF** with managed rules, rate-based rules and Bot Control/ATP for login endpoints; **Shield Standard** is free and protects against L3/L4 DDoS, **Shield Advanced** is for teams needing a DDoS response team and cost protection. Equally important: lock the origin so it only accepts traffic from CloudFront.

### Why the edge
The closer an attack is blocked to the user, the cheaper: SYN flood and UDP reflection are absorbed by AWS edge infrastructure; bad L7 requests are blocked by WAF before creating connections to ALB, not consuming Java service CPU, and not triggering useless autoscaling.

~~~text
Client -> CloudFront (TLS, cache, WAF, Shield) -> ALB (only accepts from CloudFront) -> ECS
~~~

### CloudFront: what to cache
- **Should cache**: static assets, public configurations, province/bank lists, published exchange rates (TTL 10–60 seconds). Cache key should only include queries/headers that actually change content; extra cache keys drive hit rate to zero.
- **Should not cache**: personalized responses (balance, transaction history), anything that depends on a token. Use a CachingDisabled policy for these paths.
- Default origin response timeout is 30 seconds; endpoints that take longer should change the design, not just increase timeout.

### Locking the origin
- ALB security group should only allow the managed prefix list {{com.amazonaws.global.cloudfront.origin-facing}}.
- Add a secret custom header from CloudFront and an ALB rule that rejects requests missing it (because the prefix list applies to all CloudFront customers, not just you).
- Or use CloudFront VPC origin so the ALB stays fully in a private subnet.

### AWS WAF: rule layers
| Layer | Rule | Purpose |
|---|---|---|
| Reputation | Amazon IP reputation, Anonymous IP list | Block botnet, anonymous proxies |
| Vulnerability | Core rule set, Known bad inputs, SQL database | SQLi, XSS, Log4Shell payloads |
| Rate | Rate-based per IP or custom key | Prevent flood, password guessing |
| Bot | Bot Control, Challenge/CAPTCHA | Distinguish bots from real browsers |
| Fraud | Account Takeover Prevention (ATP) | Detect credential stuffing at login |

- Web ACL for CloudFront must be created in CloudFront scope (region us-east-1).
- Bot Control and ATP have extra fees per request: apply only to paths that need them (e.g. /login, /otp) using scope-down statements.
- A new rule should always run in **Count** mode for a few days, review logs, then switch to Block.

### Shield
- **Standard**: free, automatic, protects L3/L4.
- **Advanced**: fixed monthly fee (around 3,000 USD/month for the whole organization, 1-year commitment, check current docs), provides Shield Response Team, automatic L7 DDoS mitigation via WAF, and cost protection when DDoS drives scaling. Fits banks/wallets with SLAs and reputation risk.

### Production pitfalls
- Rate limit by IP in Vietnam: mobile carriers use CGNAT, so thousands of real users share one IP. Too strict a limit blocks real customers; combine with device/header keys and separate thresholds for /login.
- The app reads the wrong client IP: behind CloudFront + ALB you must read from X-Forwarded-For (Spring: {{server.forward-headers-strategy}}) or {{CloudFront-Viewer-Address}} header, otherwise logs and rate limits in the app see the proxy IP.
- Blocking by country can prevent traveling customers from logging in.

> Senior tip: measure effectiveness with WAF logs in Athena: blocked request ratio by rule, top IP/ASN, false positives reported by CS. A real credential stuffing campaign often uses tens of thousands of IPs, each making only a few requests; a rate-based rule by IP is almost useless, so you must rely on Bot Control/ATP and device signals.`,
    follow: [
      'How do you prevent accidentally caching one user\'s personalized data for another user?',
      'Credential stuffing uses 50,000 different IPs: is rate-based rule enough?',
      'When is Shield Advanced cost justified?'
    ],
  }
});
