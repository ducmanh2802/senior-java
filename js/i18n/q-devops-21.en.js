/*
 * English translation of js/data/q-devops.js — task T979. Format: js/core/i18n.js (content overlay).
 * ids: devops-119 devops-120 devops-121 devops-122 devops-123
 */
App.i18n.content({
  'devops-119': {
    q: "As a tech lead, how do you set up \"guardrails\" for your teams' Java containers: only run images from a trusted registry, images that are signed/scanned, and how do you handle a critical CVE disclosed against an image currently running in production?",
    a: `**Summary:** At multi-team scale, container security does not rely on individual discipline but on automated **guardrails**: (1) an internal **trusted registry** as the single release source, with controlled proxy/cache of upstream; (2) a standard pipeline **build → scan → SBOM → sign → promote**, where only passing artifacts reach the prod registry; (3) **admission policy** on the cluster blocks images from disallowed sources, unsigned, or violating baseline; (4) when a critical CVE (zero-day or high CVSS) appears, use SBOM/inventory to determine blast radius in minutes, classify exploitability, then **rebuild + rolling deploy** or apply temporary mitigation, with clear communication and deadlines.

### Terminology
- **Trusted registry**: image store under organizational control (Harbor/ECR/GAR with policy), separated dev/prod, with scanning and access control.
- **Guardrails**: automatic fences allowing fast movement within safe limits (as opposed to manual approval gates at every step).
- **CVSS**: vulnerability severity scoring; high score does not necessarily mean exploitable in your context.
- **Blast radius**: scope of impact if a component is attacked.

### Guardrail architecture (reference model)
| Stage | Control | Evidence |
|---|---|---|
| Source/PR | Secret scanning, SCA dependency, review | Required check status |
| Build | Approved base image, Dockerfile lint, reproducible build | CI log, image digest |
| Verify | {{trivy image/config}}, SBOM, unit/integration tests | Scan report + SBOM attached to artifact |
| Trust | Image signing (Cosign, CI identity bound) | Signature in registry |
| Promote | Promote only verified digests; replicate to prod registry | Immutable tag per release |
| Admit | Policy: allowed registry + signature + securityContext baseline | Admission deny + audit log |
| Run | Least-privilege runtime, network policy, observability | Anomaly alerts, drift detection |

### Response process for a critical CVE on a running image
1. **Signal**: CVE/advisory feed, Dependabot, continuous scanner alerts on registry.
2. **Scope (fast)**: query SBOM/inventory: which services, which image/tag/digest contain the affected package/lib? Is it in prod?
3. **Classify**: is there a fix ({{fixed version}})? is it exploitable in our context (does the service expose that path, untrusted input)? Decide: patch now, temporary mitigation, or accept with tracking (documented).
4. **Temporary mitigation (if not patched yet)**: WAF rule, disable feature, network policy blocking exploit path, increased monitoring — temporary only.
5. **Root fix**: bump dependency/base image, rebuild, rescan, sign, rolling deploy (prioritize high-risk/externally exposed services). For base OS CVE, rebuilding the image usually suffices; for Java libs, bump version in {{pom.xml}}/{{build.gradle}}.
6. **Verify & post-mortem**: confirm new digest is running, rescan clean (or remaining accepted CVEs), lessons learned (why did scoping take so long? was SBOM sufficient?).

### Balancing speed and safety
- **Automate repeatable decisions**: auto-block HIGH/CRITICAL with available fix on main/prod artifacts; allow time-boxed exceptions (ticket + owner + expiry date) instead of "turn off the scanner".
- **Platform provides safe defaults**: standard base image, hardened Dockerfile/Helm templates, shared pipeline — product teams don't reinvent.
- **Measure**: time from "CVE published" to "know blast radius" and to "prod runs patched version"; percentage of prod images with valid signature; number of admission denials (signal guardrails work).

> Senior tip: A KPI of "zero CVEs" is illusory; useful KPIs are **mean time to remediate** and ability to answer "are we affected?" in minutes thanks to SBOM. When talking to leadership, frame container security as a delivery capability: good guardrails let teams ship faster by removing ad-hoc arguments at the last minute.`,
    follow: [
      'When resources are limited, which CVEs do you patch first (CVSS, exploitability, exposure)?',
      'How do you handle an exception for a CVE with no fix available while business still needs to deploy?',
      'What is the difference between controls in CI (shift-left) and controls in admission/runtime (shift-right), and why do you need both?'
    ]
  },
  'devops-120': {
    q: 'What Service types exist in Kubernetes (ClusterIP, NodePort, LoadBalancer, ExternalName)? How does Ingress work: describe the request flow from domain via LB, ingress-nginx, Service to Pod, how to write path/host rules, use annotations (timeout, body size) and configure TLS with cert-manager.',
    a: `**Summary:** A Service creates a stable address in front of Pods: ClusterIP is cluster-internal only, NodePort opens a port on every node, LoadBalancer asks the cloud to provision an external LB, ExternalName maps to an external DNS. Ingress is a set of L7 rules (host/path/TLS) enforced by an Ingress controller (e.g. ingress-nginx): request goes DNS → Load Balancer → ingress-nginx Pod → Service → Pod. cert-manager automatically obtains and renews TLS certificates for Ingress.

### Terminology (first-time explanation)
- **ClusterIP**: default Service type, allocates a virtual IP reachable only inside the cluster.
- **NodePort**: Service type opening a port (default 30000–32767) on **every node**; traffic to that port is forwarded to the Service.
- **LoadBalancer**: Service type asking the cloud provider (AWS, GCP, Azure) to create a load balancer with a public IP pointing at the Service.
- **ExternalName**: Service type returning a DNS CNAME record pointing to an external domain, with no proxy or ClusterIP.
- **Ingress**: Kubernetes resource declaring HTTP/HTTPS routing rules (by host, path) from outside into Services.
- **Ingress controller**: program enforcing Ingress rules (ingress-nginx, HAProxy, Traefik...). It itself runs as a Pod; without a controller installed, Ingress resources do nothing.
- **TLS (Transport Layer Security)**: protocol encrypting HTTPS connections; requires a certificate issued by a CA (Certificate Authority).
- **cert-manager**: Kubernetes controller that automatically obtains, renews and stores TLS certificates (usually from Let's Encrypt) in a Secret.
- **Annotation**: key-value pair attached to a resource that a controller reads for extended configuration (each controller has its own annotation set).

### Request flow from domain to Pod
~~~seq
title: HTTPS request flow through Ingress
actors: User | DNS/LB | ingress-nginx | Service | Pod
User -> DNS/LB: GET https://shop.bank.vn/api/orders
note DNS/LB..ingress-nginx: DNS points shop.bank.vn -> public IP of the Load Balancer
DNS/LB -> ingress-nginx: Forward TCP 443 into ingress-nginx Pod
ingress-nginx -> ingress-nginx: Terminate TLS, match host+path rule
ingress-nginx -> Service: Proxy to order-svc:80
Service -> Pod: Select a Ready Pod (EndpointSlice), send to :8080
Pod --> ingress-nginx: HTTP 200 JSON
ingress-nginx --> User: HTTPS 200 (re-encrypted)
~~~

### The 4 Service types and when to use them
| Type | Access scope | Use when | Notes |
|---|---|---|---|
| ClusterIP | Inside cluster only | Service-to-service (order calls payment via {{http://payment-svc}}) | Default; safest |
| NodePort | Outside cluster via {{<NodeIP>:30000-32767}} | On-prem without cloud LB, or external LB pointing at nodes | Opens port on every node; manage firewall |
| LoadBalancer | Public IP from cloud | Each Service needs its own LB (rarely) or exposing ingress-nginx | Costs per LB; usually one LB for ingress-nginx |
| ExternalName | Returns CNAME DNS | Call external service from cluster under internal name (e.g. {{db.external}} -> RDS endpoint) | No proxy, no health check; DNS alias only |

### Ingress manifest: host/path rules, annotations, TLS
~~~yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop-ingress
  annotations:
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
    - hosts: [shop.bank.vn]
      secretName: shop-tls
  rules:
    - host: shop.bank.vn
      http:
        paths:
          - path: /api/orders
            pathType: Prefix
            backend:
              service: { name: order-svc, port: { number: 80 } }
          - path: /api/payments
            pathType: Prefix
            backend:
              service: { name: payment-svc, port: { number: 80 } }
~~~

### How cert-manager obtains TLS automatically
~~~yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata: { name: letsencrypt-prod }
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ops@bank.vn
    privateKeySecretRef: { name: letsencrypt-prod-key }
    solvers:
      - http01:
          ingress: { class: nginx }
~~~
When Ingress has the {{cert-manager.io/cluster-issuer}} annotation, cert-manager creates a Certificate → sends ACME request → completes HTTP-01 challenge via Ingress → stores cert/key in Secret {{shop-tls}}. It renews automatically before expiry (usually 30 days remaining).

### In production
- **Check commands:**
~~~bash
kubectl get ingress shop-ingress -o wide
kubectl describe ingress shop-ingress
kubectl get endpointslices -l kubernetes.io/service-name=order-svc
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=100
kubectl get certificate,certificaterequest,challenge -A
~~~
- **Common incidents:** (1) Ingress returns 503 "Service Temporarily Unavailable" because Service has no endpoints (wrong selector or Pod not Ready). Check {{kubectl get endpointslices}}. (2) Large upload fails with 413: {{proxy-body-size}} not set. (3) Backend slow causes 504: ingress-nginx default timeout is 60s; raise {{proxy-read-timeout}} but also consider optimizing app. (4) Cert not issued: {{kubectl describe challenge}} shows ACME error (DNS not pointed correctly, firewall blocks port 80 for HTTP-01).

- **IngressClass:** cluster may have multiple controllers; always set {{ingressClassName}} so rules go to the right controller.

> Senior tip: Create only **one** Service of type LoadBalancer for ingress-nginx and use Ingress to split traffic across many services — saves cost and public IPs. In banking, usually private Load Balancer + WAF in front, TLS terminated at Ingress (or passthrough if end-to-end needed). Always pin ingress-nginx version and monitor security advisories; the ingress-nginx project announced retirement (end of support), so plan evaluation of Gateway API (HTTPRoute) for more standard routing features.`,
    follow: [
      'What is the difference between pathType Prefix, Exact and ImplementationSpecific in Ingress? Give an easily confused example.',
      'How does TLS termination at Ingress differ from TLS passthrough? When does a bank need end-to-end encryption?',
      'What limitations of Ingress does Gateway API (HTTPRoute, Gateway) solve, and when would you consider migrating?'
    ]
  },
  'devops-121': {
    q: 'What is Helm and what problem does it solve when deploying a Spring Boot app to Kubernetes? Explain chart, values, release, commands upgrade --install, rollback, helm template; and when do you write your own chart vs use Kustomize.',
    a: `**Summary:** Helm is the package manager for Kubernetes: it bundles many YAML manifests (Deployment, Service, Ingress, ConfigMap...) into a **chart** parameterized via **values**; each install creates a **release** with history for rollback. Use {{helm upgrade --install}} for repeatable (idempotent) deployment, {{helm template}} to preview rendered YAML, {{helm rollback}} to revert. Write your own chart when you need reusable packaging with many configuration variables; use Kustomize when you want to patch plain YAML per environment without a template engine.

### Terminology
- **Chart**: a Helm package, a directory containing {{Chart.yaml}} (metadata), {{values.yaml}} (defaults), and {{templates/}} (manifest YAML with placeholders in double braces, e.g. referencing {{.Values.image.tag}}).
- **Values**: configuration variables; set in {{values.yaml}}, override file ({{-f values-prod.yaml}}), or {{--set key=value}}.
- **Release**: one install of a chart into a cluster under a specific name; Helm stores release history (revisions) in a Secret in the cluster.
- **Repository**: chart store (HTTP index) for sharing charts publicly/internally (e.g. Bitnami, Harbor OCI).
- **Idempotent**: running repeatedly yields the same result; {{upgrade --install}} installs if absent, upgrades if present.
- **Render**: Helm substitutes placeholders in templates with values to produce plain Kubernetes YAML.

### Minimal chart structure
~~~text
payment-chart/
  Chart.yaml
  values.yaml
  templates/
    deployment.yaml
    service.yaml
    ingress.yaml
    _helpers.tpl
~~~
~~~yaml
replicaCount: 2
image:
  repository: harbor.bank.local/core/payment
  tag: "1.4.0"
service: { port: 80, targetPort: 8080 }
ingress:
  enabled: true
  host: payment.bank.vn
resources:
  requests: { cpu: 250m, memory: 512Mi }
  limits:   { cpu: "1",   memory: 1Gi }
~~~

### Common Helm commands (with comments)
~~~bash
helm upgrade --install payment ./payment-chart \\
  -n payment --create-namespace \\
  -f values-prod.yaml \\
  --set image.tag=1.4.7 \\
  --atomic --timeout 5m

helm template payment ./payment-chart -f values-prod.yaml --set image.tag=1.4.7

helm history payment -n payment
helm rollback payment 3 -n payment

helm diff upgrade payment ./payment-chart -f values-prod.yaml
helm uninstall payment -n payment
~~~

### Helm vs Kustomize: which to choose
| Criteria | Helm | Kustomize |
|---|---|---|
| Customization | Template + values ({{if/range}} logic in YAML) | Patch/overlay on plain YAML (no templates) |
| Reusable packaging | Good: chart like a library, versioned, publishable to repo | Weaker: usually copy base then patch |
| Manifest readability | Harder: must render to see final YAML | Easy: YAML stays close to original |
| Release/rollback management | Built-in (history, rollback) | None; relies on GitOps controller (Argo CD/Flux) |
| Best when | Many variables, installing third-party software (Postgres, Redis), reusable packaging | Few variables, want plain YAML, pure GitOps |

In practice many teams use **both**: Helm renders third-party charts, or Argo CD deploys Helm charts while managing values in Git; Kustomize for light overlays.

### In production
- **Common incidents:** (1) {{helm upgrade}} fails mid-way leaving release in {{failed/pending-upgrade}} state: use {{--atomic}} for auto-rollback, or manual {{helm rollback}}. (2) {{--set}} type mistakes (number becomes string, boolean) causing invalid YAML: prefer file ({{-f}}) and {{helm template}} for review. (3) Directly editing resources with {{kubectl edit}} then Helm upgrade overwrites: called "drift". Avoid manual edits; all changes go through values + upgrade.
- **Check commands:**
~~~bash
helm list -n payment
helm get values payment -n payment -a
helm get manifest payment -n payment
kubectl get events -n payment --sort-by=.lastTimestamp
~~~
- **Security:** do not commit real Secrets in {{values.yaml}} to Git. Use {{helm-secrets}} (SOPS), External Secrets Operator, or inject from CI secret store.

> Senior tip: Always run {{helm template}} (and {{helm diff}} if available) in CI to review YAML before apply — Helm templates can produce YAML different from intent due to a single indentation or wrong {{if}}. Set {{--atomic --timeout}} in the deploy pipeline so failures automatically revert to last good state, and version the chart ({{version}} in Chart.yaml) separately from {{appVersion}} to manage infrastructure changes independently from code changes.`,
    follow: [
      'Where does Helm store release history in the cluster and how do you handle oversized Secret history?',
      'How do you manage Secrets safely with Helm in GitOps (Argo CD) without committing passwords to Git?',
      'When do you choose a community chart (Bitnami) vs writing an internal chart?'
    ]
  },
  'devops-122': {
    q: 'For a Spring Boot app on Kubernetes, how do you use ConfigMap and Secret? Compare passing via environment variables (env) vs file mount; why does changing a ConfigMap not make a running Pod pick up new config, and how to handle it (checksum annotation, rollout restart)? Explain why Secret is only base64 and safer alternatives (encryption at-rest, External Secrets, Sealed Secrets).',
    a: `**Summary:** ConfigMap holds non-sensitive configuration, Secret holds sensitive data (passwords, tokens). Both can reach a Pod via environment variables or file mount; Spring Boot reads {{application.yml}}/properties from a file mount naturally, while env maps well to {{SPRING_*}}. Environment variables are read only at process start, so changing ConfigMap/Secret does not auto-update a running Pod — usually force a rollout via checksum annotation or {{kubectl rollout restart}}. Kubernetes Secret is only base64 by default (not secure encryption); enable encryption at-rest for etcd and use External Secrets Operator or Sealed Secrets to avoid storing plaintext in Git.

### Terminology
- **ConfigMap**: Kubernetes object storing key-value pairs or text config content, not for sensitive data.
- **Secret**: Kubernetes object storing sensitive data; values are base64-encoded when stored in manifests (base64 is **not** security encryption).
- **env / envFrom**: inject ConfigMap/Secret keys as container environment variables.
- **Volume mount**: attach ConfigMap/Secret as a directory/file in the container filesystem.
- **etcd**: control plane data store holding all objects (including Secrets). **Encryption at-rest** encrypts Secret data in etcd.
- **External Secrets Operator (ESO)**: controller syncing secrets from external stores (AWS Secrets Manager, Vault, GCP Secret Manager) into Kubernetes Secrets.
- **Sealed Secrets**: Bitnami tool encrypting a Secret into a SealedSecret safe to commit to Git; only the in-cluster controller can decrypt.
- **Rollout restart**: restart Pods of a Deployment in turn so they re-read env/config.

### env vs file mount for Spring Boot
| Criteria | Environment variables (env/envFrom) | File mount (volume) |
|---|---|---|
| How Spring Boot reads | Maps {{SPRING_DATASOURCE_URL}} → {{spring.datasource.url}} automatically | Place {{application.yml}}/properties where Spring looks ({{/config}}) or point {{spring.config.import}} |
| Update when ConfigMap changes | **Never** for running process (env fixed at start) | kubelet updates file after a delay (~1 min); **but** Spring Boot does not auto-reload unless using reload mechanism (Spring Cloud Config + refresh) or actuator refresh |
| Limits | Long variable names, leak risk via {{/proc}}, crash dumps; hard for large files | If mounted with {{subPath}}, file is **not** auto-updated |
| Best when | Few simple values, individual secret keys | Complex config (long YAML), certificates, many keys |

~~~yaml
apiVersion: v1
kind: ConfigMap
metadata: { name: payment-config }
data:
  SPRING_PROFILES_ACTIVE: "prod"
  application.yml: |
    server.port: 8080
    app.timeout-ms: 2000
---
apiVersion: v1
kind: Secret
metadata: { name: payment-secret }
type: Opaque
stringData:
  SPRING_DATASOURCE_PASSWORD: "s3cr3t"
---
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    metadata:
      annotations:
        checksum/config: "\\{{ include (print $.Template.BasePath \"/configmap.yaml\") . | sha256sum \\}}"
    spec:
      containers:
        - name: payment
          envFrom:
            - configMapRef: { name: payment-config }
          env:
            - name: SPRING_DATASOURCE_PASSWORD
              valueFrom: { secretKeyRef: { name: payment-secret, key: SPRING_DATASOURCE_PASSWORD } }
          volumeMounts:
            - name: cfg
              mountPath: /config
      volumes:
        - name: cfg
          configMap: { name: payment-config, items: [{ key: application.yml, path: application.yml }] }
~~~

### Why changing ConfigMap does not update Pod and how to handle
- **Root cause:** environment variables are process attributes assigned at container start. Spring Boot reads config at context startup. Even if kubelet updates a file mount, the app does not re-read.
- **Option 1 — Rollout restart (simple, safe):** {{kubectl rollout restart deploy/payment -n payment}}. Suits infrequent config changes accepting rolling restart.
- **Option 2 — Checksum annotation (Helm):** hash ConfigMap/Secret content into {{spec.template.metadata.annotations}}. Content changes → hash changes → Pod template changes → Deployment auto rolling update. Common with Helm.
- **Option 3 — App self-reload:** Spring Cloud Kubernetes or actuator {{/actuator/refresh}} with {{@RefreshScope}}. More complex; not every bean refreshes safely (connection pools, thread pools). Use selectively.

### Secret is only base64 — what that means and what to do
Base64 is only an **encoding** to embed binary data into YAML; anyone can decode: {{echo c2VjcmV0 | base64 -d}} yields {{secret}}. Therefore:
- **Enable encryption at-rest for etcd**: API server encrypts Secrets before writing to etcd (KMS provider or aescbc). Direct etcd readers see no plaintext.
- **Limit RBAC**: only ServiceAccounts/groups needing it may {{get/list}} Secrets. Avoid broad grants.
- **Do not commit plaintext Secrets to Git**. Use:
  - **External Secrets Operator (ESO):** declare {{ExternalSecret}} pointing to AWS Secrets Manager/Vault; ESO syncs into Kubernetes Secret. Real secret lives in external store; Git holds only reference.
  - **Sealed Secrets:** {{kubeseal}} encrypts Secret with cluster public key into {{SealedSecret}} (safe to commit to Git); only in-cluster controller decrypts.
- **Avoid leaking via logs/env dumps:** do not log sensitive config, be careful with actuator {{/env}} (disable or protect), avoid {{kubectl describe pod}} exposing values (K8s does not show Secret values in describe, but injected env can leak via exec).

### In production
~~~bash
kubectl get cm,secret -n payment
kubectl describe cm payment-config -n payment
kubectl rollout restart deploy/payment -n payment
kubectl rollout status deploy/payment -n payment
kubectl exec deploy/payment -n payment -- env | grep SPRING
~~~
- **Incidents:** (1) Change DB password Secret but forget restart → app keeps old password in env, soon DB changes password → mass connection errors. (2) Using {{subPath}} file mount → kubelet does not update file when ConfigMap changes, causing confusion "changed but app still old". (3) Committing base64 {{secret.yaml}} to widely accessible Git → password leak. Move to ESO/Sealed Secrets and rotate credential immediately.

> Senior tip: Practical convention: ConfigMap/Secret for **non-sensitive or referenced** config, real credentials live in a vault (AWS Secrets Manager, HashiCorp Vault) synced via External Secrets Operator; enable encryption at-rest for etcd and audit Secret read permissions. In Helm, use checksum annotation so every config change creates a controlled rollout — and remember Spring Boot actuator endpoints {{/env}}, {{/configprops}} must be protected (or disabled publicly) as they can leak sensitive values.`,
    follow: [
      'Compare External Secrets Operator and Sealed Secrets: data flow, who holds the key, and when to choose which?',
      'How to make Spring Boot reload part of config (e.g. timeout, feature flag) without restarting Pod? What are the risks?',
      'You discover a DB Secret was committed base64 to Git. What are the response steps (rotate key, clean history, prevention)?'
    ]
  },
  'devops-123': {
    q: 'A Spring Boot app on Kubernetes starts slowly (context load, pool connections, warm-up). How do you configure liveness, readiness, startup probes with Spring Boot Actuator health groups to be safe and avoid restart loops? What configuration mistakes commonly cause Pods to restart continuously?',
    a: `**Summary:** Use **startupProbe** to give the app time to start (while it runs, liveness/readiness are disabled), **readinessProbe** bound to health group {{readiness}} to accept traffic only when truly ready (DB/pool OK), and **livenessProbe** bound to group {{liveness}} to detect only hung/non-recovering states — never check external dependencies (DB, Redis) in liveness. Spring Boot Actuator provides {{/actuator/health/liveness}} and {{/actuator/health/readiness}} out of the box. Classic misconfiguration: liveness running too early or depending on DB → Pod restart loop when DB is slow.

### Terminology
- **Probe**: kubelet mechanism checking container periodically (HTTP GET, TCP socket, or exec command). Key params: {{initialDelaySeconds}} (delay first check, ignored if startupProbe present), {{periodSeconds}}, {{timeoutSeconds}}, {{failureThreshold}} (consecutive failures before fail), {{successThreshold}}.
- **startupProbe**: checks startup phase; while unsuccessful, liveness/readiness are disabled. Failing beyond {{failureThreshold}} → container restarted. Used to "buy time" for slow apps.
- **readinessProbe**: on failure → Pod removed from Service EndpointSlice (stops receiving traffic), **no** restart.
- **livenessProbe**: on failure → kubelet **restarts** container. Should only detect deadlock/hung not self-recovering.
- **Actuator**: Spring Boot module providing operational endpoints (health, metrics, info). **Health group** groups indicators into groups ({{liveness}}, {{readiness}}) so probes hit the right purpose.
- **Health indicator**: component checking one part ({{db}}, {{diskSpace}}, {{redis}}, {{ping}}). Group {{liveness}} defaults to only {{livenessState}} (internal state), {{readiness}} includes {{readinessState}} and often {{db}} depending on config.

### Spring Boot Actuator config (health groups)
~~~yaml
management:
  endpoint:
    health:
      probes:
        enabled: true
      show-details: never
  endpoints:
    web:
      exposure:
        include: health,info,prometheus
  health:
    livenessState.enabled: true
    readinessState.enabled: true
~~~
Spring Boot (2.3+, standard on 3.x) auto-enables liveness/readiness state on Kubernetes. Group {{liveness}} reflects only internal application state ({{LivenessState.CORRECT}} unless you explicitly report {{BROKEN}}). Group {{readiness}} reflects ability to receive traffic; you control which indicators are included.

### Probe manifest for a slow-starting Java app
~~~yaml
containers:
  - name: payment
    image: harbor.bank.local/core/payment:1.4.7
    ports: [{ containerPort: 8080 }]
    startupProbe:
      httpGet: { path: /actuator/health/liveness, port: 8080 }
      periodSeconds: 5
      timeoutSeconds: 2
      failureThreshold: 36
    readinessProbe:
      httpGet: { path: /actuator/health/readiness, port: 8080 }
      periodSeconds: 5
      timeoutSeconds: 2
      failureThreshold: 3
      successThreshold: 1
    livenessProbe:
      httpGet: { path: /actuator/health/liveness, port: 8080 }
      periodSeconds: 10
      timeoutSeconds: 2
      failureThreshold: 3
~~~
Formula: max startup time = {{startupProbe.periodSeconds * failureThreshold}}. Measure real start time on staging (log "Started ... in X seconds") then set with margin (e.g. start 60s → allow 150–180s).

### Comparing the 3 probes (focus on mistakes)
| Probe | Endpoint | On failure | Mistake causing restart loop |
|---|---|---|---|
| startup | {{/health/liveness}} (light) | Restart after threshold | {{failureThreshold}} too small vs real start time |
| readiness | {{/health/readiness}} | Remove from Service, **no** restart | Rarely causes restart; but using heavy dependency endpoint indirectly impacts |
| liveness | {{/health/liveness}} (internal only) | **Restart** container | Checking DB/Redis externally → DB slow 30s → all Pods restart simultaneously |

### In production
~~~bash
kubectl describe pod payment-xxx -n payment
kubectl get pod -n payment -w
kubectl logs payment-xxx -n payment --previous
kubectl exec deploy/payment -n payment -- curl -s localhost:8080/actuator/health/liveness
kubectl exec deploy/payment -n payment -- curl -s localhost:8080/actuator/health/readiness
~~~
- **Typical restart loop incidents:** (1) No startupProbe, liveness {{initialDelaySeconds}}=30s but app starts in 90s → kubelet restarts forever, RESTARTS increases, logs cut mid-way. (2) Liveness calls {{/actuator/health}} (aggregate, includes DB) instead of {{/health/liveness}} → DB overload/network blip → **all** Pods restart at once → cascading disaster. (3) {{timeoutSeconds}} too small (1s) while GC pause or load makes endpoint respond slowly → false failures.

- **Golden rule:** liveness only answers "process alive and not deadlocked"; readiness answers "should traffic be sent to me right now". External dependencies (DB, other services) belong to readiness, **not** liveness.

> Senior tip: Measure p99 startup time (until readiness UP) on staging with real data then set startupProbe with 2–3x margin; add metrics {{application.ready.time}} and {{application.started.time}}. For banking apps connecting to many systems, consider splitting readiness indicators: "mandatory to serve" dependency (primary DB) affects readiness, "secondary" dependency (cache) degrades gracefully instead of making Pod NotReady — but code must be designed to run without cache. Absolutely do not let liveness depend on DB: one DB maintenance window can take down the entire application cluster.`,
    follow: [
      'If an app deadlocks (thread hung) but the HTTP server still responds to health, does the probe detect it? What can supplement?',
      'How would you configure the readiness group when the app depends on both a primary DB (mandatory) and Redis cache (can be temporarily missing)?',
      'How do startupProbe, initialDelaySeconds and failureThreshold interact? Does initialDelaySeconds of liveness still matter when startupProbe exists?'
    ]
  }
});
