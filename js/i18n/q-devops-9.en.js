/*
 * English translation of js/data/q-devops.js — task T669. Format: js/core/i18n.js (content overlay).
 * ids: devops-049 devops-051 devops-052
 */
App.i18n.content({
  'devops-049': {
    q: 'You split one monolithic Terraform file (more than 200 resources, a single state) into several modules and several states, one per service. How do you refactor without deleting/recreating resources on the cloud? Explain the {{moved}} block, {{terraform state mv/rm}}, and how to use {{terraform_remote_state}} to share outputs between states.',
    a: `**Summary:** When you change the structure of Terraform code (rename a resource, move it into a module, split the state), the address of that resource inside the state changes. If you only edit the code, Terraform sees "the old address disappeared, a new address appeared" and will plan a **destroy + create** — a disaster for an RDS or a load balancer that is already serving traffic. The fix: use a {{moved}} block (Terraform 1.1+) to declare right in the code "this resource moved from address A to B", or use {{terraform state mv}} to edit the state by hand. When you split into separate state files, use the {{terraform_remote_state}} data source so that state A can read the outputs of state B.

### Background terms (explained from scratch)

- **State**: a JSON file (usually kept on S3) that acts as the "ledger" recording which real resource on AWS each resource in your code corresponds to (its ID, its attributes). Terraform uses it to compute the diff.
- **Resource address**: the identifying name inside the state, for example {{aws_db_instance.main}} or {{module.payment.aws_db_instance.main}}. Change the address and Terraform believes it is a different resource.
- **Module**: a reusable group of resources, called like a function. Putting a resource into a module changes its address (it gains the prefix {{module.<name>.}}).
- **Monolith state**: every resource of every service lives in one single state file. {{terraform plan}} must refresh all of them → slow, easy to conflict, and a large blast radius (a mistake in one place affects everything).
- **Refactor**: changing how the code is organized without changing the behavior or the real resources. With Terraform, refactoring the code without refactoring the state = destruction.

### A real-life analogy

It is like renumbering the rooms of a building. Room "101" now belongs to "Floor 1, zone A", so it is renamed "A-101". If you only stick the new plate on the door and forget to update the building blueprint (the state), the security guard (Terraform) concludes that room 101 was demolished and a brand-new A-101 must be built — while people are still living inside it.

### The problem: refactoring causes destroy/create

~~~hcl
# BEFORE: the resource sits at the root
resource "aws_s3_bucket" "logs" {
  bucket = "myapp-logs-prod"
}

# AFTER: moved into a module
module "storage" {
  source = "./modules/storage"
}
# Inside modules/storage/main.tf:
# resource "aws_s3_bucket" "logs" { bucket = "myapp-logs-prod" }
~~~

Run {{terraform plan}} after editing the code: Terraform sees that {{aws_s3_bucket.logs}} (the old address) is no longer in the code → it plans **destroy**. It sees that {{module.storage.aws_s3_bucket.logs}} (the new address) is not in the state yet → it plans **create**. A S3 bucket holding data gets deleted!

### Option 1: the {{moved}} block (recommended, Terraform 1.1+)

Declare the old address → new address mapping directly in the code. Terraform updates the state automatically when you run {{plan/apply}}.

~~~hcl
# Put it in the root module, commit it together with the refactor
moved {
  from = aws_s3_bucket.logs
  to   = module.storage.aws_s3_bucket.logs
}

# You can chain several refactor steps
moved {
  from = module.storage.aws_s3_bucket.logs
  to   = module.storage.aws_s3_bucket.app_logs
}
~~~

- **Pros**: reviewable in a PR (everyone sees the mapping), safe (Terraform validates it), and it works with remote state and team workflows. Once the apply is done, the {{moved}} block can be kept (it is harmless) or gradually removed.
- **Notes**: {{from}} and {{to}} must be of the same resource type. {{moved}} blocks work both for a single resource address and for addresses inside a module (you only need the old → new mapping to be correct).

### Option 2: {{terraform state mv}} (manual)

Edits the state directly. Use it when you need a quick operation or when you are stuck on an older Terraform version.

~~~bash
# Move a resource into a module
terraform state mv aws_s3_bucket.logs module.storage.aws_s3_bucket.logs

# Move a whole module
terraform state mv module.old_name module.new_name

# ALWAYS run plan afterwards to confirm "No changes"
terraform plan
~~~

- **Risk**: you are operating directly on the state (a remote state in particular). Forget to run it against the right workspace/state, or two people do it at the same time → corrupted state. When splitting a state, prefer {{-state-out}} to write the moved resources into their own file.
- **Backup**: with an S3 backend that has versioning you can roll back; but the safest habit is {{terraform state pull > backup.tfstate}} first.

### Option 3: {{terraform state rm}} + {{import}} block (when splitting a state)

When you move a group of resources into a **completely new state file** (for example, splitting networking into its own state):

~~~bash
# In the OLD state: remove the resource from the state (does NOT delete it on the cloud)
terraform state rm aws_vpc.main
terraform state rm aws_subnet.private[0]
# ... repeat for the related resources

# In the NEW state (its own folder/config, a different backend key):
# Use an import block (Terraform 1.5+) — declared in code, so it is reviewable
~~~

~~~hcl
# networking/imports.tf (the new state)
import {
  to = aws_vpc.main
  id = "vpc-0a1b2c3d4e5f67890"   # the real ID on AWS
}

import {
  to = aws_subnet.private[0]
  id = "subnet-0123456789abcdef0"
}
~~~

Run {{terraform plan}} → Terraform generates an import action (no create, no destroy). After {{apply}}, delete the {{import}} blocks.

### Splitting states and sharing data: {{terraform_remote_state}}

When networking, database and application live in 3 separate states, the app still needs to know the VPC ID and the DB endpoint. Use an **output** in the source state and a **data source** in the consuming state.

~~~hcl
# State networking/outputs.tf
output "vpc_id" {
  value = aws_vpc.main.id
}
output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

# State application/main.tf — reads outputs from networking
data "terraform_remote_state" "networking" {
  backend = "s3"
  config = {
    bucket = "mycompany-tfstate-prod"
    key    = "networking/prod/terraform.tfstate"
    region = "ap-southeast-1"
  }
}

resource "aws_ecs_service" "app" {
  # ...
  network_configuration {
    subnets = data.terraform_remote_state.networking.outputs.private_subnet_ids
  }
}
~~~

- **Constraint**: the consuming state must have permission to read the source state (an IAM policy on the S3 key). When an output changes → consumers must {{plan/apply}} again.
- **Alternative**: use SSM Parameter Store / a direct data source ({{data "aws_vpc"}}) to reduce coupling between states, but you lose the explicit "contract" that outputs give you.

### State splitting strategies (shrinking the blast radius)

| Split by | Example | Pros | Cons |
|---|---|---|---|
| Environment | one state each for prod/staging/dev | Safe, prod is not affected by dev | Config duplication (use a shared module) |
| Component | networking, data, compute, app | Small blast radius, each team owns its part | Needs {{remote_state}} wiring |
| Lifecycle | long-lived resources (VPC, RDS) vs short-lived (ECS tasks) | Less risk when deploying the app | Requires a clear classification |
| Monolith | 1 state for everything | Simple at the start | Slow plans, lock conflicts, one mistake affects all |

### Real-world traps

- **A refactor with no {{moved}} block in the PR**: the reviewer cannot see the mapping, the CI plan shows a huge destroy/create, somebody approves in a hurry → data loss. Rule: a Terraform refactor PR must carry the {{moved}} blocks or a clear description of the {{state mv}} commands that were run.
- **{{terraform state rm}} by mistake**: removing a resource from the state does not delete it on the cloud, but on the next plan Terraform wants to **recreate** it (because the code still declares it) → name/ID conflict. Always {{plan}} right after {{state mv/rm}}.
- **Splitting the state but forgetting to import**: you create the new state with the copied code and apply → Terraform creates a resource with the same name → an "already exists" error, or worse, a second copy of the resource.
- **{{terraform_remote_state}} reading a state that has no output yet**: the consumer plan fails. Enforce the apply order: networking first, app second. Enforce it indirectly through CI pipeline ordering.
- **Count/for_each index changes**: switching from {{count}} to {{for_each}}, or changing a key, also changes the address → you need a {{moved}} block for each element. This is the most common source of surprise destroy/create.

> Senior tip: Make it a team rule — "every resource address change must come with a {{moved}} block in the same PR, and CI must fail if the plan contains a destroy on a resource tagged {{prevent_destroy}} or on any database/storage". For a monolith state above 100 resources, split by lifecycle first (networking + data layer separate, app layer separate) — that is where the blast radius shrinks the most for the least effort.`,
    follow: [
      'You are changing a resource from {{count}} to {{for_each}}. Write the {{moved}} block that maps {{aws_subnet.private[0]}} to {{aws_subnet.private["ap-southeast-1a"]}} and explain why skipping it destroys the subnet.',
      'When do you choose {{terraform_remote_state}} over a direct {{data}} source (for example {{data "aws_vpc"}}) to read information from another stack? What is the trade-off in coupling and reliability?',
      'The state got corrupted after a {{state mv}} that failed halfway, on a local backend. The S3 backend has versioning. How do you recover, and how do you prevent a repeat?'
    ],
  },
  'devops-051': {
    q: 'Your system has 20 Java microservices sending metrics, traces and logs. Observability cost has tripled in 6 months. How do you design the OpenTelemetry Collector pipeline (receivers, processors, exporters) to cut cost while keeping the data that matters? Explain tail-based sampling and its trade-offs.',
    a: `**Summary:** **OpenTelemetry Collector** (OTel Collector, or otelcol) is a telemetry "sorting station": it receives observability data (metrics, traces, logs) from the applications, processes it (filter, batch, sample, mask sensitive data), then exports it to backends (Prometheus, Tempo, Loki, Datadog...). The pipeline architecture has 3 parts: **receivers** (take data in), **processors** (transform it along the way), **exporters** (send it out). To cut cost without losing the signals that matter, use **tail-based sampling** (decide to keep or drop a trace only after seeing the whole trace — keep 100% of error and slow traces, randomly sample the rest), combined with dropping worthless spans (health checks, static assets) and controlling metric cardinality.

### Background terms

- **Telemetry**: the 3 main kinds — **metrics** (numbers measured over time, cheap, e.g. requests/s, CPU%), **traces** (the recorded path of one request through many services), **logs** (detailed records of individual events).
- **OpenTelemetry (OTel)**: an open standard (spec + SDK + tooling) for collecting telemetry. It replaces the old one-off SDKs (Jaeger client, Zipkin, vendor agents).
- **OTel Collector**: an intermediary process (running as a DaemonSet, a sidecar, or its own Deployment) that receives telemetry over OTLP (OpenTelemetry Protocol) or other protocols, processes it, and forwards it.
- **Pipeline**: the processing chain inside a Collector — data flows receiver → processor(s) → exporter. One Collector can run several pipelines (separate ones for traces, metrics and logs).
- **Sampling**: keeping only a fraction of the traces to cut storage and processing cost. **Head-based**: decide as soon as the trace starts (cheap, simple, but you can miss the traces that turned out to be errors). **Tail-based**: decide after the trace completes (keeps error/slow traces, but costs RAM and is more complex).
- **Cardinality**: the number of distinct time series a metric has. Tagging {{userId}} with 1 million users = 1 million series → Prometheus/TSDB overloaded and expensive.

### A real-life analogy

The OTel Collector is like a central parcel sorting hub. **Receivers** are the intake doors fed by different sources (post office, trucks, couriers). **Processors** are the sorting line: merge small parcels into batches, throw away junk mail and ads (filter), check which package matters and keep it intact — a package with a complaint filed against it (an error trace) is always kept, a normal one is kept only 10% of the time (sampling). **Exporters** are the trucks to the different warehouses (long-term storage, fast lookup, analytics).

### Pipeline structure

~~~yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317    # apps send traces/metrics/logs over gRPC
      http:
        endpoint: 0.0.0.0:4318    # or over HTTP

processors:
  memory_limiter:                   # PROTECTION: keep the Collector from OOMing
    check_interval: 5s
    limit_mib: 1500
    spike_limit_mib: 500

  batch:                            # BATCHING: fewer requests toward the backend
    send_batch_size: 1024
    timeout: 5s

  attributes:                       # MASK SENSITIVE DATA
    actions:
      - key: http.request.header.authorization
        action: delete
      - key: db.statement
        action: hash              # hash the SQL instead of sending it verbatim

  filter/traces:                    # FILTERING: drop spans with no value
    traces:
      span:
        - 'attributes["http.route"] == "/actuator/health"'
        - 'attributes["http.route"] == "/actuator/prometheus"'
        - 'attributes["url.path"] == "/favicon.ico"'

  tail_sampling:                    # SMART SAMPLING
    decision_wait: 30s            # wait 30s to collect every span of the trace
    num_traces: 100000            # max traces held in the buffer awaiting a decision
    policies:
      - name: errors
        type: status_code
        status_code: { status_codes: [ERROR] }
      - name: slow
        type: latency
        latency: { threshold_ms: 2000 }
      - name: baseline
        type: probabilistic
        probabilistic: { sampling_percentage: 10 }

exporters:
  otlp/tempo:
    endpoint: tempo.monitoring.svc:4317
    tls: { insecure: true }
  prometheusremotewrite:
    endpoint: http://mimir.monitoring.svc/api/v1/push
  loki:
    endpoint: http://loki.monitoring.svc/loki/api/v1/push

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, filter/traces, tail_sampling, batch]
      exporters: [otlp/tempo]
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [prometheusremotewrite]
    logs:
      receivers: [otlp]
      processors: [memory_limiter, attributes, batch]
      exporters: [loki]
~~~

### Tail-based sampling: how it works and its trade-off

~~~seq
title: Tail-based sampling decides whether to keep a trace
actors: Service A | Service B | OTel Collector | Tempo
Service A -> OTel Collector: Span 1 (root, HTTP 200, 50ms)
Service B -> OTel Collector: Span 2 (child, DB query, 30ms)
Service A -> OTel Collector: Span 3 (HTTP 500, 2100ms)
OTel Collector -> OTel Collector: Wait out decision_wait (30s)
OTel Collector -> OTel Collector: Trace has an error and is slow → policy match
OTel Collector -> Tempo: Send the whole trace (3 spans)
~~~

**How it works**: the Collector groups all spans with the same {{traceId}} into a buffer, waits {{decision_wait}} seconds (long enough for the span from the slowest service to arrive), then applies the policies in order. A trace matching any "keep" policy (error, slow) → kept in full. No match → it falls through to the {{probabilistic}} policy (10%).

**Trade-off**:

| Aspect | Head-based sampling | Tail-based sampling |
|---|---|---|
| Decision point | At the very first span | Once all spans are in (wait 30s+) |
| Error/slow traces | Can be missed | Kept 100% (if the policy is right) |
| Collector resources | Low (no buffer needed) | High (RAM for the {{num_traces}} buffer) |
| Complexity | Simple, configured in the SDK | Needs a central, stateful Collector |
| Load balancing | Not needed | **Mandatory**: all spans of one traceId must reach the same Collector instance |

### The load balancing problem with tail sampling

A trace crosses many services → the spans of one trace arrive from many different Pods. If the Collector runs as several replicas (a Deployment), spans of the same trace can land on different replicas → each replica sees only part of the trace and decides wrongly. The fix: put a **load balancing exporter** (the OTel Collector {{loadbalancing}} exporter) in the first tier and route by the hash of {{traceId}}, so that the same trace always goes to the same Collector instance.

~~~yaml
# Tier-1 collector (DaemonSet, receives from apps): only routes
exporters:
  loadbalancing:
    routing_key: "traceID"
    protocol:
      otlp: { tls: { insecure: true } }
    resolver:
      dns:
        hostname: otel-collector-sampling.monitoring.svc
# Tier-2 collector (StatefulSet/Deployment, runs tail_sampling): does the processing
~~~

### Cutting metric cost

- **Drop unused metrics**: the {{filter/metrics}} processor removes metrics that no dashboard or alert queries.
- **Cut cardinality**: never use {{userId}}, {{requestId}}, or a real URL containing path params (e.g. {{/orders/12345}}) as a label. Use {{http.route}} with the template (e.g. {{/orders/:id}} or the framework route pattern). Configure it in the SDK (Micrometer {{MeterFilter}}) **and** in the Collector (the {{attributes}} processor) — two layers of defense.
- **Lower the scrape/export frequency**: a metric that barely changes (JVM version info) does not need to be exported every 15s.

### Real-world traps

- **{{decision_wait}} too short**: the trace crosses 5 services and the last one is slow → its span arrives after the Collector has already decided to drop the trace → span lost. Set {{decision_wait}} ≥ the end-to-end p99 latency of your slowest flow.
- **{{num_traces}} buffer too small**: at peak traffic the buffer fills up → the Collector drops new traces (or decides early) → you lose data exactly when you need it most. Watch the "dropped too early / early decisions" metrics of the {{tail_sampling}} processor (the metric name can differ across Collector versions; enable the internal telemetry of the Collector to see them).
- **Tail sampling without a load balancing exporter**: you run 3 Collector replicas, traces get fragmented → the "errors" policy never sees the error span (it sits on another replica) → error traces get dropped. This is the most common misconfiguration.
- **{{memory_limiter}} placed after {{tail_sampling}}**: the tail sampling buffer eats RAM first, memory_limiter cannot react in time → the Collector OOMs. **memory_limiter must be the first processor** in the pipeline.
- **Filtering health checks in the SDK but forgetting the Collector**: some other service (not Java, not on the shared SDK) keeps sending health spans → you keep paying for them. Filtering in the Collector is the common safety net.

> Senior tip: Start with **head-based 10% + keep 100% of errors** in the SDK (simple, no extra infrastructure). Move to tail sampling only when cost is still high or you need "keep the slow traces" to be accurate — and then invest properly: 2 Collector tiers (routing gateway + stateful sampler), monitoring of buffer/drop metrics, and testing with real traffic. Operating tail sampling (RAM, complexity) sometimes costs more than the money it saves on a small system; with 20 Java services at moderate traffic, head-based sampling plus a health check filter usually already cuts trace cost by 60–80%.`,
    follow: [
      'Why must {{memory_limiter}} be first in the processors list? What happens if you place it after {{tail_sampling}} and {{batch}}?',
      'Service A calls B calls C. The error span occurs in C, last in the chain, but {{decision_wait}} expires before the span from C reaches the Collector. Is the trace kept? What would you configure to reduce this risk?',
      'Compare cost and complexity between: (1) head-based 5% in every SDK, (2) tail sampling centralized in the Collector, (3) sending 100% of traces to a backend that has built-in sampling (Jaeger/Tempo). When do you pick which option?'
    ],
  },
  'devops-052': {
    q: 'Your team deploys with GitOps (Argo CD), but database passwords and API keys must not be committed to Git. Compare Sealed Secrets, External Secrets Operator and SOPS: how does each one work, when do you choose which, and what are the risks during rotation?',
    a: `**Summary:** In GitOps, Git is the "source of truth" for everything — but secrets (passwords, API keys, certificates) must not be stored as plaintext in Git. The three common answers: **Sealed Secrets** encrypts the secret with the public key of a controller running inside the cluster and commits the encrypted result to Git (Git holds safe ciphertext); **SOPS** encrypts the sensitive fields inside a YAML file with a key from KMS/age/PGP, and that file is also committed to Git; **External Secrets Operator (ESO)** keeps no secret in Git at all, only a **reference** pointing to an external secret manager (AWS Secrets Manager, Vault, GCP Secret Manager), and ESO syncs the real value into a Kubernetes Secret. Choose based on: who manages the secret, how often you rotate, what audit requires, and how much operational complexity you are willing to run.

### Background terms

- **Secret**: sensitive information such as a DB password, an API key, a TLS private key. In Kubernetes, a {{Secret}} is a resource stored as base64 (that is encoding, **not** encryption) — anyone with read permission on {{Secret}} in the namespace sees the plaintext.
- **GitOps**: an operating model in which every piece of configuration (Deployment, Service, ConfigMap, Secret...) is declared in Git and an agent (Argo CD, Flux) continuously syncs Git → cluster. Git = the single source of truth.
- **Asymmetric encryption**: uses a key pair — a **public key** to encrypt (everyone may hold it) and a **private key** to decrypt (only the controller/owner holds it). Sealed Secrets works this way.
- **Symmetric encryption / envelope encryption**: a key encrypts the data, and that key is itself protected by another key (a KMS key). SOPS uses envelope encryption.
- **Secret manager**: a service purpose-built for storing secrets (AWS Secrets Manager, HashiCorp Vault, Azure Key Vault). It gives you: encrypted storage, access control, audit logs, automatic rotation.
- **Rotation**: changing a password/key periodically, or when a leak is suspected. The challenge: update the value at the source, propagate it down to the cluster, and make the application pick up the new value.

### A real-life analogy

Think of office key management. **Sealed Secrets**: you put the key inside a locked box (encrypted with a public key), label it and leave it on the reception desk (committed to Git) — everybody sees the box, but only the person holding the box key (the controller in the cluster) can open it. **SOPS**: you write the whole key list in a notebook but encrypt each sensitive line with the company safe code (a KMS key) — the notebook stays on the desk, you can read its structure but not the sensitive content. **External Secrets Operator**: the notebook on the desk only says "key to room A: see slot 5 in the bank safe" (a reference) — an employee (ESO) goes and fetches the real key from the safe (the secret manager) whenever it is needed.

### Option 1: Sealed Secrets (Bitnami)

~~~seq
title: Sealed Secrets — encrypt locally, decrypt inside the cluster
actors: Developer | Git Repo | Argo CD | SealedSecret Controller | K8s Secret
Developer -> Developer: kubeseal --cert pub.pem < secret.yaml > sealed.yaml
Developer -> Git Repo: Commit sealed.yaml (safe ciphertext)
Argo CD -> SealedSecret Controller: Sync the SealedSecret CRD into the cluster
SealedSecret Controller -> K8s Secret: Decrypt with the private key → create the Secret
~~~

~~~yaml
# sealed-secret.yaml — safe to commit to Git
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: db-credentials
  namespace: app
spec:
  encryptedData:
    password: AgBy3i4OJSWK+PiTySYZZA9rO43cGDEq...  # ciphertext
    username: AgCtr8jKL...                            # ciphertext
~~~

- **Pros**: simple, no external infrastructure. Git contains everything (including the encrypted secret) → pure GitOps. Fits small teams with few clusters.
- **Cons**: rotation is hard — changing a password means creating a new SealedSecret, committing it, and waiting for Argo to sync. **Losing the private key of the controller** (no key backup in disaster recovery) = nothing can be decrypted → every SealedSecret has to be recreated. Weak audit (you cannot tell who read which secret and when). The default scope is tied to namespace/name — renaming or moving the namespace requires re-sealing.

### Option 2: SOPS (Mozilla, now CNCF)

~~~yaml
# secret.enc.yaml — encrypted with SOPS + AWS KMS
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
stringData:
  username: ENC[AES256_GCM,data:abc123==,iv:...,tag:...,type:str]
  password: ENC[AES256_GCM,data:xyz789==,iv:...,tag:...,type:str]
sops:
  kms:
    - arn: arn:aws:kms:ap-southeast-1:123456:key/abcd-1234
  # SOPS metadata: version, mac, ...
~~~

Argo CD needs a plugin ({{ksops}}, {{helm-secrets}}) to decrypt during sync. Flux, on the other hand, supports SOPS natively.

- **Pros**: flexible (only the sensitive fields are encrypted, the rest stays readable in Git). Supports many key backends (AWS KMS, GCP KMS, Azure Key Vault, age, PGP). Good for Helm values and Kustomize overlays.
- **Cons**: CI/CD and Argo CD need access to the KMS key in order to decrypt → IAM gets complicated. Rotation works like Sealed Secrets (edit the file, re-encrypt, commit). No audit of "who read the secret at runtime". Merge conflicts on an encrypted file are painful to resolve.

### Option 3: External Secrets Operator (ESO)

~~~yaml
# external-secret.yaml — holds only REFERENCES, committed to Git
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
  namespace: app
spec:
  refreshInterval: 1h             # re-sync every 1 hour
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: db-credentials           # name of the K8s Secret that will be created
    creationPolicy: Owner
  data:
    - secretKey: password          # key inside the K8s Secret
      remoteRef:
        key: prod/payment/db       # path inside AWS Secrets Manager
        property: password         # field inside the secret JSON
    - secretKey: username
      remoteRef:
        key: prod/payment/db
        property: username
~~~

~~~yaml
# ClusterSecretStore — how to connect to the secret manager (configured once)
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: aws-secrets-manager
spec:
  provider:
    aws:
      service: SecretsManager
      region: ap-southeast-1
      auth:
        jwt:
          serviceAccountRef:
            name: eso-sa
            namespace: external-secrets   # use IRSA (IAM Roles for Service Accounts)
~~~

- **Pros**: the real secret never sits in Git. **Rotation is easy**: change the password in AWS Secrets Manager → ESO syncs by itself (according to {{refreshInterval}}) → the K8s Secret is updated. Audit lives centrally in the secret manager (who read it, when). Supports many backends (AWS, Vault, GCP, Azure, 1Password...).
- **Cons**: one more dependency (the ESO operator + a secret manager). IAM/auth setup is required. If the secret manager is down, ESO cannot sync new secrets (but the Secret already in the cluster remains). The secret manager service itself costs money.

### Overall comparison

| Criterion | Sealed Secrets | SOPS | External Secrets Operator |
|---|---|---|---|
| Secret in Git | Ciphertext (whole value encrypted) | Ciphertext (field level) | References only (no value) |
| Source of truth | Git | Git | An external secret manager |
| Rotation | Manual: re-seal, commit, sync | Manual: re-encrypt, commit | Automatic: change it in the manager, ESO syncs |
| Audit of secret reads | No | No | Yes (at the secret manager) |
| Extra infrastructure | Controller in the cluster | KMS/age key | ESO + secret manager |
| Pure GitOps | High | High | Medium (Git holds no value) |
| Fits | Small team, few secrets, rare rotation | Helm values, many environments | Production, frequent rotation, compliance |

### Rotation: the step many teams forget

Rotating the DB password in the secret manager (or creating a new SealedSecret) is only **step 1**. Step 2 is harder: **the application must receive the new value**.

- **The Kubernetes Secret is updated**: the ESO/SOPS controller updates the {{Secret}} resource. But a running Pod **does not reload by itself** — environment variables are injected when the Pod starts, and a volume mount updates slowly (kubelet sync, possibly 1–2 minutes) and the app still has to re-read the file.
- **Options**:
  - **Controlled Pod restart**: use {{Reloader}} (Stakater) — a watcher that automatically triggers a rolling restart of the Deployment when a Secret/ConfigMap changes. Simple, and safe with rolling updates.
  - **Spring Cloud Kubernetes / Spring Cloud Vault**: the app reloads the property itself when the Secret changes (requires configuring {{@RefreshScope}}). More complex, and not every bean refreshes correctly.
  - **Vault dynamic secrets**: Vault creates temporary DB credentials (TTL 1h) and revokes them automatically. ESO or the Vault Agent Injector delivers the new credentials. An app using a connection pool must support reconnecting (HikariCP {{maxLifetime}} < the credential TTL).
  - **Accept a short downtime**: rotate inside a maintenance window and restart the app. The simplest answer for a small team.

### Real-world traps

- **Committing a plaintext Secret and then switching to Sealed Secrets**: the plaintext is still in Git history. You must rotate that secret (change the real password) and scrub the history with {{git filter-repo}} or BFG (which requires a force push — coordinate with the team).
- **Sealed Secrets controller key not backed up**: the cluster is rebuilt or migrated → the private key is lost → no SealedSecret can be decrypted. Back up the key with {{kubectl get secret -n kube-system -l sealedsecrets.bitnami.com/sealed-secrets-key -o yaml}} and store it somewhere safe (for example Vault).
- **ESO {{refreshInterval}} too long**: the rotation happened in the secret manager but ESO has not synced yet (50 minutes to go) → the app still uses the old password, which has already been revoked → connection errors. Pick a suitable interval (5m–15m for critical secrets) or trigger a manual sync.
- **Argo CD constantly showing "OutOfSync"**: ESO creates the Secret with metadata/annotations that the Git manifest does not have → Argo CD sees a difference. Configure {{ignoreDifferences}} in the Argo CD Application for the Secrets managed by ESO.
- **The app keeps pooled connections holding the old credential**: the DB password changed, the Secret updated, the Pod restarted — but the connection pool still holds the old connections (with some databases they keep working until the connection is closed). Understand the behavior of your DB and of your pool.

> Senior tip: For a team just starting with GitOps, **Sealed Secrets** is a reasonable starting point (few moving parts, pure GitOps). Once the number of secrets grows, or you need automatic rotation, or audit/compliance demands traceability — move to **ESO + AWS Secrets Manager/Vault**. Do not mix the three approaches in the same cluster without a clear convention (one pattern per namespace) — it creates confusion about "where is this secret managed?". Whichever approach you use, always configure **encryption at rest** for etcd (KMS provider) and keep RBAC strict on read access to the {{secrets}} resource.`,
    follow: [
      'You use ESO with AWS Secrets Manager. The DBA has just rotated the RDS password. Describe the whole chain from the moment the password changes until the Java app uses the new password, including the case where the app uses a HikariCP connection pool.',
      'Sealed Secrets: the controller was deleted and redeployed, the old private key is gone. The cluster is running normally (the Secrets have already been decrypted). How do you restore GitOps for the existing SealedSecrets?',
      'When is SOPS a better fit than ESO? Give one concrete example of a Helm values file that holds both ordinary config and sensitive config.'
    ],
  },
});
