/*
 * English translation of js/data/q-aws.js — task T793. Format: js/core/i18n.js (content overlay).
 * ids: aws-041 aws-042 aws-043 aws-044 aws-045 aws-046
 */
App.i18n.content({
  'aws-041': {
    q: 'What is the essential difference between EKS and ECS (Fargate)? When do you choose EKS, and when is ECS Fargate enough?',
    a: `**Summary:** ECS Fargate is AWS's managed container service — simple, enough for most services. EKS is managed Kubernetes, powerful when the company already runs a K8s platform or needs the K8s ecosystem (CRD, operators, service mesh). The price of EKS is complexity and people cost.

### Quick Picture
Imagine shipping goods. **ECS Fargate** is like an all-inclusive delivery service: you pack the box (Docker image), fill in the address, and AWS handles the truck, driver and maintenance. **EKS** is like hiring a whole transport fleet to an international standard (Kubernetes): very powerful when you have many warehouses, routes and teams coordinating, but you need someone to manage the fleet, maintain the trucks and handle incidents. If the company has only a few services and no one on platform duty, EKS is a "fleet" far bigger than the need.

### Terminology
- **Control plane**: the "brain" of Kubernetes (API server, scheduler, etcd); on EKS operated by AWS, billed per hour.
- **Data plane**: the nodes that actually run pods (your EC2 or Fargate).
- **Pod**: the smallest unit running containers in Kubernetes; one pod can hold multiple containers.
- **Deployment / ReplicaSet**: Kubernetes objects declaring how many pod replicas and how to update them.
- **Service / Ingress**: Kubernetes objects exposing pods to the network; Ingress usually points at an ALB or NGINX.
- **HPA (Horizontal Pod Autoscaler)**: scales pod count up/down based on CPU or custom metrics.
- **CRD (Custom Resource Definition)**: how to extend Kubernetes with new resource types.
- **Operator**: a controller that automates operating a specific piece of software (Kafka, Postgres) on K8s.
- **Service mesh**: a layer managing traffic between services (Istio, Linkerd) running on K8s.

### Essential Comparison
| Criterion | ECS Fargate | EKS |
|---|---|---|
| Management API | AWS API (task definition, service) | Kubernetes API (Deployment, Service, Ingress) |
| Run unit | Task (1 or more containers) | Pod |
| Auto-scale | Application Auto Scaling by CPU/memory/request | HPA by metric, Cluster Autoscaler/Karpenter for nodes |
| Networking | awsvpc: each task gets its own ENI | CNI (VPC CNI): pod has an IP in the VPC |
| IAM for pods | Task role (simple) | IRSA or EKS Pod Identity (more complex) |
| People cost | Low | High (someone must run the cluster) |
| Ecosystem | Limited to AWS | Huge (Helm, CRD, operator, mesh) |

### When to Choose ECS Fargate
- Small team (5-20 people), no one on platform duty.
- Services are mostly HTTP APIs (Spring Boot) running 24/7.
- Simple deploys, few moving parts.
- No need for CRD, operators or service mesh.

### When to Choose EKS
- The company already has a Kubernetes platform shared by many teams.
- You need the K8s ecosystem: operators for Kafka/Postgres, service mesh, policy-as-code (OPA/Gatekeeper).
- Many services, need to standardise deploy and observability across teams.
- Someone is on cluster duty (SRE/platform engineer).

### Common Mistakes
- **Choosing EKS because "big companies all use it."** Symptom: a 5-person team spends half its time upgrading the cluster, fixing add-ons and ingress. Avoidance: choose EKS only when there is someone on platform duty and a real need.
- **Using EKS without standardising deploys.** Symptom: every service has its own YAML flavour, configs drift, hard to upgrade. Avoidance: Helm/Kustomize with a shared template and policy-as-code.
- **Confusing task role and node role on EKS.** Symptom: the pod runs but code calling AWS gets AccessDenied. Avoidance: use IRSA/Pod Identity, do not let the pod inherit the node's permissions.

### 1-Minute Verbal Answer
"ECS Fargate is AWS's managed container service: I package the image, declare the task definition, AWS handles running it, no nodes to patch. EKS is managed Kubernetes, strong when the company already has a K8s platform, many teams, needs CRD/operators/service mesh. The price of EKS is complexity and people cost. For a Java team of 5-20 with normal HTTP services, my default is ECS Fargate; I only move to EKS when there is someone on cluster duty and a real need."

> Senior tip: the hidden cost of Kubernetes is people, not the AWS bill. Without someone on cluster duty, EKS eats the whole dev team's time.`,
    follow: [
      'How is Karpenter different from Cluster Autoscaler on EKS?',
      'How do IRSA and EKS Pod Identity differ?',
      'How would you migrate from ECS to EKS with no downtime?'
    ],
  },
  'aws-042': {
    q: 'IRSA and EKS Pod Identity: how to attach an IAM role to a pod without access keys — mechanisms and differences?',
    a: `**Summary:** IRSA uses an OIDC provider so a pod assumes a role via its ServiceAccount token; EKS Pod Identity uses an agent on the node. Both hand temporary credentials to the SDK, no access keys in code.

### Quick Picture
**IRSA** is like having a student ID issued by the school (Kubernetes ServiceAccount token) that AWS trusts as ID and therefore issues a guest badge (temporary credential). **EKS Pod Identity** is like AWS placing a receptionist right in the building (an agent on the node): the pod just says "I am service X", the receptionist checks and hands out the badge. Both avoid hard-coding access keys.

### Terminology
- **ServiceAccount**: a pod's identity inside Kubernetes.
- **OIDC provider**: IAM configuration trusting tokens signed by the EKS cluster.
- **Web identity token**: a short-lived JWT tied to a ServiceAccount, mounted into the pod.
- **STS AssumeRoleWithWebIdentity**: the STS API that issues temporary credentials from a JWT.
- **EKS Pod Identity agent**: a DaemonSet running on the node that provides credentials to pods.
- **Credential provider chain**: the order in which the AWS SDK looks for credentials.

### IRSA Mechanism
1. Create an IAM role whose trust policy trusts the cluster's OIDC provider and a specific ServiceAccount.
2. Create a ServiceAccount annotated with {{eks.amazonaws.com/role-arn}}.
3. A pod using that ServiceAccount receives a projected volume containing the JWT.
4. The SDK reads env {{AWS_ROLE_ARN}} and {{AWS_WEB_IDENTITY_TOKEN_FILE}}, calls {{AssumeRoleWithWebIdentity}}.
5. STS returns temporary credentials; the SDK refreshes them before expiry.

### EKS Pod Identity Mechanism
1. Install the EKS Pod Identity agent (add-on) on the cluster.
2. Create an association between a ServiceAccount and an IAM role via the EKS API.
3. The agent on the node provides a credential endpoint to the pod (similar to ECS).
4. The SDK follows the container credential provider, calls the agent, receives temporary credentials.

### Comparison
| Criterion | IRSA | EKS Pod Identity |
|---|---|---|
| Needs OIDC provider | Yes | No |
| Trust policy per cluster | Must include OIDC URL | Simpler, per account/cluster |
| Cross-account | Complex | Easier |
| Setup | ServiceAccount annotation | Association via EKS API |
| Recommendation for new clusters | Legacy | Preferred |

### Common Mistakes
- **Wrong ServiceAccount annotation.** Symptom: the pod cannot assume the role, SDK falls back to the node role. Avoidance: verify the ServiceAccount name/namespace matches the association.
- **Overly broad trust policy.** Symptom: any ServiceAccount can assume the role. Avoidance: restrict the {{sub}} condition to the specific ServiceAccount.
- **Forgetting to install the Pod Identity agent.** Symptom: SDK cannot find the credential endpoint. Avoidance: install the add-on before using it.

### 1-Minute Verbal Answer
"IRSA uses an OIDC provider so a pod assumes a role via the ServiceAccount's JWT; EKS Pod Identity uses an agent on the node plus an association via the EKS API. Both hand temporary credentials to the SDK, no access keys. IRSA is the older way needing an OIDC provider and a trust policy per cluster; Pod Identity is simpler and recommended for new clusters. I pick Pod Identity for new clusters, IRSA for older clusters that already have OIDC set up."

> Senior tip: never let a pod inherit the node's permissions. Always attach a dedicated role per workload via IRSA or Pod Identity, and review the trust policy like code.`,
    follow: [
      'Why should a pod not use the node role?',
      'What condition must an IRSA trust policy have to be safe?',
      'Does Pod Identity support cross-account?'
    ],
  },
  'aws-043': {
    q: 'IAM policy evaluation: how do you debug AccessDenied? How do explicit deny, SCP and permission boundary interact?',
    a: `**Summary:** IAM evaluates in this order: explicit Deny wins everything; then a matching Allow is needed and must not be blocked by SCP or permission boundary; otherwise implicit deny. Debug with the IAM Policy Simulator, the CloudTrail event, and checks of trust policy, SCP and boundary.

### Quick Picture
Imagine a high-end building. **Explicit deny** is like a blacklist at the gate: even with a VIP card, if your name is on the blacklist you cannot enter. **SCP (Service Control Policy)** is like corporate rules: even if the department allows it, if the corporation forbids it, you cannot do it. **Permission boundary** is like the department's ceiling: the department cannot grant permissions above the ceiling even if it wants to. When denied, check each layer: blacklist -> corporate rules -> department ceiling -> personal card.

### Terminology
- **Identity policy**: policy attached to a user/role.
- **Resource policy**: policy attached to a resource (S3 bucket policy, SQS queue policy).
- **SCP**: policy at Organization/OU/account level, capping maximum permissions.
- **Permission boundary**: policy capping the maximum permissions a principal can be granted.
- **Explicit deny**: a statement with Effect=Deny that matches the request.
- **Implicit deny**: no matching Allow.
- **IAM Policy Simulator**: tool to test policies without real calls.
- **CloudTrail**: log of every API call.

### Evaluation Mechanism
1. Is there any explicit Deny matching (identity, resource, SCP, boundary)? -> DENY.
2. Is there any Allow matching in the identity policy or resource policy? If not -> implicit deny.
3. Is that Allow blocked by an SCP? If the SCP does not Allow -> DENY.
4. Is that Allow blocked by a permission boundary? If the boundary does not Allow -> DENY.
5. If it passes all -> ALLOW.

Note: SCP and boundary only **limit** (filter); they do not grant permissions. Actual permissions must come from identity/resource policy.

### Step-by-step AccessDenied Debug
1. Read the CloudTrail event: {{errorCode}}, {{errorMessage}}, {{userIdentity}}, {{requestParameters}}.
2. Identify the real principal (assumed role, not the original user).
3. Check the role's identity policy: is there an Allow for action+resource matching?
4. Check the resource policy (if any): does the S3 bucket policy deny cross-account?
5. Check the SCP at account/OU: is there a Deny on the action?
6. Check the role's permission boundary: is there an Allow for the action?
7. Check conditions: VPC endpoint, MFA, source IP, tags...
8. Use the IAM Policy Simulator to test the policy combination.

### Common Mistakes
- **Forgetting an SCP blocks it.** Symptom: identity policy Allows but still AccessDenied; CloudTrail does not say why. Avoidance: check SCPs at account and OU; use Policy Simulator with SCPs.
- **Permission boundary missing an action.** Symptom: admin grants a new permission but it is ineffective because the boundary lacks it. Avoidance: the boundary must include every action the principal needs.
- **Wrong condition.** Symptom: policy is right on action/resource but condition {{aws:SourceVpce}} does not match because the request went through NAT. Avoidance: check the condition using CloudTrail {{requestParameters}} and {{sourceIPAddress}}.
- **Wrong principal.** Symptom: debugging role A while the request actually came from role B (assumed). Avoidance: read {{userIdentity.arn}} in CloudTrail.

### 1-Minute Verbal Answer
"IAM evaluates in order: explicit Deny wins everything; then a matching Allow is needed that is not blocked by SCP or permission boundary; otherwise implicit deny. SCP and boundary only limit, they do not grant. On AccessDenied I read CloudTrail to get the real principal and action, then check identity policy, resource policy, SCP, boundary and conditions in order. I use the IAM Policy Simulator to test combinations and always remember the real principal may be an assumed role, not the original user."

> Senior tip: 80% of AccessDenied cases come from conditions (VPC endpoint, source IP) or SCP, not from the identity policy. Always read CloudTrail before editing a policy.`,
    follow: [
      'How does an SCP differ from a permission boundary?',
      'How do you test a policy without real calls?',
      'How do resource policy and identity policy apply together?'
    ],
  },
  'aws-044': {
    q: 'NAT Gateway and data transfer cost: why is NAT expensive, and how do you reduce it with VPC endpoints and architecture?',
    a: `**Summary:** NAT Gateway charges per hour and per GB processed; large traffic through NAT (ECR images, logs, S3) makes the bill explode. VPC endpoints (gateway for S3/DynamoDB, interface for SQS/KMS/ECR/CloudWatch) keep AWS traffic off NAT. Architecture: endpoints for AWS services, NAT only for real Internet traffic.

### Quick Picture
NAT Gateway is like a toll booth on the highway: every GB passing through is charged, even if you are only going from your house to a neighbour in the same city. If you continuously haul container images and logs through the toll booth, the bill becomes huge. **VPC endpoint** is like an internal road leading straight to the "AWS supermarket" without passing the toll booth. So the rule is: traffic to AWS services must go the internal road; NAT is only for real Internet traffic (calling third-party APIs).

### Terminology
- **NAT Gateway**: managed NAT, billed per hour + per GB processed, HA within one AZ.
- **Data transfer cost**: charge for moving data between AZs, regions and the Internet.
- **Gateway endpoint**: free endpoint for S3 and DynamoDB, attached to a route table.
- **Interface endpoint (PrivateLink)**: endpoint creating an ENI in a subnet, billed per hour + per GB.
- **Private DNS**: endpoint auto-resolves the standard AWS service domain name.
- **Cross-AZ data transfer**: charge when traffic moves between AZs.
- **VPC Flow Logs**: logs of VPC traffic for analysis.

### Cost Mechanism
1. NAT Gateway: ~0.045 USD/hour (~32 USD/month) + ~0.045 USD/GB processed.
2. Interface endpoint: ~0.01 USD/hour/AZ + ~0.01 USD/GB.
3. Gateway endpoint (S3, DynamoDB): free (only the service's storage/request charges apply).
4. Cross-AZ: ~0.01 USD/GB each way.

Example: pulling 50 GB of Docker images per month through NAT -> 50 x 0.045 = 2.25 USD/month just for images; plus logs, S3, SQS... can reach hundreds of USD.

### Cost-Reduction Architecture
1. **Gateway endpoint for S3 and DynamoDB** — always on, free.
2. **Interface endpoint for ECR (api + dkr)** — pull images without NAT; remember the S3 gateway endpoint because image layers live on S3.
3. **Interface endpoint for CloudWatch Logs, Secrets Manager, KMS, SQS, SNS** — management traffic stays off the Internet.
4. **NAT only for real Internet traffic**: calling third-party APIs, downloading packages from the Internet.
5. **One NAT per AZ** to avoid cross-AZ data charges and single point of failure.
6. **Enable private DNS** for interface endpoints so the SDK uses standard domain names.

### Common Mistakes
- **Pulling images and pushing logs through NAT.** Symptom: NAT cost spikes on every deploy. Avoidance: endpoints for ECR (api + dkr + S3 gateway) and CloudWatch Logs.
- **One shared NAT across AZs.** Symptom: cross-AZ charges plus single point of failure. Avoidance: one NAT per AZ.
- **Forgetting the S3 gateway endpoint with ECR endpoint.** Symptom: image layers still go through NAT. Avoidance: always have the S3 gateway endpoint.
- **Not enabling private DNS.** Symptom: the SDK still resolves domain names to the Internet. Avoidance: enable private DNS on interface endpoints.

### 1-Minute Verbal Answer
"NAT Gateway charges per hour and per GB processed, so large traffic through NAT (images, logs, S3) makes the bill explode. I reduce it with VPC endpoints: free gateway endpoint for S3 and DynamoDB, interface endpoints for ECR, CloudWatch Logs, Secrets Manager, KMS, SQS. NAT is reserved for real Internet traffic. Architecture: one NAT per AZ for HA, endpoints for every AWS service, private DNS enabled. I turn on VPC Flow Logs to detect unusual traffic going through NAT."

> Senior tip: draw the route table before the diagram. Most 'high NAT cost' incidents are caused by missing endpoints. Send VPC Flow Logs to S3/CloudWatch to analyse traffic by destination.`,
    follow: [
      'Why is the S3 gateway endpoint free but the ECR interface endpoint charged?',
      'How do you detect traffic going through NAT unnecessarily?',
      'How does cross-AZ data transfer affect cost?'
    ],
  },
  'aws-045': {
    q: '(Lead) AWS cost optimization for a Java system: Savings Plans, Graviton, Spot for workers, right-sizing — strategy and priority order?',
    a: `**Summary:** Optimize AWS cost in this order: right-sizing (measure and cut excess) -> Graviton (ARM, cheaper and faster for Java) -> Savings Plans/Reserved Instances for the baseline -> Spot for workers/batch -> architecture (serverless, caching, endpoints). Measure before each step.

### Quick Picture
Cost optimization is like losing weight: do not buy diet pills (Savings Plans) before knowing where you overeat (right-sizing). First **measure and cut excess** (right-sizing): many systems run instances bigger than needed. Then **switch to Graviton** (AWS's ARM chip), usually 20% cheaper and faster for Java. Next **commit the baseline** with Savings Plans for the discount. Finally **Spot** for workloads that tolerate interruption (workers, batch). Architecture (caching, serverless) is the last step.

### Terminology
- **Right-sizing**: adjusting instance/container size to actual need.
- **Graviton**: ARM chip designed by AWS (Graviton2/3/4), cheaper and better performance/Watt than x86 for many workloads.
- **Savings Plans**: hourly spend commitment (1 or 3 years) for a discount, more flexible than Reserved Instances.
- **Reserved Instances (RI)**: commitment to specific instances for a discount.
- **Spot Instances**: use AWS's spare capacity at deep discounts, can be reclaimed with 2 minutes' warning.
- **Compute Savings Plans**: apply to EC2, Fargate, Lambda regardless of instance family/region.
- **EC2 Instance Savings Plans**: apply to a specific instance family in a region, deeper discount.
- **Cost Explorer / Compute Optimizer**: AWS tools analysing cost and suggesting right-sizing.

### Priority Order
1. **Right-sizing** (week 1-2): use Compute Optimizer and CloudWatch to find oversized instances/containers. Cut CPU/memory to actual need + 20-30% buffer. Cheapest and safest step.
2. **Graviton** (week 2-4): migrate Java workloads to Graviton (m5 -> m7g, c6i -> c7g). Java runs well on ARM from JDK 17; Spring Boot and Hibernate need no changes. Usually cuts ~20% cost and raises throughput.
3. **Savings Plans** (month 1): commit the baseline (the stable 24/7 workload) with 1-year Compute Savings Plans. ~30-40% off on-demand. Do not commit the variable part.
4. **Spot** (month 2): use Spot for workers, batch, CI runners, dev/staging. Must handle interruption (checkpoint, graceful shutdown). Can cut 60-90%.
5. **Architecture** (ongoing): caching (ElastiCache), serverless for spiky workloads, VPC endpoints to reduce NAT, S3 lifecycle.

### Java on Graviton
- JDK 17+ supports ARM64 well; the JVM detects the architecture automatically.
- Docker images must be built multi-arch (linux/arm64) or use existing ones.
- Some native libraries (JNI) need rebuilding for ARM.
- Benchmark before migrating production; Graviton usually gives higher throughput at the same price.

### Spot for Java Workers
- Worker processing jobs from SQS/Kafka: if reclaimed, the message returns to the queue (visibility timeout) -> another worker processes it. Safe if idempotent.
- Need graceful shutdown: receive SIGTERM, stop taking new jobs, finish the current job within 2 minutes.
- Use Spot Fleet / Auto Scaling Group with mixed instances and on-demand fallback.
- Do not use Spot for API serving (latency-sensitive) or stateful workloads.

### Common Mistakes
- **Buying Savings Plans before right-sizing.** Symptom: committing spend for oversized instances, waste. Avoidance: right-size first, commit after.
- **Migrating to Graviton without testing native libraries.** Symptom: app crashes because a JNI library is x86-only. Avoidance: check dependencies, build multi-arch, test in staging.
- **Using Spot for API serving.** Symptom: requests dropped when Spot is reclaimed. Avoidance: Spot only for workers/batch/dev.
- **Not handling Spot interruption.** Symptom: jobs lost mid-flight, inconsistent data. Avoidance: checkpoint + graceful shutdown + idempotent processing.

### 1-Minute Verbal Answer
"I optimize cost in this order: right-sizing first (measure and cut excess), then Graviton (ARM, usually 20% cheaper and faster for Java), then Savings Plans for the stable baseline, Spot for workers and batch, finally architecture like caching and serverless. The key is to measure before acting: use Compute Optimizer and CloudWatch. Java runs well on Graviton from JDK 17, you only need multi-arch images. Spot is only for workloads that tolerate interruption and must handle interruption gracefully."

> Senior tip: do not buy Savings Plans before right-sizing. Many systems run instances twice as big as needed; cutting first can reduce 30-50% without committing anything.`,
    follow: [
      'How do Compute Savings Plans differ from EC2 Instance Savings Plans?',
      'How do you handle Spot interruption in a Java worker?',
      "What are Graviton's drawbacks versus x86 for Java?"
    ],
  },
  'aws-046': {
    q: '(Lead) Secrets and rotation: Secrets Manager vs Parameter Store, how does Spring Boot read secrets and rotate without downtime?',
    a: `**Summary:** Secrets Manager has automatic rotation and good audit but is expensive; Parameter Store is cheaper, fits non-sensitive config. Spring Boot reads via AWS SDK or Spring Cloud AWS. Zero-downtime rotation needs the app to support secret reload (refresh scope) plus a dual-credential window.

### Quick Picture
**Secrets Manager** is like a safe with a manager: it auto-rotates passwords on a schedule, logs who opened it, but renting the safe is expensive. **Parameter Store** is like an office drawer: cheap, lockable, but you rotate passwords yourself and there is no detailed log. For important secrets (DB password, API key), use Secrets Manager for automatic rotation. For config (feature flags, URLs), use Parameter Store Standard (free) or Advanced.

### Terminology
- **Secret**: a sensitive value (password, token, key).
- **Parameter**: a config value (may be encrypted).
- **Rotation**: automatically changing a secret on a schedule.
- **Lambda rotation function**: the Lambda function Secrets Manager calls to rotate the secret.
- **Dual credential**: keeping both old and new secrets valid during the transition.
- **Spring Cloud AWS**: library integrating AWS into Spring Boot.
- **@RefreshScope**: Spring annotation allowing a bean to reload when config changes.
- **Secrets Manager caching client**: client that caches the secret to reduce API calls and cost.

### Comparison
| Criterion | Secrets Manager | Parameter Store |
|---|---|---|
| Price | ~0.40 USD/secret/month + API calls | Standard free; Advanced ~0.05 USD/parameter/month |
| Automatic rotation | Yes (Lambda) | No (you write it) |
| Audit (CloudTrail) | Detailed | Basic |
| Size | Up to 64 KB | Standard 4 KB, Advanced 8 KB |
| Cross-account | Easy (resource policy) | Limited |
| Fits | Important secrets needing rotation | Config, feature flags, rarely-changing secrets |

### Spring Boot Reading Secrets
Approach 1: AWS SDK directly in @PostConstruct or @ConfigurationProperties, using the Secrets Manager caching client to cache and auto-refresh.

Approach 2: Spring Cloud AWS: add the dependency, configure {{spring.config.import=aws-secretsmanager:/secret/name}}, Spring injects into the Environment.

Approach 3: mount the secret into env vars via ECS/Lambda (less flexible, no runtime reload).

### Zero-Downtime Rotation
1. A secret has two versions: AWSCURRENT and AWSPREVIOUS.
2. The rotation function creates the new secret, updates the DB (changes the password), then promotes the new version.
3. The app must support reload: use @RefreshScope + polling or event, or a rolling restart.
4. During the transition, both old and new credentials stay valid (dual credential) thanks to the DB supporting multiple passwords or a grace period.
5. The Secrets Manager caching client auto-refreshes when it detects a new version.

### Common Mistakes
- **App caches the secret forever, never reloads.** Symptom: after rotation the app still uses the old secret, connection fails. Avoidance: use the caching client with a TTL, or @RefreshScope + actuator refresh endpoint.
- **Rotation function is not idempotent.** Symptom: running twice causes errors or mismatched secrets. Avoidance: design idempotently, check the version before changing.
- **Using Parameter Store for a secret needing rotation.** Symptom: you must write rotation yourself, error-prone. Avoidance: important secrets use Secrets Manager.
- **Secret in a task definition env var.** Symptom: secret ends up in CloudFormation/IaC, exposed. Avoidance: use secret references (ECS secret injection from Secrets Manager/Parameter Store), never plaintext.

### 1-Minute Verbal Answer
"Secrets Manager has automatic rotation and good audit but is expensive; Parameter Store is cheaper and fits config. Spring Boot reads via the AWS SDK caching client or Spring Cloud AWS. Zero-downtime rotation needs the app to support secret reload (@RefreshScope or a caching client with TTL) and a dual-credential window during the transition. Important secrets (DB password) use Secrets Manager; config/feature flags use Parameter Store Standard."

> Senior tip: never store a secret in a plaintext env var in a task definition. Use secret references so ECS/Lambda injects from Secrets Manager/Parameter Store, and the secret never appears in IaC or the console.`,
    follow: [
      'How does the Secrets Manager rotation Lambda work step by step?',
      'How can a Java app reload a secret without restart?',
      'When do you use Parameter Store Advanced instead of Secrets Manager?'
    ],
  }
});
