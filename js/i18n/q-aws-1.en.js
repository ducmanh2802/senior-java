/*
 * English translation of js/data/q-aws.js — task T510 (re-translated after the Vietnamese rewrite).
 * Format: js/core/i18n.js (content overlay).
 * ids: aws-001 aws-002 aws-003 aws-004 aws-005 aws-006 aws-007 aws-008 aws-009 aws-010 aws-011
 */
App.i18n.content({

  'aws-001': {
    q: `Deploying a Spring Boot service to AWS: when do you choose EC2, ECS Fargate, EKS, or Lambda? Which criteria really decide?`,
    a: `**Summary:** choose by how much infrastructure control you need and by operating model: EC2 when you need full control of the OS; ECS Fargate when you want to run containers without managing servers; EKS when the team is already standardized on Kubernetes or needs the K8s ecosystem; Lambda when the workload is short, event-driven, and can tolerate cold start.

### Quick intuition
Imagine you need a place to open a restaurant. **EC2** is like renting an empty storefront: you buy the kitchen, fix the plumbing yourself, you can do anything, but every breakdown is your problem. **ECS Fargate** is like renting a stall in a food court: you only bring your "box" (Docker image), and the management handles power, water and security. **EKS** is like running an entire international-standard food court yourself (Kubernetes): very powerful when there are many stalls and many teams, but it needs a dedicated platform person. **Lambda** is like hiring a chef per dish: when a customer orders, the chef comes and cooks; when nobody orders, you pay nothing — but the first visit is slow (cold start) and no dish can take longer than 15 minutes.

### Terms
- **EC2 instance**: a virtual machine rented by the second/hour, with its own OS that you manage and patch.
- **AMI (Amazon Machine Image)**: a template "disk image" containing the OS and software, used to create many identical EC2 instances.
- **Auto Scaling Group (ASG)**: a group of EC2 instances that adds/removes machines with load and replaces failed ones.
- **Task definition**: the ECS declaration for a container: image, CPU, memory, environment variables, IAM role.
- **Control plane**: the "brain" of Kubernetes (API server, scheduler, etcd); on EKS AWS runs it and charges per hour.
- **HPA (Horizontal Pod Autoscaler)**: the Kubernetes component that grows or shrinks the number of pods based on CPU or custom metrics.
- **Cold start**: the first Lambda invocation must create a new environment (download code, boot the JVM, run initialization code), so it is much slower than later calls.
- **SnapStart**: a Lambda feature that snapshots an already-initialized JVM and restores from that snapshot to reduce cold start.

### Step by step: the same service, four ways to run it
1. **Packaging**: EC2 takes a JAR or an AMI; Fargate and EKS take a Docker image from ECR; Lambda takes a JAR/zip or a container image. Why it matters: the packaging choice decides the CI/CD pipeline you must build.
2. **Where it runs**: EC2 runs on a machine you manage; Fargate runs on AWS-managed machines you never see; EKS runs pods on nodes (your EC2 or Fargate); Lambda runs in short-lived microVMs that AWS creates when an event arrives. Why: whoever owns the machine must patch the OS and be on call when it breaks.
3. **Receiving traffic**: EC2/Fargate/EKS usually sit behind an ALB and listen on a port continuously; Lambda runs only when there is an event from API Gateway, ALB, SQS, S3... Why: this is why Lambda costs nothing when there are no requests.
4. **Scaling**: EC2/Fargate/EKS need tens of seconds to minutes to start another machine/container and JVM; Lambda creates a new environment in seconds, but **each environment handles only one request at a time**. Why: this is the root of the trade-off "scales fast but has cold start and a burst of connections".
5. **Billing**: EC2/Fargate bill for running time even with no requests; Lambda bills per request x duration x memory. Why: with low or spiky traffic Lambda is cheap; with high steady traffic containers are usually cheaper.

~~~text
Example estimate (to compare orders of magnitude, not an exact price sheet):
API at 5 requests/second all day = ~13 million requests/month, 200 ms each, 1 GB
  Lambda : 13M x 0.2 s x 1 GB = 2.6 million GB-seconds  -> about 45 USD/month
  Fargate: 2 tasks (0.5 vCPU, 1 GB) running 24/7        -> about 35 USD/month
Traffic grows 10x:
  Lambda : grows almost exactly 10x (~450 USD)
  Fargate: only a few more tasks, because one JVM handles many requests in parallel
~~~

### What each option really is
- **EC2**: you manage OS, patches, AMI, Auto Scaling Group, load balancer. Most flexible (install agents, kernel tuning, GPU) but you pay for instance uptime and for operational effort.
- **ECS Fargate**: you package a Docker image and declare a task definition (CPU, memory, env, IAM task role). AWS runs the container; there is no node to patch. Fits most "ordinary" Spring Boot services.
- **EKS**: managed Kubernetes control plane. Strong when there are many teams, you need CRDs/operators, service mesh, or you already have a K8s platform. The price is complexity: ingress, HPA, RBAC, add-ons, cluster upgrades.
- **Lambda**: function + event trigger, scales almost instantly, you pay per request and execution time. Constraints: max 15 minutes per invocation, cold start, no state, connection pool is hard to manage.

### Practical comparison table
| Criterion | EC2 | ECS Fargate | EKS | Lambda |
|---|---|---|---|---|
| OS management | You | AWS | AWS + you handle nodes if using EC2 nodes | None |
| Cold start | None | Low | Low | Yes, worse with Java |
| Scaling | Minutes | Minutes | Minutes (HPA) | Seconds |
| Long workload (batch, streaming) | Good | Good | Good | No (15 minutes) |
| What the team must know | Linux, systemd | Docker, task definition | Kubernetes | IAM, event model |
| Cost at low load | High (instance on 24/7) | Medium | High (control plane + nodes) | Very low |

### How to decide
1. If the workload is a 24/7 HTTP API with steady traffic: **ECS Fargate** is the best balance; less operation than EC2, simpler than EKS.
2. If the company already has a Kubernetes platform, many services, and needs standardized deployment: **EKS**; do not rebuild ECS.
3. If you need GPU, special software, kernel tuning, or want to use Reserved Instances you already bought: **EC2**.
4. If it is a short task (image processing, webhook, small cron, glue code between services): **Lambda**. With Java, always consider SnapStart and keep the function "warm".

### Common mistakes
- **Taking a stock Spring Boot app to Lambda.** Symptom: 3-8 second cold start because of the Spring context, Hibernate, connection pool; the average looks fine but p99 is bad. How to avoid: do not choose Lambda just because it is "cheap"; if you still use it, enable SnapStart, raise memory, trim dependencies, or move to Fargate.
- **Setting Fargate task CPU/memory by gut feel.** Symptom: memory set right at the limit gives OOMKilled (exit code 137); set too high and you pay for nothing, since task CPU/memory decides both price and performance. How to avoid: watch real memory utilization for a few weeks before deciding, and leave heap at about 75% of task memory.
- **Hand-writing a separate deployment YAML per service on EKS.** Symptom: after a few months each service looks different, configs drift, upgrades are hard. How to avoid: use Helm/Kustomize with shared templates and policy-as-code.
- **Choosing EKS because "big companies use it".** Symptom: a five-person team spends half its time upgrading clusters, fixing add-ons, ingress. How to avoid: choose EKS only when someone is on call for the platform and there is a real need (many teams, CRDs/operators, service mesh).

### One-minute spoken answer
"I choose where to run based on two questions: who operates the infrastructure, and what the workload looks like. EC2 gives full control of the OS but I have to patch and be on call for the machine; ECS Fargate lets me run containers without servers to manage; EKS is managed Kubernetes, strong when the company already has a K8s platform; and Lambda runs on events, scales in seconds and bills per request. The main trade-off is that Lambda is cheap at low, spiky traffic but has cold start, a 15-minute limit and a hard time managing connection pools; EKS is the most flexible but has a high people cost. For a 24/7 Spring Boot API, my default is ECS Fargate behind an ALB; I use Lambda for webhooks, file processing and small cron jobs, and I always measure Init Duration before deciding."

> Senior tip: for most Java teams of 5-20 people, ECS Fargate + ALB + RDS is the shortest path to a stable production. Only move up to EKS when someone is really on call for the cluster; the hidden cost of Kubernetes is people, not the AWS bill.`,
    follow: [
      `If a service needs to process a 30-minute job, how does Lambda handle it?`,
      `Why is EKS more expensive to operate than ECS even though the control plane costs only about 0.10 USD/hour?`,
      `How would you migrate a Spring Boot monolith to containers with no downtime?`
    ],
  },

  'aws-002': {
    q: `Java on Lambda has a high cold start. How do SnapStart, GraalVM native image and memory/CPU tuning work, and which one should you choose?`,
    a: `**Summary:** Java cold start on Lambda consists of class loading + JVM startup + initialization code (Spring context, DB pool). SnapStart snapshots the JVM state after init so initialization is skipped; GraalVM native image reduces load time and memory; more memory gives more CPU and shortens init.

### Quick intuition
Cold start is like opening a shop in the morning: you must turn on the lights, open the register, stock the shelves before you can sell the first item. Java is especially slow here because the JVM must load thousands of classes and Spring must build every bean. **SnapStart** is like photographing the shop fully set up, then each morning just "restoring from the photo" instead of setting up again. **GraalVM native** is like pre-cooking packed meals (compiled ahead of time): open and eat right away, but changing the recipe is hard. **More memory** is like hiring more staff: Lambda gives CPU in proportion to memory, so everything, including startup, gets faster.

### Terms
- **Execution environment**: the microVM that runs a Lambda function, reused across consecutive invocations but handling only one request at a time.
- **Init phase**: the stage that runs static initializers, the handler constructor and framework startup, before the first handler call.
- **Init Duration / Restore Duration**: fields in the REPORT log line showing how long init (or snapshot restore) took; they appear only on a cold start.
- **CRaC (Coordinated Restore at Checkpoint)**: an API ({{org.crac}}) that lets code run a hook before the snapshot is taken and after it is restored.
- **AOT (Ahead-of-Time)**: compiling to machine code before runtime instead of letting the JIT compile during runtime.
- **JIT warmup**: the early phase where the JVM is slow because it is interpreting and collecting data before compiling hot code.
- **Reachability metadata**: declarations of which classes/resources need reflection so GraalVM keeps them in the native image.
- **GB-second**: Lambda's billing unit = configured memory (GB) x running time (seconds).

### Step by step
**Normal cold start:**
1. A request arrives but no environment is free, so Lambda creates a new microVM. Why: each environment handles one request, so the N+1th concurrent request always needs a new environment.
2. Download code and start the Java runtime. Why slow: the JVM must load classes, verify them and interpret before the JIT can optimize.
3. Run the init phase: handler constructor, Spring builds the context, Hibernate reads metadata. This is usually the biggest part, measured in seconds.
4. Call the handler. Later requests into this environment are **warm starts**, only step 4.

**With SnapStart:**
1. When you **publish a version**, Lambda runs init once, calls {{beforeCheckpoint}}, snapshots memory and microVM state, encrypts and caches it. Why at publish time: so the init cost is paid once, not on every cold start.
2. When a new environment is needed, Lambda restores from the snapshot instead of steps 2-3, then calls {{afterRestore}}.
3. Call the handler as usual. Note SnapStart only applies to invocations through a published version/alias, not to {{$LATEST}}.

~~~text
Illustrative numbers, Spring Boot 1 GB:
Normal cold start: [create VM][boot JVM][init Spring ~4 s.............][handler 50 ms] ~ 4-5 s
SnapStart        : [create VM][restore ~0.3-0.6 s][afterRestore][handler 50 ms]      < 1 s
Warm start       : [handler 50 ms]
~~~

### Where cold start comes from
When no execution environment is ready, Lambda must: download code, initialize the runtime, run the **init phase** (static initializers, constructors, Spring Boot), then call the handler. With Spring Boot, init can take most of the time because of component scanning, proxies and Hibernate metadata. Also, the old VPC behavior (before 2019) used to add ENI cold start; today Lambda uses hyperplane ENIs, so that is usually no longer the main issue.

### SnapStart
- Applies to managed Java runtimes from Java 11 up (11, 17, 21...); now also available for Python and .NET.
- Lambda runs init once, snapshots JVM memory + heap + loaded classes, encrypts and caches it.
- When a request arrives, Lambda restores the snapshot instead of initializing again, typically cutting cold start from seconds to hundreds of milliseconds.
- **Cannot be snapshotted**: open network connections, threads, entropy/random seed, file descriptors. So the code must "refresh" after restore.

~~~java
// Runtime hooks using the CRaC API (org.crac): implement Resource and register it in the global context
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

Big pitfall: **unique IDs/random values** repeat after restore if they are generated during init, because every restored environment comes from the same snapshot. Do not create UUIDs/tokens/seeds in a static initializer or constructor; generate them in the handler or in {{afterRestore}}. {{SecureRandom}} on the Lambda managed Java runtime is designed to be safe with snapshots, while {{java.util.Random}} initialized during init is not.

### GraalVM native image
Compiles AOT into a binary, removing JVM startup and JIT warmup. Cold start can drop to tens to hundreds of ms, with lower memory. In exchange: long builds, reflection/resources must be declared (Spring Boot 3 has AOT + reachability metadata), some libraries are incompatible, and without JIT peak throughput may be lower than a warmed JVM.

### Memory and CPU
Lambda allocates CPU in proportion to memory (for example 1,769 MB is about 1 vCPU). Raising memory usually **reduces** running time and can even be cheaper because billing is per GB-second. Do not set 512 MB for Spring Boot and then complain it is slow. Measure with Lambda Power Tuning (a state machine) to find the cost optimum.

### Which one to choose
| Situation | Choice |
|---|---|
| Moderate Spring Boot, keep JVM code | SnapStart |
| Small function, few dependencies, need extremely low cold start | GraalVM native |
| Code already uses lots of reflection/agents | JVM + SnapStart, more memory |
| Latency not sensitive | Normal JVM, optimize init |

### Common mistakes
- **Enabling SnapStart but the trigger still calls {{$LATEST}}.** Symptom: the REPORT log still shows an Init Duration of several seconds and no Restore Duration. How to avoid: publish a version and point API Gateway/event sources at an alias that targets that version.
- **Keeping connections open across the snapshot.** Symptom: the first call after restore fails with connection reset or a timeout to the DB/HTTP service. How to avoid: close in {{beforeCheckpoint}} and reopen in {{afterRestore}}, or create lazily on first use and enable validation in the pool.
- **Generating UUIDs/seeds/tokens during init.** Symptom: many environments produce the same value, causing duplicate keys or security holes. How to avoid: generate in the handler or in {{afterRestore}}, and use {{SecureRandom}}.
- **Setting 512 MB for Spring Boot.** Symptom: init takes 8-10 seconds, the handler is slow, sporadic timeouts. How to avoid: try 1024-2048 MB with Lambda Power Tuning; cost usually does not rise because running time falls accordingly.

### One-minute spoken answer
"Java cold start on Lambda has three parts: creating the environment, booting the JVM and running initialization code such as the Spring context, where initialization usually costs the most. I have three tools. SnapStart snapshots after init at version publish time, so cold start becomes a restore, usually under one second, in exchange for handling connections and random values after restore with CRaC hooks. GraalVM native compiles AOT so startup is extremely fast and memory is low, but builds are long, reflection must be declared and JIT is gone. More memory gives more CPU, faster init and often a lower bill. In practice I measure Init Duration first, then enable SnapStart and tune memory because that is the cheapest; I only choose native for small functions with few dependencies."

> Senior tip: do not optimize cold start before you measure. Enable Lambda Insights or read the REPORT log line to see Init Duration; if p99 is acceptable, keep the normal JVM. SnapStart is almost always the cheapest speed-up for Java, but test connections and random values after restore carefully.`,
    follow: [
      `How should the connection pool to RDS be handled after a SnapStart restore?`,
      `Why can raising memory lower the Lambda cost?`,
      `How do you debug reflection errors with GraalVM native?`
    ],
  },

  'aws-003': {
    q: `Designing a VPC for a microservices system: public/private subnets, NAT, Security Group vs NACL, VPC endpoints — how does it work and what are the common traps?`,
    a: `**Summary:** a VPC is a virtual private network; a public subnet has a route to the Internet Gateway, a private subnet goes out through NAT. A Security Group is a stateful firewall attached to an ENI; a NACL is stateless at the subnet layer. A VPC endpoint lets you call AWS services without going over the Internet.

### Quick intuition
A VPC is like a gated apartment complex. The **public subnet** is the row of houses on the main road with a gate to the street (Internet Gateway); the **private subnet** is the row of houses in the alley, which must pass a one-way guard post (**NAT**) to reach the street: people inside can go out, but people outside cannot come in on their own. A **Security Group** is the guard at each apartment door who remembers which guests were let in, so return traffic is allowed automatically; a **NACL** is the barrier at the alley entrance, checking both directions and remembering nobody. A **VPC endpoint** is an internal corridor straight to the "AWS supermarket" (S3, SQS...) without going out to the street.

### Terms
- **CIDR**: notation for an IP range; {{10.0.0.0/16}} has 65,536 addresses, {{/24}} has 256 (AWS reserves 5 addresses per subnet).
- **Availability Zone (AZ)**: one or more data centers with separate power and network inside a region.
- **Route table**: a subnet's map: which destination goes out of which door; the more specific route (longer prefix) wins.
- **Internet Gateway (IGW)**: the two-way door between the VPC and the Internet.
- **NAT Gateway**: lets machines in a private subnet reach the Internet using the NAT's IP, and blocks connections initiated from outside.
- **ENI**: a virtual network card attached to EC2, Fargate tasks or Lambda in a VPC; a Security Group is really attached to an ENI.
- **Stateful / stateless**: stateful remembers connections so it allows the reply direction automatically; stateless evaluates every packet independently.
- **Ephemeral port**: the temporary client-side port (1024-65535) that replies come back to; a NACL must allow it.

### Step by step: an app in a private subnet calls an external API and S3
1. An ECS task ({{10.0.11.25}}) opens a connection to the IP of api.partner.com. The private subnet's route table has {{0.0.0.0/0 -> nat-a}}. Why: the private subnet has no route to the IGW, so nobody on the Internet can target the task directly.
2. The task's Security Group checks outbound (allow all by default). Because the SG is stateful, return packets are allowed automatically.
3. The subnet's NACL checks outbound; because a NACL is stateless, it must also have an inbound rule for ephemeral ports so replies can come back.
4. The NAT Gateway sits in the public subnet, has an Elastic IP, rewrites the private source IP to the public IP and sends the packet through the IGW. Why: the Internet can only reply to a public IP.
5. The reply reaches the NAT, which rewrites the address back and forwards it to the task.
6. When the task calls S3: the route table has a route to the S3 prefix list pointing at the gateway endpoint. That route is more specific than {{0.0.0.0/0}} so it wins; traffic **does not go through NAT** and incurs no NAT per-GB charge.

~~~text
                       Internet
                          |
                       [ IGW ]
          AZ-a            |              AZ-b
+------------------ public subnet -------------------+
| ALB node    NAT-a (EIP)      | ALB node   NAT-b    |
+------------------ private app ---------------------+
| ECS task 10.0.11.25          | ECS task 10.0.12.40 |
+------------------ private db ----------------------+
| RDS primary                  | RDS standby         |
+----------------------------------------------------+
Route table private-a:
  10.0.0.0/16      -> local
  pl-xxxx (S3)     -> vpce-s3   (gateway endpoint, free)
  0.0.0.0/0        -> nat-a     (NAT in the same AZ)
~~~

### Reference layout
- **2-3 Availability Zones**, each AZ with one public subnet and one or more private subnets.
- **ALB** in the public subnet (or private if using CloudFront/API Gateway), the app in a private subnet, RDS in its own private subnet (DB subnet group spanning at least 2 AZs).
- Public route table: {{0.0.0.0/0 -> igw-xxx}}. Private route table: {{0.0.0.0/0 -> nat-xxx}} placed in the public subnet of the same AZ.
- Each AZ should have its own NAT Gateway to avoid cross-AZ data charges and a single point of failure. NAT Gateway bills per hour + GB processed, an easy cost to overlook.

### Security Group vs NACL
| Criterion | Security Group | Network ACL |
|---|---|---|
| Attached to | ENI / resource | Subnet |
| Stateful | Yes (allows return traffic automatically) | No, you must open both directions |
| Rules | Allow only | Allow and deny |
| Evaluation | All rules before deciding | By rule number, stops at the first match |
| Use when | Main traffic control | Raw IP blocking layer, e.g. blocking bad IP ranges |

In practice 95% of the control should live in Security Groups. Do not open {{0.0.0.0/0}} for port 3306/5432 or Redis; allow only the app's SG to call the DB's SG (reference the SG as the source).

### VPC endpoints
- **Gateway endpoint**: S3 and DynamoDB, free, attached to a route table. Use almost by default.
- **Interface endpoint (PrivateLink)**: creates an ENI in the subnet, billed per hour + GB. Used for SQS, SNS, KMS, Secrets Manager, ECR, CloudWatch Logs... so traffic never goes to the Internet.
- Benefits: lower NAT cost, no dependency on the Internet, easier security compliance.
- You must enable **private DNS** for the interface endpoint so the SDK uses the standard domain name.

### Common mistakes
- **Pulling Docker images and shipping logs through NAT.** Symptom: the NAT Gateway bill (per GB processed) spikes on every deploy, and NAT is sometimes saturated. How to avoid: create endpoints for ECR (api + dkr, plus the S3 gateway endpoint because image layers live in S3) and CloudWatch Logs.
- **One NAT shared by several AZs.** Symptom: if the AZ holding the NAT fails, the whole system loses egress; on normal days you pay cross-AZ fees. How to avoid: one NAT per AZ, each AZ's private route table pointing at its own NAT.
- **Editing a NACL and forgetting it is stateless.** Symptom: inbound 443 is open but outbound ephemeral 1024-65535 is not, so connections hang in a very confusing way even though the Security Group is correct. How to avoid: leave the NACL as default allow and only use NACLs for raw IP blocking; do the real control in Security Groups.
- **Disabling VPC DNS.** Symptom: the interface endpoint has private DNS but the SDK still goes to the Internet or cannot resolve. How to avoid: enable both {{enableDnsSupport}} and {{enableDnsHostnames}}.
- **Overlapping CIDRs.** Symptom: you cannot peer/Transit Gateway with another VPC or on-prem, and you must re-IP the whole system. How to avoid: plan a non-overlapping /16 for each VPC from day one.

### One-minute spoken answer
"A VPC is my private network on AWS. I give each AZ a public subnet for the ALB and NAT and private subnets for the app and database; the private subnet goes to the Internet through the NAT Gateway of its own AZ, so there is no shared point of failure and no cross-AZ fees. I put access control in Security Groups because they are stateful and can reference other SGs, for example only the app SG can reach port 5432 on the database SG; NACLs are stateless, so I only use them to block raw IP ranges. To cut NAT cost and avoid depending on the Internet, I always have gateway endpoints for S3 and DynamoDB and interface endpoints for ECR, Secrets Manager and CloudWatch Logs. My experience is that most 'cannot call S3' incidents live in the route table or a missing endpoint, so I enable VPC Flow Logs from the start."

> Senior tip: draw the route table before you draw the diagram. Most "the service cannot reach S3/Secrets Manager" incidents are a missing endpoint or route, not code. Enable VPC Flow Logs to CloudWatch/S3 for fast troubleshooting.`,
    follow: [
      `Why should each AZ have its own NAT Gateway even though it costs more?`,
      `How does a Security Group referencing another Security Group work?`,
      `When do you need AWS PrivateLink instead of VPC peering?`
    ],
  },
  'aws-004': {
    q: `How is an IAM role different from an IAM user? How do you apply least privilege to an application running on ECS/EKS/Lambda without hard-coding credentials?`,
    a: `**Summary:** An IAM user is a long-term identity tied to a fixed access key; an IAM role is a temporary identity that gets assumed, and STS returns credentials with an expiry (usually 15 minutes to 12 hours). Applications should always use roles: task role on ECS, IRSA or EKS Pod Identity on EKS, execution role on Lambda, and never embed access keys in the image or in environment variables.

### Quick intuition
**IAM user** is like an employee who is handed a permanent key: if the key is dropped (the access key leaks to GitHub), the intruder can get in forever until you change the lock. **IAM role** is like a visitor badge with an expiry from the reception desk: whoever satisfies the conditions (the trust policy) gets a badge, and the badge expires on its own after a few hours. An application should always "go to the reception desk for a badge" instead of keeping a permanent key, and the AWS SDK does that automatically. **Least privilege** means the badge opens only the doors the job needs: the warehouse clerk has no business in the accounting room.

### Terms
- **Principal**: the subject sending a request to AWS - a user, a role, or an AWS service.
- **Policy**: a JSON document with Effect (Allow/Deny), Action, Resource and Condition.
- **Trust policy**: a policy attached to a role that says who is allowed to assume that role.
- **STS (Security Token Service)**: the service that issues temporary credentials when a principal assumes a role.
- **Session token**: the third part of a temporary credential; it must be sent together with the temporary access key and expires with the session.
- **IMDS**: the address {{169.254.169.254}} inside EC2 that serves instance metadata and instance-profile credentials; IMDSv2 requires a token to be fetched with PUT first.
- **IRSA / EKS Pod Identity**: two ways to attach an IAM role to a pod through a Kubernetes ServiceAccount.
- **OIDC provider**: the configuration that tells IAM to trust tokens signed by the EKS cluster; used by IRSA.

### Step by step: an ECS task reads a file on S3
1. When the task starts, ECS fetches temporary credentials for the **task role** and serves them on an internal endpoint, while setting {{AWS_CONTAINER_CREDENTIALS_RELATIVE_URI}} inside the container. Why: the code never has to hold a long-lived credential.
2. The code calls {{S3Client.create()}}. The v2 SDK walks the credential provider chain, reaches the container credential provider, calls that endpoint and gets an access key, a secret key, a session token and an expiry time.
3. The SDK signs the request with SigV4 and sends it to S3.
4. IAM evaluates: is there any matching explicit Deny? Is there a matching Allow (identity policy or resource policy) that is not blocked by an SCP or a permission boundary? No Allow means implicit deny.
5. Before the credentials expire, the SDK refreshes them by itself. Why the app does not need a restart: the provider caches the credential together with its expiry and fetches a new one in time.

On EKS the mechanism is the same shape: with IRSA, the pod receives a ServiceAccount token plus {{AWS_ROLE_ARN}} and {{AWS_WEB_IDENTITY_TOKEN_FILE}}, and the SDK calls {{AssumeRoleWithWebIdentity}}. With Pod Identity, the SDK talks to an agent running on the node through {{AWS_CONTAINER_CREDENTIALS_FULL_URI}}, just like ECS does.

~~~text
Request signed with SigV4
   |
   v
Any matching explicit Deny? ---yes---> DENY
   | no
   v
Matching Allow not blocked by SCP/boundary? ---no---> DENY (implicit deny)
   | yes
   v
ALLOW
~~~

### How a policy is evaluated
- A **principal** (who) performs an **action** (what) on a **resource** (which), optionally with a **condition** (when). Evaluation order: explicit deny wins over everything; then explicit allow; everything left over is implicit deny - meaning silence is refusal, not permission.
- A **role** has a trust policy that says who may assume it. When assumed, STS issues an access key, a secret key and a **session token**.
- The **credential provider chain** in AWS SDK for Java v2 looks for credentials in order: system property, environment variable, profile, container credential endpoint (ECS), IMDS (EC2), and so on, so the same code works anywhere.

### Per platform
- **ECS**: the task definition has a **task role** (the permissions of your code) separate from the **execution role** (pull the image, write logs). Mixing the two up is the classic bug: the code cannot call S3 because the permission sits on the execution role.
- **EKS**: two options. **IRSA** (IAM Roles for Service Accounts) links a Kubernetes ServiceAccount to an IAM role through an OIDC provider; the pod gets a projected-volume token. **EKS Pod Identity** is the newer route: the role is attached through an add-on, so you do not have to edit a trust policy per cluster.
- **Lambda**: the execution role declares the permissions; every function should have its own role rather than a shared "admin, for speed" role.
- **EC2**: an instance profile is attached to the instance; but if you run containers on EC2, prefer the ECS task role so the container does not inherit the whole node's permissions.

### Least privilege in practice
1. Start from the minimum permission, never from {{*}}.
2. Limit the resource ARN: a specific bucket, queue, secret, table.
3. Use conditions: {{aws:SourceVpce}}, {{aws:PrincipalTag/team}}, {{s3:prefix}}, {{aws:SourceArn}} for SNS/SQS.
4. Split roles by workload and by environment (dev/staging/prod); never reuse the prod role for dev.
5. Use **IAM Access Analyzer** to find unused permissions and to generate a policy from CloudTrail history.
6. For sensitive permissions, require MFA through the condition {{aws:MultiFactorAuthPresent}}.

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

### Common mistakes
- **Putting the permission on the execution role instead of the task role on ECS.** Symptom: the task runs fine, pulls the image and writes logs, but the code gets AccessDenied from S3. How to avoid: permissions for the code live on the task role; the execution role only lets ECS pull the image, read secrets at startup and write logs.
- **An access key committed to Git or baked into the Docker image.** Symptom: even after deleting it in a later commit, the key still lives in the layer/history and a bot steals it within minutes. How to avoid: rotate (disable) the key immediately, turn on secret scanning, and move to roles.
- **Using the root account for CI/CD.** Symptom: one leaked key hands over the entire account - a disaster. How to avoid: enable MFA on root, create no access key for root, and let CI/CD assume a role through OIDC (for example GitHub Actions).
- **A very broad role combined with an SSRF hole.** Symptom: the attacker uses SSRF to steal credentials and then reads all of S3; on EC2, IMDSv1 is especially easy to abuse. How to avoid: constrain both the permission and the network path (VPC endpoint, condition) and require **IMDSv2**.

### One-minute spoken answer
"An IAM user is a long-lived identity with a fixed access key, while an IAM role is an identity you assume: STS returns temporary credentials with a session token that expire on their own. My applications always use roles - task role on ECS, IRSA or Pod Identity on EKS, execution role on Lambda - and the AWS SDK fetches and refreshes the credentials through the provider chain, so no code ever contains a key. When IAM evaluates a request, an explicit Deny always wins, then an Allow, and anything else is denied implicitly. For least privilege I split roles per service and per environment, restrict the ARN, add conditions such as a VPC endpoint, and use IAM Access Analyzer to generate policies from CloudTrail. The question I always ask in review is: if this service is taken over, what can the attacker touch."

> Senior tip: treat each service as its own principal. In a review the first question is not "does it run" but "if this service is compromised, what can the attacker reach". A good role boundary turns a large incident into a small one.`,
    follow: [
      `What is the difference between the task role and the execution role on ECS?`,
      `How does IRSA work from the moment the pod starts until the SDK receives credentials?`,
      `How do you find and narrow IAM permissions that were granted too broadly?`
    ],
  },

  'aws-005': {
    q: `How do RDS, Aurora, and DynamoDB differ in nature? For a new system, which do you choose and why?`,
    a: `**Summary:** RDS is a managed relational database on a traditional engine (PostgreSQL, MySQL...); Aurora is a relational engine compatible with MySQL/PostgreSQL but with distributed storage, so it scales reads better; DynamoDB is a fully managed key-value/document NoSQL with stable latency at any scale, but you must design the access patterns up front.

### Quick intuition
**RDS** is like renting a familiar kitchen (PostgreSQL, MySQL) with someone else handling maintenance and backups: you still pick the size of the kitchen and cook the same dishes. **Aurora** serves the same dishes, but the ingredient store is copied into 6 warehouses across 3 locations; many assistant chefs read from that shared store, so reads are fast and losing one warehouse does not stop service. **DynamoDB** is like a supermarket parcel locker: give the right locker number (the key) and you get your item in milliseconds even with millions of lockers, but asking "find me every red bag" is slow and expensive. So choosing a database is really choosing **how you will ask questions of the data**.

### Terms
- **Multi-AZ**: a standby in another AZ that receives data synchronously and is promoted automatically when the primary dies.
- **Read replica**: a read-only copy that receives data asynchronously, so it lags slightly behind.
- **Replica lag**: the time between a write on the primary and the moment the replica can see that write.
- **Quorum**: the minimum number of copies that must acknowledge before an operation counts as successful.
- **ACU (Aurora Capacity Unit)**: the unit of capacity for Aurora Serverless v2, roughly 2 GiB of RAM plus matching CPU and network.
- **Partition key / sort key**: DynamoDB keys; the partition key decides which partition an item lives in, the sort key orders items inside that partition.
- **RCU / WCU**: the read/write throughput units of DynamoDB.
- **RDS Proxy**: a managed proxy that funnels connections from many clients into a small pool towards the database.

### Step by step: one write through each system
1. **RDS Multi-AZ (DB instance)**: the app writes to the primary; the primary writes to EBS and **synchronously** ships the change to the standby in another AZ, and only then returns commit. Why: if the primary is lost, the standby already has all the data, so RPO is close to zero. The price: the standby accepts no queries.
2. **Aurora**: the writer does not write whole data pages; it sends redo log records to a distributed storage layer. Data has 6 copies across 3 AZs and a commit needs **4/6** acknowledgements (a read needs 3/6). Readers share the same storage, so no data has to be copied around and lag is usually under 100 ms. Why failover is fast: promoting a reader does not require copying data again.
3. **DynamoDB**: the SDK sends PutItem; DynamoDB hashes the partition key to pick a partition, writes to the leader copy and replicates to 3 AZs, returning after a majority acknowledges. Why latency is stable: each access touches exactly one partition - no joins, no query planner.

~~~text
RDS Multi-AZ             Aurora                          DynamoDB
   App                     App                              App
    |                       |                                | PutItem(pk=USER#42)
 Primary --sync--> Stb   Writer    Reader x15             hash(pk) -> partition 7
    |               |       |          |                     |
   EBS             EBS   [ storage: 6 copies / 3 AZ ]    3 copies across 3 AZ
                          write needs 4/6, read needs 3/6
~~~

### RDS
- Runs a familiar engine; you pick the instance class, storage, backups, Multi-AZ.
- **Multi-AZ** (DB instance) is a synchronous standby with automatic failover (usually 60-120 seconds); you do not read from the standby. The separate **Multi-AZ DB cluster** (MySQL/PostgreSQL) has 2 readable standbys.
- **Read replica** is an asynchronous copy used to scale reads; it has replication lag.
- Fits: applications with transactions, joins, reporting, ORM/JPA, clearly relational data.

### Aurora
- Storage is separated from compute, replicated 6 ways across 3 AZs, billed per GB-month plus I/O (or Aurora I/O-Optimized).
- A cluster is one writer plus up to 15 readers; failover is faster than RDS Multi-AZ and replica lag is low.
- **Aurora Serverless v2** scales in ACUs, which suits variable load; a minimum ACU above 0 still costs money while idle (you can set min 0 ACU for auto-pause, at the price of a few seconds to resume).
- **Aurora Global Database** for cross-region DR with an RPO of around 1 second.
- Fits: read-heavy workload, high availability, MySQL/PostgreSQL compatibility, large scale.

### DynamoDB
- A key-value table where each item is at most 400 KB; access is by **partition key** (plus sort key).
- Throughput in on-demand or provisioned mode; single-digit millisecond latency at large scale.
- Features: GSI/LSI, TTL, Streams, transactions (limited), the DAX cache.
- No joins and no flexible SQL-style queries; every access pattern must be known in advance.
- Fits: sessions, carts, catalogs by key, event state, workload that needs extreme horizontal scale.

### Quick selection table
| Need | Choose |
|---|---|
| Transaction, join, complex reporting | RDS PostgreSQL |
| Same needs but high availability and large read scale | Aurora PostgreSQL |
| Key-value, access by key, unlimited scale | DynamoDB |
| Heavy analytics, OLAP | Redshift / Athena, not the three above |
| Full-text search | OpenSearch |

### Common mistakes
- **Choosing DynamoDB and then querying it like SQL.** Symptom: a full-table Scan, filtering on the client, RCU bills exploding and the API getting slower as data grows. How to avoid: list the access patterns first and **design the table around them**; for ad-hoc questions, ship the data to Athena/OpenSearch.
- **Forgetting Aurora's I/O bill.** Symptom: a workload with many small updates costs more in I/O than in the instance itself. How to avoid: measure before you commit, and consider Aurora I/O-Optimized once I/O passes roughly 25 percent of the total Aurora spend.
- **Pointing reports at the Multi-AZ standby.** Symptom: you cannot connect, because the standby (DB instance) accepts no connections. How to avoid: Multi-AZ is for availability, not read scaling; point reports at a read replica or the reader endpoint.
- **Ignoring the connection pool while scaling out.** Symptom: every app instance opens too many connections, {{max_connections}} runs out, and "too many connections" appears exactly when autoscaling kicks in. How to avoid: HikariCP with a small pool, plus PgBouncer/RDS Proxy when there are many clients or when you use Lambda.

### One-minute spoken answer
"RDS is the familiar PostgreSQL or MySQL, managed by AWS: I pick the instance class, Multi-AZ for availability and read replicas to scale reads. Aurora is compatible with PostgreSQL/MySQL but separates compute from storage: data has 6 copies across 3 AZs, writes need a 4/6 quorum, and up to 15 readers share the storage, so failover is fast and replica lag is low. DynamoDB is key-value: access by partition key gives a few milliseconds at any scale, but there are no joins and no flexible queries, so every access pattern must be known up front. The trade-off is query flexibility versus predictable scaling. For a new system with relational data my default is Aurora PostgreSQL; I only pick DynamoDB when I can list the main queries clearly, for example sessions, carts or event state."

> Senior tip: my default for a new system is **Aurora PostgreSQL** when the data is relational and the team already knows SQL; **DynamoDB** only when the access patterns are clear and you need predictable scale and latency. Do not pick NoSQL because it is trendy and then hand-write joins in the application layer.`,
    follow: [
      `How does Aurora Serverless v2 differ from provisioned, and when does it end up more expensive?`,
      `Why is DynamoDB a bad fit for ad-hoc queries?`,
      `What problem does RDS Proxy solve when the app scales out with Lambda?`
    ],
  },
  'aws-006': {
    q: `DynamoDB: how do the partition key and sort key affect things? What is a hot partition, how does a GSI help or hurt, and which traps should you watch for?`,
    a: `**Summary:** DynamoDB spreads data by the hash of the partition key; a well-distributed key spreads throughput evenly, a skewed key creates a hot partition. The sort key allows ordered range queries inside one partition. A GSI is a secondary table with a different key, updated asynchronously, with its own throughput and its own bill.

### Quick intuition
DynamoDB is like a post office with thousands of mailboxes. The **partition key** is like a postal code: a machine hashes it to decide which box a letter goes into. If everyone sends to the same code (for example "today"), one box jams while the others stay empty - that is a **hot partition**. The **sort key** is how letters inside one box are ordered by date, so fetching "customer 42's letters in March" is fast. A **GSI** is a second address book sorted by another criterion, transcribed by staff after each new letter arrives, so it can lag one beat behind.

### Terms
- **Physical partition**: the unit of storage and throughput inside DynamoDB, roughly 10 GB, 3,000 RCU and 1,000 WCU.
- **RCU**: one strongly consistent read of an item up to 4 KB per second (or two eventually consistent reads of that item).
- **WCU**: one write of an item up to 1 KB per second.
- **Cardinality**: the number of distinct values an attribute has; high cardinality spreads data more evenly.
- **Throttling**: DynamoDB rejecting a request (ProvisionedThroughputExceededException) when you exceed the limit; the SDK retries with backoff.
- **Adaptive capacity**: the mechanism that shifts capacity towards hot partitions and splits partitions when needed.
- **Single-table design**: storing several entity types in one table, told apart by key prefixes.
- **Projection**: the set of attributes copied from the base table into an index.

### Step by step: writing one order
1. The app calls PutItem with {{pk=USER#42}} and {{sk=ORDER#2025-03-01#A1}}. DynamoDB hashes {{pk}} to choose a partition. Why hash: so that similar keys (USER#41, USER#42) still land in different partitions and spread the load.
2. The item is written into that partition and ordered by {{sk}}. Why: the query "orders of USER#42 since March" only has to read one contiguous range instead of scanning the table.
3. If the item holds an attribute that is a GSI key (for example {{status}}), DynamoDB copies it into the GSI **asynchronously** and consumes that GSI's WCUs. Why asynchronous: writing the base table must not wait for the index.
4. When a partition grows too large or stays hot for long, DynamoDB splits it. But a single extremely hot partition-key value still hits that partition's ceiling, because every request for that key funnels into the same place.

~~~text
Table with 10 partitions, write load of 5,000 WCU/second:
Good key (userId)             : ~500 WCU per partition            -> OK
Bad key (date = today)        : 5,000 WCU into 1 partition, cap 1,000
                                -> most requests throttled even though the table "has spare"
Shard suffix (date#0..date#9) : ~500 WCU per partition            -> OK
                                price: reads must fire 10 Query calls and merge results
~~~

### How DynamoDB stores data
- An item is identified by a **partition key** (required) and a **sort key** (optional).
- The partition key is hashed onto physical partitions. Each partition has a throughput ceiling (about 3,000 RCU of strongly consistent reads and 1,000 WCU of writes per second, plus a 10 GB data limit).
- If one key dominates traffic, the partition holding it gets hot while the others sit idle. That is a **hot partition**: you see throttling in one place even though the table still has capacity overall.
- **Adaptive capacity** softens this by moving capacity towards the hot partition, but it cannot rescue a single key with extreme traffic.

### Key design
- Pick a key with high cardinality and even spread: {{userId}} or {{orderId}} (a UUID) are good; {{status}}, {{country}} or a raw date are usually bad because they have few distinct values.
- Write in a **single-table design**: a shared partition key {{USER#123}} with a sort key like {{ORDER#2024-...}} lets one query fetch several entity types.
- If you are stuck with a skewed key, add a **shard suffix** (for example {{status=NEW#0..9}}) and scatter-gather on read, or add a GSI with a different key.

### GSI and LSI
- **GSI**: its own partition and sort key, decoupled from the base table, its own throughput, updated **asynchronously** (eventual consistency).
- **LSI**: can only be created together with the table, shares the partition key but uses a different sort key; at most 5 per table.
- A GSI has its own **hot partition**: if the GSI key is {{status}}, every {{NEW}} item piles into the same spot. This is a very common mistake when a GSI is added "so the query is convenient".
- GSI **projection**: project only the attributes you need ({{KEYS_ONLY}}, {{INCLUDE}}) to cut cost; {{ALL}} costs more in storage and in write replication.

### Query vs Scan
- {{Query}} needs the partition key and reads a sort-key range: efficient.
- {{Scan}} reads the whole table: expensive and slow; reserve it for small offline jobs.
- Paginate with {{LastEvaluatedKey}}, never with an offset.

~~~java
QueryRequest req = QueryRequest.builder()
    .tableName("orders")
    .keyConditionExpression("pk = :pk AND begins_with(sk, :prefix)")
    .expressionAttributeValues(Map.of(
        ":pk", AttributeValue.fromS("USER#42"),
        ":prefix", AttributeValue.fromS("ORDER#")))
    .build();
~~~

### Common mistakes
- **Using a timestamp or date as the partition key.** Symptom: every write piles into the partition of the current moment, throttling appears even though the table has spare capacity. How to avoid: use the entity id as the partition key and the timestamp as the **sort key**.
- **A GSI without enough capacity.** Symptom: writes to the base table get throttled even though the table has WCUs left, because GSI throttling is **back-pressured** into the base table. How to avoid: give the GSI enough WCUs (or use on-demand), pick an evenly distributed GSI key, and keep the projection lean.
- **Reading a GSI right after a write.** Symptom: the order was just created but the list API does not show it yet. How to avoid: a GSI is eventually consistent only; a read-after-write flow should read the base table by key, optionally with ConsistentRead.
- **Getting the size wrong.** Symptom: an item exceeds 400 KB, or a transaction exceeds 100 items / 4 MB, and you have to redesign. How to avoid: move large blobs to S3 and keep only the key, and split big entities across several sort keys.

### One-minute spoken answer
"DynamoDB hashes the partition key to decide which physical partition an item lives in, and each partition has a ceiling of about 3,000 RCU and 1,000 WCU. If the key is evenly distributed like userId, load spreads out; if the key has few values like status or a date, one partition runs hot and you get throttled even though the table has capacity. The sort key allows range queries inside a partition, which fits patterns like 'orders of a user over time'. A GSI is a secondary table with a different key, updated asynchronously, with its own capacity, and it can have its own hot partition and even back-pressure the base table. When I am forced into a skewed key I add a shard suffix and read with scatter-gather. My habit is to start the design with a list of access patterns and their frequency, not with an ERD."

> Senior tip: DynamoDB design starts with the list of access patterns, not with the ERD. If you cannot list the 10 main queries together with their frequency, you are not ready to choose DynamoDB.`,
    follow: [
      `Why does using a date or month as the partition key usually create a hot partition?`,
      `How does GSI eventual consistency affect a read-after-write flow?`,
      `When would you use an LSI instead of a GSI?`
    ],
  },

  'aws-007': {
    q: `S3: which storage class to use when, how does a presigned URL work, and what should you watch with lifecycle, consistency and multipart upload?`,
    a: `**Summary:** S3 is durable object storage that is strongly consistent once a write succeeds; you choose the storage class by how often data is read and how long you keep it; a presigned URL lets a client upload or download one object for a limited time without holding credentials; multipart upload is effectively mandatory for large files.

### Quick intuition
S3 is like a gigantic left-luggage office: every item (an **object**) has a tag (its **key**) and sits inside a hall (a **bucket**); there are no real folders, the {{/}} is just part of the tag. The **storage class** is the choice between a locker at the front desk (take it right away, expensive rent) and a cold warehouse outside town (cheap rent, but retrieval costs money and time). A **presigned URL** is like a signed parking ticket with an expiry: whoever holds it can drop off or pick up exactly that one item, with no account needed. **Multipart upload** is like moving house with many small vans in parallel: if one van breaks, only that van has to drive again.

### Terms
- **Object / key / bucket**: an object is a file plus metadata; the key is the object's full name; the bucket is a container with a globally unique name.
- **Durability of 11 nines**: S3 keeps copies in several AZs (except One Zone classes), so the chance of losing an object is minuscule; this is not the same as availability (whether you can reach it right now).
- **Retrieval fee**: the charge for reading data back out of IA and Glacier classes, priced per GB.
- **Minimum storage duration**: deleting or moving an object earlier than the minimum number of days still bills you for that whole period.
- **SigV4**: the AWS algorithm for signing a request with a secret key; a presigned URL is just a SigV4 signature placed in the query string.
- **Delete marker**: with versioning on, a delete only adds a "tombstone"; the old versions remain and keep costing money.
- **OAC (Origin Access Control)**: the mechanism that lets CloudFront read a private bucket without exposing the bucket to the internet.
- **Checksum**: a CRC32C/SHA256 value used to detect data corrupted in transit.

### Step by step: a user uploads an avatar through a presigned URL
1. The client asks the backend: "I want to upload avatar.png, 2 MB". The backend authenticates the user and checks permissions. Why: the decision to hand out a ticket must live on the server.
2. The backend signs a URL with the role's credentials, naming the bucket, the key {{user/42/avatar.png}}, the Content-Type and a 10-minute expiry. Signing is a local computation and makes **no network call to S3**, so it is very fast.
3. The client PUTs the file straight to S3 with that URL and the exact Content-Type that was signed. Why: the file never passes through the backend, so the backend spends no bandwidth and holds no threads.
4. S3 verifies the signature, the expiry, and also the permissions of the principal that signed: if the role lacks {{s3:PutObject}} on that key, the URL is rejected anyway.
5. S3 stores the object; once the PUT returns 200, every later GET/LIST sees the new object (strong consistency).
6. S3 emits an event (through EventBridge or SQS) so the backend can continue: resize the image, scan for viruses, update the database.

~~~text
Client --(1) ask for a URL------> Backend --(2) sign SigV4 locally
Client <------ URL expires in 10 minutes ---
Client --(3) PUT 2 MB -------------------------------> S3 bucket "uploads"
                                                         | (6) event
Backend <---------------- SQS / EventBridge -------------+
Multipart for a 1 GB file: 10 parts x 100 MB, upload 4 parts in parallel,
part 7 fails -> re-upload only part 7 -> CompleteMultipartUpload
~~~

### Storage class
| Class | When to use | Note |
|---|---|---|
| Standard | Hot data, low latency | Most expensive, no retrieval fee |
| Intelligent-Tiering | Pattern you cannot predict | Moves between tiers automatically, small monitoring fee |
| Standard-IA | Rarely read (under about once a month) | Retrieval fee, minimum 30 days |
| One Zone-IA | Reproducible data, rarely read | A single AZ |
| Glacier Instant Retrieval | Long retention, but still needs millisecond reads | Minimum 90 days |
| Glacier Flexible / Deep Archive | Backups, retrieval from minutes to hours (Flexible) or 12-48 hours (Deep Archive) | Cheapest storage, expensive retrieval; minimum 90/180 days |

### Presigned URL
- The server signs a URL with its own credentials (SigV4); the URL carries the action, the object key and the expiry time.
- The client uses that URL to PUT/GET directly, without going through the app server, which cuts load and saves bandwidth.
- Limits: SigV4 allows at most 7 days (when signed with an IAM user); if signed with temporary credentials (role, STS), the URL stops working earlier, as soon as the session credentials expire. Anyone holding the URL has the matching permission, so keep the TTL short and pin the exact key.
- Do not use presigned URLs for operations that need tight control (bulk delete); a URL should only cover uploading or downloading one specific object.

~~~java
S3Presigner presigner = S3Presigner.create();
PresignedPutObjectRequest req = presigner.presignPutObject(r -> r
    .signatureDuration(Duration.ofMinutes(10))
    .putObjectRequest(p -> p.bucket("uploads").key("user/42/avatar.png")
        .contentType("image/png")));
String url = req.url().toString();
~~~

### Lifecycle
- Rules by prefix or tag: move to IA after N days, to Glacier after M days, expire after K days.
- Use them to clean up incomplete multipart uploads (very important; otherwise you pay silently).
- Versioning plus lifecycle: drop old versions after some time; be careful with delete markers.

### Consistency
- Since late 2020, S3 gives **strong read-after-write consistency** for new PUTs and overwrites, and **strong** list results. The old eventual-consistency story in old docs is gone.
- Even so, layers above S3 (CloudFront, an application cache) can still serve an older copy; do not blame S3 for that.
- Updating metadata or copying an object is a new operation, not atomic with a reader that is downloading.

### Multipart
- Recommended for anything over 100 MB; one object is limited to 5 TB (AWS raised it to 50 TB in late 2025), at most 10,000 parts, each part 5 MB-5 GB (the last part may be smaller).
- Uploading parts in parallel speeds things up a lot.
- If one part fails, only that part is retried. You must call CompleteMultipartUpload; if you abandon it, add a lifecycle rule with {{AbortIncompleteMultipartUpload}}.
- Verify checksums (CRC32C/SHA256) to catch corrupted data.

### Common mistakes
- **A public bucket.** Symptom: customer data gets indexed or mass-downloaded; it is almost always a misconfiguration. How to avoid: enable Block Public Access, and serve public content through CloudFront with OAC.
- **Versioning on with no lifecycle.** Symptom: storage cost creeps up on every overwrite and delete, because the old versions stay. How to avoid: a lifecycle rule that deletes noncurrent versions after N days and cleans up expired delete markers.
- **Abandoned multipart uploads.** Symptom: the bucket looks empty but the bill charges for the unfinished parts. How to avoid: a lifecycle rule with {{AbortIncompleteMultipartUpload}} after a few days.
- **Using S3 as a filesystem.** Symptom: constantly editing small files - every PUT creates a new object, so you burn request money and time. How to avoid: if you need a shared filesystem, use EFS.
- **Forgetting the Content-Type on a presigned PUT.** Symptom: the browser handles the file wrongly on download (downloads it instead of displaying it, or the reverse). How to avoid: set Content-Type when signing and re-check it after upload.

### One-minute spoken answer
"S3 is object storage: data is replicated across several AZs and, since late 2020, it is strongly consistent - once the write is done, reads and lists see it immediately. I pick the storage class by read frequency: Standard for hot data, Intelligent-Tiering when I cannot predict, IA and Glacier for rarely read data, remembering that they charge retrieval fees and have minimum storage durations. For client uploads, the backend signs a short-lived presigned URL for exactly one key and the client pushes straight to S3, so the backend carries no bandwidth; anyone holding the URL has the permission, so the TTL must be short. Large files use multipart: split into parts, upload in parallel, and only retry the part that failed. By default I enable Block Public Access, versioning with lifecycle, and a rule that aborts incomplete multipart uploads."

> Senior tip: by default, enable versioning, Block Public Access and a lifecycle rule that aborts incomplete multipart uploads on every bucket. For client uploads, prefer a presigned POST whose POST policy carries {{content-length-range}}, because a presigned PUT cannot enforce a size range and someone can push a huge file through it.`,
    follow: [
      `Why should a presigned URL not have a long TTL?`,
      `What hidden cost appears when you enable versioning without lifecycle rules?`,
      `When is S3 Transfer Acceleration worth using?`
    ],
  },

  'aws-008': {
    q: `Compare SQS standard/FIFO, SNS, EventBridge, Kinesis and MSK. How do visibility timeout, DLQ and the "at least once" promise affect your design?`,
    a: `**Summary:** SQS is a point-to-point queue for workers; SNS is pub/sub fan-out; EventBridge is an event bus that routes by rule and integrates with SaaS; Kinesis is a stream for analytics and replay; MSK is managed Kafka. SQS standard is at-least-once, so consumers must be idempotent.

### Quick intuition
**SQS** is like the numbered-ticket queue at a bank: each ticket is served by exactly one counter, and the ticket is destroyed once the job is done. **SNS** is a loudspeaker: you say it once, everyone subscribed hears it, but nothing is recorded. **EventBridge** is a mail-sorting switchboard that reads the content: a "refund" letter goes to room A, a "new order" letter to room B. **Kinesis and MSK (Kafka)** are like a page-numbered ledger: many readers read independently, each remembers its own page, and anyone can go back to an old page. Because networks can drop mid-flight, these systems all choose "better delivered twice than lost" (**at-least-once**), so the receiver has to tolerate duplicates.

### Terms
- **Visibility timeout**: the period during which a message is hidden from other consumers after one consumer has received it.
- **Receipt handle**: the "receipt" returned when you receive a message, used to delete or extend exactly that delivery.
- **DLQ (dead-letter queue)**: a queue that holds messages which have failed more times than allowed.
- **maxReceiveCount**: the maximum number of receives in the redrive policy before a message is moved to the DLQ.
- **Long polling**: the consumer waits up to 20 seconds for a message instead of polling constantly and getting empty responses.
- **Poison message**: a message that makes the consumer fail every time, for example because it is malformed.
- **Idempotent**: processing one message several times gives the same result as processing it once.
- **Shard / partition**: the parallel unit of Kinesis/Kafka; ordering is only guaranteed inside one shard or partition.

### Step by step: the life of one SQS message
1. The producer calls SendMessage; SQS stores the message redundantly on several servers. Why duplicates are possible: in a distributed system, one copy sometimes has not yet learned that the message was deleted.
2. A consumer calls ReceiveMessage (long polling for 20 seconds), gets the message and its receipt handle; the message becomes **in-flight** and is hidden for the visibility timeout (say 60 seconds).
3. If processing finishes inside those 60 seconds, the consumer calls DeleteMessage with the receipt handle and the message disappears for good.
4. If the consumer dies, or 60 seconds pass without a delete, the message becomes visible again and ApproximateReceiveCount goes up by one, so another consumer can pick it up. Why: SQS does not know whether you processed it - it only knows you did not delete it.
5. Once the receive count passes maxReceiveCount (say 5), SQS moves the message to the DLQ, and an alarm on the DLQ wakes the on-call engineer.

~~~text
Send -> [Queue: visible] --Receive--> [in-flight, hidden 60 s] --Delete--> (gone)
               ^                                |
               +---- 60 s pass without Delete --+  receiveCount + 1
                     receiveCount > 5  ------->  [DLQ] -> alarm
Example: p99 processing = 20 s -> visibility 60-120 s.
Lambda reading SQS: AWS recommends visibility >= 6x the function timeout.
~~~

### Quick comparison
| Service | Model | Keeps the message | Replay | Throughput |
|---|---|---|---|---|
| SQS Standard | Queue | 4 days by default, up to 14 days | No | Very high, no ordering |
| SQS FIFO | Queue | Same as above | No | Limited per message group, ordered |
| SNS | Pub/sub | No (unless fanned out to SQS) | No | Very high |
| EventBridge | Event bus + rules | Archive can replay | Yes (from the archive) | High, flexible routing |
| Kinesis Data Streams | Stream | 24 hours by default, up to 365 days | Yes | Per shard |
| MSK (Kafka) | Distributed log | According to retention | Yes | Very high |

### SQS
- **Visibility timeout**: once a consumer receives a message, the message is hidden for this long. Finish early and delete it; fail to, and it reappears and may be processed a second time.
- Set the visibility timeout above the p99 processing time, but not so high that retries crawl. Long jobs can extend it with {{ChangeMessageVisibility}}.
- **Long polling** ({{WaitTimeSeconds}} set to 20) reduces empty receives and cost.
- **DLQ**: after {{maxReceiveCount}}, the message moves to the DLQ for investigation, so a poison message cannot loop forever.
- **FIFO**: {{MessageGroupId}} guarantees order inside a group, while {{MessageDeduplicationId}} blocks duplicates for 5 minutes. Throughput is lower than standard, and the group key must be fine-grained enough not to serialize everything.

### Fan-out
The common pattern is an SNS topic feeding many SQS queues (one per consumer). Then one event can be processed by several services independently, and each service keeps its own DLQ and retry policy.
EventBridge fits when you need to filter on event content ({{source}}, {{detail-type}}, {{detail}}) or receive events from SaaS products; a rule can target Lambda, SQS or Step Functions.

### At-least-once and idempotency
- SQS standard, SNS and Kinesis can all deliver duplicates. There is no true end-to-end exactly-once.
- Consumers must be idempotent: use a business key (orderId + eventType) with a dedup table, or a conditional upsert.
- Never assume ordering on a standard queue; if you need order per entity, use FIFO with {{MessageGroupId = entityId}}.

### Kinesis vs MSK
- Kinesis: fully managed, shard-based, built-in integration with Lambda/Firehose; good for telemetry, clickstream and simple ingestion.
- MSK: real Kafka, the right call when the team already runs Kafka, needs the Connect/Streams ecosystem, or has many complex consumers. It carries more operational weight (brokers, storage, monitoring).

### Common mistakes
- **Visibility timeout shorter than the processing time.** Symptom: the same message is processed by two consumers in parallel, creating duplicate records and extra DB load. How to avoid: set the timeout above the p99 processing time and extend it with {{ChangeMessageVisibility}} for long jobs.
- **No DLQ.** Symptom: a poison message retries forever, burning money and hiding the real error. How to avoid: a redrive policy with maxReceiveCount of 3-5, plus an alarm when the DLQ has messages.
- **Using SQS as an event log that needs replay.** Symptom: you want to reprocess last week's data, but the messages were deleted at ack time. How to avoid: choose Kinesis, Kafka/MSK or an EventBridge archive.
- **FIFO with a single message group.** Symptom: throughput collapses to one consumer and you lose all parallelism. How to avoid: split groups by aggregate id, for example {{MessageGroupId = orderId}}.

### One-minute spoken answer
"I tell them apart by model: SQS is a queue for workers, one message to one consumer; SNS is pub/sub fan-out, usually SNS into many SQS queues so every service has its own queue and DLQ; EventBridge is a bus that routes by event content; Kinesis and MSK are ordered logs per shard that keep data for replay. With SQS, a received message is hidden for the visibility timeout; delete it in time and it is done, otherwise it reappears and gets delivered again, and after maxReceiveCount it goes to the DLQ. That makes the system at-least-once, so consumers must be idempotent through a business key or a dedup table. When I need order per order, I use FIFO with the message group set to orderId. Every consumer I build has a DLQ, an alarm on the age of the oldest message, and an idempotency key."

> Senior tip: every SQS consumer should have a DLQ, an alarm on {{ApproximateNumberOfMessagesVisible}} and an idempotency key. During an incident the DLQ is the fastest place to answer "which message broke, and why".`,
    follow: [
      `How long should the visibility timeout be relative to processing time?`,
      `When would you choose Kinesis over Kafka/MSK?`,
      `How do you keep per-order processing order while still running in parallel?`
    ],
  },

  'aws-009': {
    q: `Design HA and DR: how is multi-AZ different from multi-region? What are RTO and RPO, and how do the DR strategies (backup, pilot light, warm standby, active-active) trade off?`,
    a: `**Summary:** multi-AZ protects you from losing one AZ inside the same region, usually automatically and with an RTO measured in minutes; multi-region protects you from losing a whole region, and is far more expensive and complex. RTO is how long you accept being down, RPO is how much data you accept losing. Pick the DR strategy from those two numbers, not from gut feeling.

### Quick intuition
**Multi-AZ** is a shop with two warehouses in two districts of the same city: if one burns, the other serves almost immediately. **Multi-region** is opening a branch in another city: it saves you when the whole city loses power, but it is expensive and hard to keep stock in sync. **RTO** is "how long until we can reopen", **RPO** is "how many minutes of the last ledger are we willing to lose". The DR strategies are the readiness levels of that backup branch: only photocopies of the paperwork (backup), a stocked warehouse but no staff (pilot light), a small branch already open (warm standby), or two shops selling at the same time (active-active).

### Terms
- **Region / AZ**: a region is a geographic area (for example ap-southeast-1) made of several AZs tens of kilometres apart, each with its own power and network.
- **Failover / failback**: moving the service onto the standby infrastructure / moving it back to the primary after the incident.
- **Asynchronous replication**: data is copied to the other site after it commits at the primary, so whatever was not copied yet can be lost.
- **Switchover**: a planned role change while the primary region is still alive, which loses no data.
- **Route 53 health check**: Route 53 calls the endpoint on a schedule; when it fails, the failover record points at the standby target.
- **DNS TTL**: how long clients and resolvers are allowed to cache a DNS record.
- **Last-writer-wins**: when two regions write the same item, the record with the later timestamp wins and overwrites the other.
- **Game day**: a planned incident drill on a real or staging system.

### Step by step: a warm standby failover to the secondary region
1. **Detect**: alarms and Route 53 health checks have seen the primary region fail for several minutes in a row. Why not switch immediately: you avoid failing over for a passing glitch, because a regional failover is very expensive.
2. **Decide**: the on-call engineer confirms against the runbook; many organizations require a manager to approve.
3. **Promote the database**: Aurora Global Database turns the secondary cluster into the writer. If the primary is still alive, use switchover (no data loss); if it is dead, use failover and lose whatever was not replicated, usually around 1 second.
4. **Scale the app**: raise the desired count in the secondary region from its small baseline to full capacity. Why this takes minutes: new tasks and JVMs have to boot.
5. **Shift traffic**: Route 53 points the record at the secondary region; clients see it once their DNS TTL expires.
6. **Verify and communicate**, then plan a controlled failback.

~~~text
t=0      primary region fails
t=3'     alarm + health check failing 3 times in a row
t=10'    on-call confirms, opens the runbook
t=12'    promote Aurora in the secondary region (~1 second of data lost = real RPO)
t=20'    ECS scales 2 -> 20 tasks
t=21'    Route 53 flips the record, TTL 60 s
t=23'    traffic served from the secondary region  => real RTO ~23 minutes
~~~

### Definitions
- **RTO** (Recovery Time Objective): the recovery-time target. An RTO of 15 minutes means the system must be running again within 15 minutes.
- **RPO** (Recovery Point Objective): the maximum data loss target. An RPO of 5 minutes means losing the last 5 minutes of data is acceptable.
- Both numbers are decided by the business; engineering only states what it costs to reach them.

### Multi-AZ inside one region
- RDS Multi-AZ, Aurora across AZs, an ALB spanning AZs, an ASG spanning AZs, S3 which is already multi-AZ.
- Handles: losing one AZ, DB failover, the load balancer moving traffic.
- Does not handle: losing the whole region, a widespread misconfiguration, an attack on the region's control plane.
- Cost: mostly doubled database infrastructure plus a few components; the app still scales normally.

### DR strategies
| Strategy | Description | Typical RTO | RPO | Cost |
|---|---|---|---|---|
| Backup & restore | Backups to another region only, rebuild when needed | Hours to days | Hours | Lowest |
| Pilot light | The core (DB, data) runs hot in the secondary region, the app is switched off | Tens of minutes to hours | Minutes | Low to medium |
| Warm standby | A scaled-down but complete copy running in the secondary region | Minutes | Seconds to minutes | Medium to high |
| Active-active | Both regions serve traffic | Close to 0 | Close to 0 | Highest |

### In practice
- **Aurora Global Database** replicates storage to the secondary region with an RPO of about 1 second, and the secondary can be promoted.
- **DynamoDB global tables** enable active-active, but you must accept last-writer-wins and reconcile conflicts in the application layer.
- **Route 53** failover routing with health checks, or latency routing for active-active.
- **S3 Cross-Region Replication** for objects; remember replication is asynchronous and deletions are not replicated unless you enable that.
- **Infrastructure as Code** must be able to build the secondary region from scratch; if any step is manual, DR does not really exist.
- Drill regularly (game day): switch regions for real, measure the real RTO, and write down the steps you were missing.

### Common mistakes
- **Having backups but never testing a restore.** Symptom: on the day you need it, the snapshot lacks the KMS permission in the secondary region, or the restore takes 6 hours instead of 1. How to avoid: restore automatically on a schedule and time it; an unverified backup is not a backup.
- **A long DNS TTL.** Symptom: the secondary region is ready but clients keep calling the old region for another tens of minutes. How to avoid: keep TTLs at 30-60 seconds for failover records.
- **A secondary region configured differently.** Symptom: only during failover do you discover missing IAM roles, secrets, security groups, or quotas that were never raised. How to avoid: build the secondary region entirely from IaC, check quotas periodically, and rehearse for real.
- **Active-active without partitioning data by region.** Symptom: write conflicts, data overwritten by last-writer-wins, and cross-region cost exploding. How to avoid: give each region ownership of a slice of the data (for example by customer), or choose warm standby instead.

### One-minute spoken answer
"Multi-AZ protects you from losing one datacenter inside a region, usually automatically and with an RTO in minutes; multi-region protects you from losing the whole region but is much more expensive and complex. I always start from two numbers the business signs off: RTO, how long the service may be down, and RPO, how much data may be lost. Then I pick the cheapest strategy that meets them: backup and restore measured in hours, pilot light keeping data hot in the secondary region, warm standby running a full but scaled-down copy, active-active with almost no interruption but requiring conflict handling for writes. Tool-wise I use Aurora Global Database with an RPO around one second, Route 53 failover, and IaC to build the secondary region. My experience is that DR only exists once you have drilled it and measured the real RTO."

> Senior tip: start from the RTO and RPO the business signs, then choose the cheapest strategy that satisfies them. Most systems do not need active-active; warm standby plus IaC plus a drill every 6 months is usually a much better balance than paying to run double infrastructure in parallel.`,
    follow: [
      `Why is a backup that has never been restored not really DR?`,
      `What RPO does Aurora Global Database give, and which steps does a failover involve?`,
      `In active-active, at which layer do you resolve write conflicts?`
    ],
  },

  'aws-010': {
    q: `Auto Scaling, ALB vs NLB, health checks and graceful shutdown: how do you make scale-in stop dropping requests?`,
    a: `**Summary:** ALB understands HTTP/HTTPS (path, host, header) and suits web APIs; NLB works at TCP/UDP, has very low latency and keeps a static IP. Auto Scaling adds and removes instances based on metrics, but scale-in is only safe when it is combined with the deregistration delay, correct health checks and graceful shutdown inside the application.

### Quick intuition
A load balancer is the host at the door of a restaurant, seating guests at tables (instances/tasks). **ALB** can read the order slip (HTTP: path, host, header), so it can send everyone asking for {{/payments}} to a dedicated area; **NLB** only counts the people walking through the door (TCP/UDP), but it is extremely fast and has a fixed address. **Auto Scaling** is the manager calling in more staff or sending some home as the crowd changes. Sending staff home properly (a safe scale-in) means: stop seating new guests at their tables, wait until they finish the tables they are serving, and only then let them leave - never pull someone away mid-plate.

### Terms
- **Target group**: the group of targets (instances, IPs, tasks) that a load balancer sends traffic to, together with its health check settings.
- **Deregistration delay (connection draining)**: the time during which the LB stops sending new requests but still waits for in-flight requests to finish.
- **SIGTERM / SIGKILL**: SIGTERM means "please stop" (the app gets to clean up); SIGKILL is an immediate forced stop.
- **Liveness / readiness**: liveness asks "does this need a restart", readiness asks "can this accept traffic"; Spring Boot Actuator ships {{/actuator/health/liveness}} and {{/actuator/health/readiness}}.
- **Target tracking**: a scaling policy that keeps one metric near a target value, for example CPU at 60 percent.
- **Cooldown**: the wait after each scaling action so the metric settles before the next decision.
- **Flapping**: scaling out and in over and over because the thresholds are too close together.
- **preStop hook**: a Kubernetes command that runs before SIGTERM is sent to the container.

### Step by step: ECS scales one task in behind an ALB
1. Auto Scaling sees CPU below target for long enough and lowers the desired count. Why this is slower than scale-out: the scale-in cooldown is deliberately longer to avoid flapping.
2. ECS picks a task and deregisters it from the target group. The ALB stops sending **new** requests and the target moves to the draining state.
3. ECS waits out the deregistration delay (say 30 seconds) so the in-flight requests can finish.
4. ECS sends SIGTERM. Spring Boot's graceful shutdown stops accepting requests, waits up to {{timeout-per-shutdown-phase}} for running ones, closes the pool and exits.
5. If the container has not exited after {{stopTimeout}} (30 seconds by default, up to 120 seconds on Fargate), ECS sends SIGKILL. Why the numbers must line up: SIGKILL cuts a request in half and the client sees a 502 or a connection reset.

~~~text
ECS + ALB (delay 30 s, stopTimeout 30 s, Spring timeout 20 s)
t=0      deregister -> ALB stops sending new requests
t=0-30s  in-flight requests finish (draining)
t=30s    SIGTERM -> Spring refuses new requests, waits <= 20 s for running ones
t=31s    app exits cleanly             (SIGKILL if still alive at t=60 s)
Kubernetes: SIGTERM and removal from the endpoint happen AT THE SAME TIME
  -> preStop sleep 5-10 s so the LB drops the pod before the app stops accepting
~~~

### ALB vs NLB
| Criteria | ALB | NLB |
|---|---|---|
| Layer | L7 (HTTP/HTTPS, gRPC) | L4 (TCP/UDP/TLS) |
| Routing | Host, path, header, method | Only by port/protocol |
| Static IP | No (uses DNS) | Yes, supports Elastic IP |
| WebSocket | Yes | Yes, at the TCP layer |
| Latency | Slightly higher | Very low |
| When to use | Web/API, path-based microservices | Database proxy, IoT, games, static IP or very high throughput |

ALB fits most Spring Boot backends. NLB is the usual choice when a partner needs a static IP to whitelist, when you run Kafka or a database proxy, or when you need millions of concurrent connections.

### Health check
- The ALB health check calls a light endpoint, for example {{/health}}, which returns 200 when the app is ready to take traffic.
- Never make the health check depend hard on the database: a momentary DB slowdown marks the whole fleet unhealthy and pulls it out of the LB, turning a small incident into a total outage.
- The opposite mistake is a check so loose that traffic reaches an instance that is already broken.
- Separate **liveness** (should this be restarted) from **readiness** (should this receive traffic). On ECS/K8s, readiness is the one that matters.

~~~yaml
HealthCheckPath: /health/ready
HealthCheckIntervalSeconds: 15
HealthCheckTimeoutSeconds: 5
HealthyThresholdCount: 2
UnhealthyThresholdCount: 3
~~~

### Graceful shutdown
- During scale-in, ECS/K8s sends a stop signal; the app must stop accepting new requests, finish the running ones, close its pools and then exit.
- Spring Boot: enable {{server.shutdown=graceful}} (the default from Boot 3.4) and set {{spring.lifecycle.timeout-per-shutdown-phase=30s}}.
- On ECS set {{stopTimeout}} large enough; on Kubernetes set {{terminationGracePeriodSeconds}} and a {{preStop}} sleep so the LB has time to deregister the pod.
- The target group's **deregistration delay** (300 seconds by default) is the draining window for in-flight requests. On ECS the task is deregistered and waits out the delay before receiving SIGTERM, so 300 seconds only makes deploys and scale-ins slow. On Kubernetes the pod receives SIGTERM at the same moment it is removed from the LB, so you need a {{preStop}} sleep of a few seconds so it does not receive a new request while shutting down. In practice people set 20-60 seconds and raise it for long requests.

### Auto Scaling
- Target tracking is the easiest: hold CPU around 60-70 percent, or ALB {{RequestCountPerTarget}}, or a custom metric such as queue depth.
- Scale out fast (short cooldown) and scale in slowly (long cooldown) to avoid flapping.
- For a predictable schedule, use scheduled scaling. For sudden spikes, use a warm pool or keep a large enough minimum capacity.
- **Do not scale on memory** when memory does not track load; prefer a metric that reflects real load (RPS, queue depth).

### Common mistakes
- **The connection pool multiplies with the instance count.** Symptom: scaling from 5 to 50 instances exhausts {{max_connections}} and the database refuses connections exactly when traffic peaks. How to avoid: a small pool (10-20), RDS Proxy or PgBouncer, and an ASG max capacity sized to what the database can take.
- **The health check calls an endpoint with a heavy DB query.** Symptom: the check generates its own load, and a momentary DB slowdown marks the whole fleet unhealthy. How to avoid: keep readiness light, check only what the app truly needs, and do not depend hard on the database.
- **Scaling the app without scaling what sits behind it.** Symptom: SQS consumers go up 10x but the database locks up and everything gets slower than before. How to avoid: cap consumer concurrency and scale to the capacity of the slowest tier.
- **Forgetting connection draining and graceful shutdown on deploy.** Symptom: users see a scatter of 502s on every deploy or scale-in. How to avoid: {{server.shutdown=graceful}}, a deregistration delay of 20-60 seconds, and a stopTimeout larger than Spring's shutdown timeout.

### One-minute spoken answer
"An ALB is a layer-7 load balancer: it understands HTTP, so it routes by path, host and header, which suits a Spring Boot API. An NLB is layer 4: very low latency, with a static IP, which suits a partner that needs to whitelist addresses or a protocol that is not HTTP. For Auto Scaling I use target tracking on CPU or requests per target, scaling out fast and in slowly. To scale in without dropping requests, three things must line up: the target group's deregistration delay so the LB stops sending new requests and waits for the old ones, graceful shutdown in Spring Boot so the app finishes what it has when SIGTERM arrives, and a stopTimeout on ECS or terminationGracePeriod on Kubernetes long enough before SIGKILL; on Kubernetes I also add a preStop sleep of a few seconds. The health check stays light and does not depend hard on the database. I always verify by lowering the desired count while under load and watching for 5xx."

> Senior tip: always test scale-in by lowering the desired count while firing load at the service. If you see a scatter of 5xx errors while scaling, the cause is almost certainly the deregistration delay and graceful shutdown not lining up - not your business logic.`,
    follow: [
      `Why can a health check that depends on the database take down the whole system?`,
      `How long should the deregistration delay be compared with request processing time?`,
      `When would you choose NLB over ALB?`
    ],
  },

  'aws-011': {
    q: `What problems is ElastiCache Redis for? Cluster mode, eviction policies, and which failures show up on production?`,
    a: `**Summary:** Redis is an in-memory store used for caching, sessions, rate limiting, distributed locks and leaderboards. ElastiCache is the managed version (the Redis OSS engine, or Valkey, an open-source Redis-compatible fork that costs less). Cluster mode shards the data so you can go past one node's memory and throughput; the eviction policy decides what Redis throws away when memory is full.

### Quick intuition
Redis is the desk right next to you; the database is the filing room in the basement: grabbing a folder from the desk takes under a millisecond, going down to the basement takes much longer. Because the desk is small (RAM is expensive) you keep only the folders you use often, and when the desk is full you must decide what to throw out - that is **eviction**. **Cluster mode** is pushing several desks together, each holding a slice of the folders according to a fixed rule (the hash slot). **ElastiCache** is "rent a desk that someone else dusts": AWS handles installation, replicas, failover and patching.

### Terms
- **TTL**: the lifetime of a key; when it expires, Redis deletes it on its own.
- **Cache-aside**: the app reads the cache itself, and on a miss reads the DB and then writes into the cache.
- **Hash slot**: Redis Cluster divides the key space into 16,384 slots using CRC16(key) mod 16384; each shard owns a range of slots.
- **Hash tag**: the part of a key name inside curly braces; only that part is hashed, so several keys can be forced into the same slot.
- **Replica / failover**: a copy of the primary; when the primary dies, a replica is promoted to take its place.
- **maxmemory / eviction policy**: the memory ceiling and the rule for choosing which keys to remove when you hit it.
- **LRU / LFU**: evict the key used least recently / evict the key used least often.
- **Valkey**: the open-source fork of Redis, protocol compatible, supported by ElastiCache at a lower price.

### Step by step: cache-aside for a product page
1. The app calls {{GET product:42}}. On a hit it answers immediately (about 1 ms). Why so fast: the data is in RAM, inside the same VPC as the app.
2. On a miss it queries the database (about 20 ms).
3. It writes back {{SET product:42 <json> EX 300}}, a 5-minute TTL plus a few dozen seconds of random jitter. Why a TTL at all: it bounds how long stale data can live; why jitter: it stops a whole batch of keys expiring at the same instant.
4. When the product changes: write the DB first and then **delete** the key (DEL) instead of overwriting it. Why: the next read loads the new version itself, avoiding a race where two writers overwrite a newer value with an older one.
5. In cluster mode the client hashes the key to a slot and sends it straight to the shard owning that slot; when the slot map changes (failover, resharding) the shard answers MOVED and the client refreshes its map.

~~~text
1,000 requests/s reading products, DB 20 ms, Redis 1 ms, hit rate 95%
  No cache  : 1,000 queries/s to the DB
  With cache: 50 queries/s to the DB
              average latency = 0.95 x 1 + 0.05 x (1 + 20) ~ 2 ms
Cluster with 3 shards:
  slot 0-5460 -> shard 1 | 5461-10922 -> shard 2 | 10923-16383 -> shard 3
~~~

### Use cases
- **Cache-aside**: the app reads Redis first, on a miss reads the DB and writes back with a TTL. The most common pattern, easy to follow, easy to get wrong when the TTL is wrong.
- **Session store**: sessions shared across instances, with a TTL matching how long a login lasts.
- **Rate limiting**: INCR plus EXPIRE, or a Lua script to make the pair atomic.
- **Distributed lock**: Redisson or SET NX PX; beware of split-brain and of how long the lock is held.
- **Leaderboard / lightweight queue**: sorted sets, lists.

### Cluster mode
- **Disabled**: one primary plus a replica, all data in one shard. Simple, fine for a medium data set.
- **Enabled**: data is split by hash slot (16,384 slots) across several shards, each with replicas. Memory and throughput grow horizontally.
- Cluster mode needs a cluster-aware client (Lettuce has it, Jedis has it). Some multi-key commands only work when the keys share a slot, so use a hash tag: put the shared part (for example the user prefix) inside curly braces at the start of the key.
- It does **not** reshard fully transparently when you add nodes; you need an online reshard and correctly configured clients.

### Eviction
When {{maxmemory}} is reached, the policy decides:
| Policy | Behavior |
|---|---|
| noeviction | Reject writes and return an OOM error (the default of self-installed Redis OSS; the default ElastiCache parameter group uses volatile-lru) |
| allkeys-lru | Remove the least recently used key, across all keys |
| volatile-lru | Only delete keys that have a TTL |
| allkeys-lfu | Remove the least frequently used key |
| volatile-ttl | Delete the keys closest to expiry |

For a pure cache, {{allkeys-lru}} or {{allkeys-lfu}} is usually right. If Redis both caches and holds data you must not lose (locks, sessions), use {{volatile-*}} and make sure important keys carry no TTL - but the better answer is to split them into separate clusters.

### Common mistakes
- **Cache stampede.** Symptom: one hot key expires, thousands of requests miss at once and all slam the DB, which collapses. How to avoid: a mutex/lock around the rebuild, TTL jitter, or refreshing before expiry.
- **Big keys and hot keys.** Symptom: a key holding hundreds of thousands of elements blocks Redis while it is touched; a single key taking most of the traffic bottlenecks one shard even though the cluster is idle. How to avoid: split big keys; for hot keys add a local cache (Caffeine) or replicate the key.
- **Running {{KEYS *}} on production.** Symptom: single-threaded Redis blocks completely and every request times out. How to avoid: use {{SCAN}} in batches.
- **Never setting a TTL.** Symptom: memory fills up gradually and eviction starts throwing away important data. How to avoid: every cache key gets a TTL, and you watch memory and the Evictions metric.
- **Treating Redis as a durable database.** Symptom: losing a node loses data that was not persisted. How to avoid: backup/AOF is not a substitute for a transactional DB; the source of truth must live in the DB.

### One-minute spoken answer
"Redis is an in-RAM data store; I use it for caching, sessions, rate limiting, distributed locks and leaderboards, and on AWS I run ElastiCache with the Redis OSS or Valkey engine. The most common pattern is cache-aside: read the cache, on a miss read the DB and write back with a jittered TTL, and on updates write the DB then delete the key. When data or throughput outgrows one node I turn on cluster mode: keys are hashed into 16,384 hash slots spread over several shards, at the cost that multi-key commands need the keys in the same slot, which is what hash tags are for. When memory fills up the eviction policy decides: allkeys-lru or allkeys-lfu for a pure cache, and data that must not be lost belongs in a separate cluster. My habit is to answer three questions up front: what is the TTL, when is it invalidated, and how does the app survive Redis dying."

> Senior tip: every cache must be able to answer three questions: what is the TTL, when is it invalidated, and what happens when Redis dies. If the app cannot survive Redis being down, it is no longer a cache but a required dependency - design it for HA and give it a fallback.`,
    follow: [
      `What is cache stampede, and which techniques prevent it?`,
      `Why is running KEYS on production so dangerous?`,
      `When should you enable cluster mode instead of buying a bigger instance?`
    ],
  }
});
