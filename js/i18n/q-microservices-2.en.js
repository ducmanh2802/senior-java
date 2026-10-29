/*
 * English translation of js/data/q-microservices.js — task T535. Format: js/core/i18n.js (content overlay).
 * ids: microservices-011 microservices-012 microservices-013 microservices-014 microservices-015 microservices-016 microservices-017 microservices-018 microservices-019 microservices-020
 */
App.i18n.content({
  'microservices-011': {
    q: `Explain the role of API Gateway and BFF, and where they differ. Compare client-side load balancing with server-side (Kubernetes) and service discovery.`,
    a: `**Summary:** An **API Gateway** is the shared infrastructure front door for every client (TLS, authentication, rate limiting, routing); a **BFF** (Backend For Frontend) is the aggregation layer **per experience** (web, mobile) that holds the logic serving one particular UI. On load balancing: **client-side** (the client picks an instance from a registry itself) is flexible but every client must be smart; **server-side** (a Kubernetes Service, a load balancer) is simple and centrally controlled. On Kubernetes, Service + DNS + readiness probe already is service discovery.

### Quick understanding
An office building has a **reception desk in the lobby** (API Gateway): it checks badges, limits how many visitors come in, and points people to the right floor - but the receptionist does none of the actual company work. A **BFF** is like a **personal assistant for each kind of guest**: the VIP guest (mobile) wants a short summary, the partner (web) wants the full file; the assistant walks around gathering documents from several departments and hands over exactly what that guest needs. Service discovery is the **building directory** that says which office is open and where; the load balancer is the person **spreading guests** across the staff who are free.

### Terminology
- **API Gateway**: the single entry point from outside; it applies shared policies before forwarding the request into a service.
- **BFF**: a backend dedicated to one type of frontend, merging and trimming data to fit that screen's needs.
- **Service discovery**: the mechanism for finding the IP/port of the live instances of a service.
- **Service registry**: the place that stores the instance list (Eureka, Consul); Kubernetes uses the API server + CoreDNS.
- **ClusterIP Service**: a stable virtual IP inside Kubernetes; kube-proxy forwards traffic to one pod behind it.
- **Headless Service** ({{clusterIP: None}}): DNS returns the pod IPs directly, with no virtual IP.
- **Readiness probe**: checks whether a pod is ready to receive traffic; if it is not, the pod is removed from the Service.
- **Service mesh**: a layer of sidecar proxies (Envoy) that handles retry, mTLS and load balancing instead of your application code.

### API Gateway
1. **Shared work at the edge**: terminate TLS, validate the JWT (signature, issuer, audience), rate limit/WAF, route to services, transform request/response, cache, attach tracing. Why here: you do it once for every service instead of every service doing it itself.
2. **Tools**: Spring Cloud Gateway (the reactive version on Netty, and since Spring Cloud 2023 also a Server MVC version running on the servlet stack), Envoy, Kong, APISIX, AWS API Gateway.
3. **The gateway holds no business logic**: every domain if/else inside the gateway turns it into a deployment bottleneck that nobody dares to touch.

~~~yaml
spring:
  cloud:
    gateway:
      routes:
        - id: order
          uri: lb://order-service       # lb:// => ask service discovery to pick an instance
          predicates:
            - Path=/api/orders/**
      default-filters:
        - name: CircuitBreaker
          args: { name: default, fallbackUri: forward:/fallback }
~~~
(Property names can differ between Spring Cloud Gateway versions; newer releases split the prefix by webflux/mvc variant, so check the documentation for your exact version.)

### BFF (Backend For Frontend)
1. **Why it exists**: a web screen needs 3 APIs merged into one list; mobile needs fewer fields and a smaller payload to save bandwidth, plus product recommendations. The BFF merges and trims per experience.
2. **How it differs from a gateway**: the gateway handles **policy** (infrastructure, shared by everyone), the BFF handles the **data shape** of one specific product, and is usually owned by the frontend team.
3. **Auth**: BFFs still use tokens from a common IdP; the web BFF can also keep the token server-side and give the browser only an HttpOnly cookie (the "BFF for SPA" pattern), so the token never sits in JavaScript.

~~~text
Mobile ─┐                ┌─► BFF-mobile ─┬─► order-service
        ├─► API Gateway ─┤               ├─► product-service
Web ────┘ (TLS, JWT,     └─► BFF-web ────┴─► review-service
           rate limit)
~~~

### Service discovery and load balancing
| | Client-side | Server-side (Kubernetes) |
|---|---|---|
| Who picks the instance | **the client** (Eureka/Consul + Spring Cloud LoadBalancer) | kube-proxy (iptables/IPVS) or a proxy such as Envoy |
| Path | directly to the instance | through the Service's virtual IP, NAT to a pod |
| Algorithm | the client decides (round-robin, by load, by zone) | iptables picks randomly; IPVS supports round-robin and a few other algorithms |
| Health | the client queries the registry | the readiness probe removes pods from the endpoint list |
| Fits | no K8s, need balancing by real load | **K8s environments: recommended** |

1. **In K8s**: a service calls {{http://order-service}}, CoreDNS returns the ClusterIP, kube-proxy forwards to a ready pod. Why that is enough: Kubernetes already keeps the list of live pods and updates it from the probes.
2. **Headless Service** is used for StatefulSets (Kafka, databases) or when the client wants to balance on its own (gRPC client-side LB).
3. **gRPC/HTTP2 on a ClusterIP**: kube-proxy balances per **connection** (L4), but gRPC keeps one long-lived connection, so every request piles onto a single pod. Fixes: client-side LB through a headless Service, or a mesh/Envoy balancing per request (L7).
4. **DNS cache**: a low TTL means a flood of DNS queries; a long client cache keeps sending traffic to a pod that is already dead. That is why the client always needs timeout + retry.

### Common pitfalls
1. **A gateway merging 10 services with no per-route timeout**. Symptom: the slowest route eats the entire time budget. Avoid: timeout + circuit breaker per route.
2. **Stuffing business logic into the gateway**. Symptom: every feature requires changing and redeploying the gateway. Avoid: put aggregation logic in a BFF or in a service.
3. **Creating a BFF when web and mobile use exactly the same API**. Symptom: one more service that nobody maintains. Avoid: build a BFF only when the experiences really differ.
4. **Running Eureka on K8s for no reason**. Symptom: two sources of truth about instances, drifting apart whenever a pod restarts. Avoid: use the Kubernetes Service (or Spring Cloud Kubernetes if you need it).

### 1-minute interview answer
"An API Gateway is the shared front door handling TLS, JWT validation, rate limiting and routing, with no business logic. A BFF is a backend dedicated to each experience, merging and trimming data for web or mobile, and usually owned by the frontend team. On load balancing, client-side like Spring Cloud LoadBalancer with Eureka lets the client pick the instance - flexible, but every client must be smart; server-side like a Kubernetes Service is simple and centralized. On Kubernetes I use Service, CoreDNS and readiness probes, and I don't run Eureka. For gRPC I keep in mind that kube-proxy balances per connection, so I need a headless Service or a mesh to balance per request."

> Senior tip: in Kubernetes, don't write your own service discovery: Service + CoreDNS + readiness probe already are service discovery. Invest in timeout/retry/tracing on the client instead, and remember that gRPC needs per-request balancing, not per-connection.`,
    follow: [
      `When should you use gRPC + client-side LB instead of REST through the gateway?`,
      `What is the risk of the web and mobile BFFs sharing the same token?`,
      `How does a headless Service differ from a normal Service, and when do you need one?`
    ]
  },
  'microservices-012': {
    q: `How do you build observability for a system of 30 microservices? Distinguish RED/USE, correlation id and OpenTelemetry, and point out the cardinality trap.`,
    a: `**Summary:** metrics for **trends**, logs for **per-event detail**, traces for **the journey of one request across services**. RED (Rate, Errors, Duration) is measured per endpoint/service, USE (Utilization, Saturation, Errors) is measured per resource; the correlation id (a trace_id following the W3C standard) is the thread that ties logs to traces. With 30 services I standardize on OpenTelemetry/Micrometer, keep metric labels at low cardinality, and alert on the SLO burn rate.

### Quick understanding
Imagine a delivery system with 30 warehouses. **Metrics** are the hourly summary table: how many parcels left, how many are late - you can see "something is wrong" at a glance, but not which parcel. **Logs** are the detailed ledger of each warehouse. A **trace** is the **tracking number**: it is stuck on the parcel when it is received and scanned at every warehouse it passes, so looking up one number shows the whole journey and where it was held up. The correlation id is that tracking number printed into every warehouse's ledger as well, so you can jump from the trace straight to the right log line.

### Terminology
- **Trace / span**: a trace is the whole journey of one request; a span is one piece of work inside it (one HTTP call, one query).
- **W3C TraceContext**: the standard header {{traceparent}} carrying the trace id, span id and sampling flags.
- **MDC (Mapped Diagnostic Context)**: a key-value "bag" attached to the current thread; logback prints entries with %X{traceId}.
- **OpenTelemetry (OTel)**: an open standard plus SDK/agent that collects traces, metrics and logs and ships them over the OTLP protocol.
- **OTel Collector**: a process that receives telemetry, processes it (sampling, filtering) and forwards it to the backend.
- **Cardinality**: the number of distinct value combinations of a metric's labels; each combination is one time series.
- **SLI / SLO / error budget**: the measured quality indicator, the target for that indicator, and the amount of failure "allowed" by the target.
- **Burn rate**: how fast the error budget is being spent compared with the evenly sustainable rate.

### The three pillars and how they connect (step by step)
1. **Create the trace id at the edge**: the gateway starts a trace following W3C TraceContext (header {{traceparent}}). Why at the edge: every service behind it shares one id, and nobody invents a new trace.
2. **Propagate over HTTP and Kafka**: the HTTP client attaches the {{traceparent}} header; the Kafka producer writes it into the message headers and the consumer reads it back to link spans. Why: one missing link splits the trace into two.
3. **Each service creates spans** for each operation (HTTP server, JDBC, Kafka). Why: a span has a start and an end time, so you see immediately where the time goes.
4. **Print the trace id into logs through MDC**: Spring Boot 3 + Micrometer Tracing puts traceId/spanId into the MDC automatically (from 3.2 the default log pattern already contains the correlation fields); with manual configuration you use %X{traceId} / %X{spanId} in logback. Why: copying the trace_id from the trace UI into Loki/CloudWatch shows exactly the logs of the failed request.
5. **RED metrics per service/endpoint**, alerting on the SLO.

~~~text
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
             │  ────────── trace id ──────────  ── span id ──  flags
gateway ─► order ─► payment ─► Kafka(header traceparent) ─► notification
   └────────── same trace id 4bf92f… end to end ─────────────┘
~~~

### RED vs USE
- **RED** looks at **requests**: how many req/s each endpoint gets, what percentage are errors, how long p99 is. Use it for services/APIs - it is what customers feel.
- **USE** looks at **resources**: how much of the thread pool is used, is the queue full, GC pauses, CPU, connection pool. Use it for the JVM/machine/Kafka.
- **Saturation** predicts an outage earliest: the queue starts filling before the error rate moves at all. RED tells you "the customer is hurting", USE explains "why".

### OpenTelemetry in practice
1. **OTel Java agent** ({{java -javaagent:opentelemetry-javaagent.jar}}): instruments HTTP, JDBC, Kafka and logback automatically without code changes, exporting OTLP → Collector → Jaeger/Tempo/Grafana.
2. **Spring Boot 3** uses **Micrometer Observation** ({{ObservationRegistry}}) as the abstraction; Micrometer Tracing has a bridge to OTel or to Brave/Zipkin, so you write the code once and can swap the backend.
3. **Sampling**: head-based 1% decides at the start, so it easily drops exactly the trace of the failing request; **tail sampling** at the Collector waits for the trace to finish and keeps 100% of error traces + slow traces, keeping only a small fraction of normal ones. The cost: the Collector must hold spans in memory for a while, and all spans of one trace must reach the same Collector instance.

### The cardinality trap
Metric labels must be **bounded and predictable**: {{method, status, uri template}}.
~~~java
// WRONG: order_id as a label => one time series per order, Prometheus RAM explodes
registry.counter("orders", "order_id", orderId).increment();
// RIGHT: label by outcome (a few values), keep ids in logs/traces
registry.counter("orders_total", "result", result).increment();
~~~
~~~text
uri x method x status = 50 x 4 x 6 = 1,200 series / service   → fine
plus a user_id label (1 million users)  = 1.2 billion series → collapse
~~~

### SLO and alerting
1. **SLI**: availability = {{good requests / total}}, latency = the share of requests under 300ms.
2. **A 99.9% SLO** per month ⇒ an error budget of roughly 43 minutes/month (0.1% of 30 days).
3. **Alert on burn rate**: a burn rate of 1 means the budget lasts exactly 30 days; a burn rate of 14.4 sustained for 1 hour means you are burning 2% of the budget per hour → page now; a low burn rate sustained over a long window → open a ticket. Why: alerting on every error causes fatigue, while budget-based alerting reflects the real impact.
4. Alert on the **symptoms** customers see (5xx, p99) + leading technical alarms (Kafka lag, GC, saturation), not just CPU.

### Common pitfalls
1. **The trace breaks at Kafka**. Symptom: the consumer span becomes its own trace. Avoid: use the OTel/Spring Kafka instrumentation (enable observation) so the traceparent header is written and read.
2. **High-cardinality labels**. Symptom: the series count grows without bound, Prometheus slows down, the pod gets OOMKilled. Avoid: review labels in code review; use the uri template instead of the real path.
3. **Alerting on CPU**. Symptom: constant noise while customers see no problem. Avoid: alert on SLO/symptoms.
4. **Every team names metrics and units differently**. Symptom: you cannot build a shared dashboard. Avoid: shared conventions (OTel semantic conventions, one unit for latency).

### 1-minute interview answer
"I use three pillars: metrics for trends, logs for detail, traces for the journey of a request. The gateway creates the trace id per W3C TraceContext, it propagates over HTTP and Kafka headers, and Micrometer Tracing puts the traceId into the MDC so logs and traces link up. I measure RED for services and USE for resources, where saturation is the earliest signal. Instrumentation is the OTel agent or Micrometer Observation, shipped through a Collector with tail sampling so error traces are always kept. The biggest trap is cardinality: never put user_id or order_id in a label. I alert on the SLO burn rate rather than on CPU."

> Senior tip: with 30 services most of the value comes from **consistency**: the same metric names, the same labels, the same latency unit, the same trace header. As the architect, your first job is to write the shared observability dictionary, not to install tools.`,
    follow: [
      `How does a trace propagate through Kafka?`,
      `Why is tail sampling better than head sampling for incidents, and what does it cost?`,
      `How exactly do you alert on the error budget burn rate?`
    ]
  },
  'microservices-013': {
    q: `Two internal services call each other. Do you choose OAuth2 client credentials, mTLS or a service mesh? Explain the trade-offs and how authorization works on each side.`,
    a: `**Summary:** **mTLS** answers "which service is this" (identity at the workload level, proven by a certificate), **OAuth2 client credentials** answers "what may this service do" (permissions carried as scope/audience inside a JWT). The two complement each other and do not replace each other: the service mesh handles transport + identity (auto mTLS), while the application still handles business authorization + audit. The mesh cannot replace the app.

### Quick understanding
Think of a company building. **mTLS** is like a **badge with a chip**: the door reader knows for sure you are "person A from accounting", and nobody can fake that by just saying so. An **OAuth2 token** is like a **work permit** that states "may enter the warehouse, read-only, expires at 15:00". Having a badge does not automatically grant warehouse access; having a permit without a badge does not get you through the gate. A **service mesh** is like a **security team** standing at every door, checking badges for each room - but whether "person A may approve a 1 million payment" is still decided by the finance department.

### Terminology
- **OAuth2 client credentials**: the OAuth2 flow for machine-to-machine calls: a service uses client_id + secret to obtain an access token from the IdP, with no human user involved.
- **Scope / audience**: scope is a permission (orders.read); audience (aud) is the API the token was issued for.
- **private_key_jwt**: the client proves its identity with a JWT signed by a private key instead of sending a client_secret.
- **mTLS (mutual TLS)**: two-way TLS, where both client and server present a certificate.
- **SPIFFE / SPIRE**: a workload identity standard (in the form spiffe://domain/ns/x/sa/y) and a system that issues short-lived certificates for those identities.
- **Sidecar proxy (Envoy)**: a container running next to the app in the same pod, intercepting all inbound/outbound traffic to do mTLS, retry and telemetry.
- **AuthorizationPolicy / NetworkPolicy**: Istio / Kubernetes rules that define who may call whom.
- **Token exchange (RFC 8693)**: exchanging one token for another (for example, carrying the user's identity down to a downstream service).

### OAuth2 client credentials (step by step)
1. **Request a token**: service A calls the IdP (Keycloak, Auth0, Cognito, Entra ID) with {{client_id}}/{{client_secret}}, or with **private_key_jwt** (safer, because the secret never leaves the service). Why: the IdP is the single place that issues and revokes permissions.
2. **Cache the token**: a short TTL (5-15 minutes); reuse it until shortly before expiry, then fetch a new one - **never request a token per request**. Why: requesting constantly turns the IdP into a bottleneck and adds latency.
3. **Send** {{Authorization: Bearer ...}} when calling service B.
4. **B validates the token**: signature (via JWKS), expiry, issuer, **audience** and scope. Why audience matters: if a token issued for service X is still accepted by service Y, scope is meaningless.

~~~java
http.oauth2Client(o -> o.clientRegistrationRepository(reg))   // client side: fetch + cache the token
    .oauth2ResourceServer(r -> r.jwt(j -> j.decoder(
        jwtDecoderWithAudienceValidator())));  // server side: validate JWT + audience (JwtClaimValidator)
// Authorize by scope at the endpoint:
// .requestMatchers(HttpMethod.POST, "/orders/**").hasAuthority("SCOPE_orders.write")
~~~
- Problem: **secret sprawl** (the client_secret sits in every service's config), so store it in Vault/Secrets Manager and rotate it periodically. If you need to act on behalf of a user all the way downstream, use token exchange (RFC 8693) instead of forwarding the original token everywhere.

### mTLS and service mesh
1. **mTLS authenticates with certificates**: identity comes from the other side's certificate, not from a header that anyone can forge.
2. **Short-lived workload identity**: SPIFFE/SPIRE or the mesh CA issues certificates valid for a few hours (Istio default is 24 hours) and rotates them automatically; no more "a 2-year cert pasted everywhere".
3. **Doing mTLS per service by hand is painful** (certificate distribution, rotation, SAN, truststore), which is exactly why the mesh was born.
4. **Mesh (Istio, Linkerd)**: a sidecar Envoy (or Istio's sidecar-less ambient mode) intercepts every connection, providing **auto mTLS**, retry/timeout, load balancing and RED telemetry out of the box; the Java app does not change.
5. **Mesh trade-offs**: an extra proxy hop and a few ms of latency, extra CPU/RAM per pod, more components to operate, harder debugging. Fits: many services, polyglot, many teams. Does not fit: 3-5 services, a thin team.

~~~text
[Pod A: app ─► Envoy] ══ mTLS (cert spiffe://.../sa/order) ══► [Envoy ─► app : Pod B]
                                                                     │
                     Envoy B: AuthorizationPolicy "only sa/order may call POST /payments"
                     App B  : validate JWT scope payments.write + business rules (limits)
~~~

### Authorization on each side (defense in depth)
1. **Network**: deny-by-default for internal traffic (Kubernetes NetworkPolicy, mesh AuthorizationPolicy). "Internal" does not mean "trusted".
2. **Authenticate**: mTLS for workload identity; JWT for the identity of a delegated service/user.
3. **Authorize**: least-privilege scope/role, evaluated **inside the service** (never trust an {{X-User}} header arriving from the network).
4. **Audit**: log who called whom, with which scope, with what result; mandatory for money-related business.

### How to choose
| Situation | Choice |
|---|---|
| 3-5 services, one language, no mesh yet | OAuth2 client credentials + ordinary TLS + NetworkPolicy |
| Dozens of services, polyglot, mTLS everywhere | Mesh (auto mTLS) + JWT scope in the app |
| Calling a third-party API / another organization | OAuth2 (possibly with mTLS-bound tokens) |

### Common pitfalls
1. **Scope {{*}} for every service**. Symptom: one compromised service lets the attacker call every API. Avoid: grant each client only the scopes it needs, and review them periodically.
2. **Secrets in env vars / image layers**. Symptom: leaked through {{/actuator/env}}, crash dumps, {{docker history}}. Avoid: read secrets from a secret manager at runtime and lock down actuator.
3. **A mesh with "auto mTLS" but namespaces left in PERMISSIVE mode**. Symptom: some connections silently stay plaintext. Avoid: PeerAuthentication STRICT, verify with {{istioctl analyze}} and the mTLS dashboard.
4. **Not validating the audience**. Symptom: a low-privilege service's token is accepted by another service. Avoid: an audience validator on every resource server.

### 1-minute interview answer
"I treat these as two different questions. mTLS answers which service is calling, with short-lived certificates; OAuth2 client credentials answers what that service may do, through scopes and audience in the JWT. For a small system I use client credentials, cache the token until near expiry, and the resource server validates signature, audience and scope, plus deny-by-default NetworkPolicy. With dozens of polyglot services I use a mesh for auto mTLS and AuthorizationPolicy, but still keep scope checks and business rules in the app, because the mesh does not understand business. The mesh trade-off is operational cost and latency. My experience is that you must actually practise rotating secrets and certificates."

> Senior tip: secrets and certificates must be **rotatable without redeploying the whole cluster**. If rotation means downtime, you don't have a plan: measure it with a real rotation exercise once a quarter.`,
    follow: [
      `When would you choose private_key_jwt instead of client_secret_basic?`,
      `How does the mesh handle telemetry compared with instrumenting the app with the OTel agent?`,
      `How do you enforce least-privilege scopes across dozens of services?`
    ]
  },
  'microservices-014': {
    q: `How do you version APIs to stay backward compatible? Explain expand–contract and how consumer-driven contract testing runs in CI.`,
    a: `**Summary:** don't bump the version on every release; the rule is **only add, never break** (add optional fields, add endpoints). A breaking change follows the **expand → migrate consumers → contract** cycle (several deploys, at least one release apart). **Consumer-driven contract tests** (Pact, Spring Cloud Contract) catch breaks in CI instead of letting them reach production.

### Quick understanding
An API is like a **power socket**: millions of devices are plugged into it. You can add a new USB port next to it (add a field) without affecting anyone. But if you change the shape of the pins (rename a field, change its type), every old device breaks immediately. To change the socket standard you must: install the new socket alongside (expand), wait for everyone to move to the new plug (migrate), and only then remove the old socket (contract). A contract test is the **pin diagram** every device maker sends you: before manufacturing the new socket, you check that it still fits every diagram.

### Terminology
- **Backward compatible**: a new version of the provider still serves old consumers correctly without them changing.
- **Breaking change**: a change that breaks existing consumers (removing a field, renaming, changing the type, changing the meaning, changing the format).
- **Expand-contract (parallel change)**: add the new thing alongside the old, migrate gradually, then remove the old.
- **Provider / consumer**: the side offering the API / the side calling it.
- **Consumer-driven contract (CDC)**: the consumer records its expectations as a contract file, and the provider must prove it satisfies them.
- **Pact Broker / can-i-deploy**: storage for contracts plus verification results; the command asks "is this version safe to deploy to environment X?".
- **Tolerant reader**: the consumer ignores unknown fields and reads only what it needs.
- **Sunset / Deprecation header**: an HTTP header announcing that an API will be removed, and when.

### Choosing a versioning strategy
| Approach | Pros | Cons |
|---|---|---|
| URI (/v2) | explicit, cacheable, easy to route | duplicates resources, links scattered |
| Header ({{X-API-Version}}) | clean URL, version per client | hard to test in a browser, links cannot be shared |
| Query (?version=2) | visible, easy to log | bloats the URL, complex cache keys |
| Media type (Accept: application/vnd.x.v2+json) | true to REST | poor tooling, few teams use it |

- Recommendation: **URI versioning for big breaks** (simple, everyone understands it), header/query for small variations. Spring Framework 7 (Spring Boot 4) supports API versioning directly in request mappings; with Boot 3 you route by URI/header yourself.
- **JSON compatibility rules**: adding an optional field is OK; **do not** rename, change the type, change the meaning, remove a field, change the date format, or turn an optional field into a required one. Consumers must ignore unknown fields: Spring Boot configures Jackson with {{FAIL_ON_UNKNOWN_PROPERTIES}} off by default, so adding fields is safe; **but** changing "2024-05-01" to epoch millis is a silent break that still compiles.
- **Enums**: adding a new enum value can also break consumers that switch without a default branch, or deserialize enums strictly.

### Expand-contract (step by step)
1. **Expand**: add the new column/field, nullable, so old code keeps running. Why: old and new versions must coexist during a rolling deploy.
2. **Write both**: the new code writes the old and the new field, and backfills old rows in batches. Why: old consumers still read the old field.
3. **Move consumers** to read the new field; watch a metric that compares the two columns.
4. **Contract**: only after at least one release, and only when the data shows nobody reads it, remove the old field/column.

~~~text
Phase 1 (EXPAND):   ALTER TABLE orders ADD COLUMN status_v2 VARCHAR(16);  ← OLD code still runs
                    NEW code writes both status and status_v2, backfills gradually
Phase 2:            consumers read status_v2; verify with a metric comparing the 2 columns
Phase 3 (CONTRACT): after at least 1 release: ALTER TABLE orders DROP COLUMN status
~~~
Deploy order: **producer expands first → consumers switch to the new shape → producer contracts afterwards**. Never combine "change the schema + start using the new schema" in one deploy: rolling back the app does not roll back the schema.

### Consumer-driven contract testing in CI
1. **The consumer writes expectations** (Pact JVM): "I call GET /orders/1, I need field id to be a number, status to be a string, and a 200 response". The consumer's test runs against Pact's mock server and produces a **pact file**.
2. **Publish the pact** to the Pact Broker together with the consumer's version.
3. **The provider's CI verifies**: the provider starts for real (usually with a test database), Pact replays each request from the pact file and compares the response. Why it is effective: the provider knows **exactly** which consumer uses which field, so deleting an unused field is safe.
4. **can-i-deploy**: before deploying, the pipeline asks the Broker "have consumer v1.2 / provider v3.4 verified against each other?"; if not, the deploy is blocked.
- **Spring Cloud Contract**: provider-driven: the provider writes the contract in a DSL (Groovy/YAML), which generates tests for the provider itself and a **stub jar** so consumer tests can run offline.
- Unlike traditional integration tests: contract tests capture the **real usage** of consumers, run fast in CI, and do not need the whole system running.

~~~text
consumer CI: test ─► pact file ─► Pact Broker ◄─ provider CI: verify pact
                                     │
                     deploy pipeline: can-i-deploy? ─► yes ─► deploy
~~~

### When a break is unavoidable
- Send the **Sunset** header (RFC 8594, e.g. {{Sunset: Thu, 01 Jan 2026 00:00:00 GMT}}) and **Deprecation**, announced 6-12 months ahead.
- Measure usage of the old version (metrics by version + client id); remove it when the numbers reach zero, not on a hunch.
- The "N-1" policy: support at most 2 versions at a time.

### Common pitfalls
1. **Changing the date/amount format**. Symptom: consumers fail to parse even though the schema "did not change". Avoid: contract tests that check the format (regex) of dates and money.
2. **Combining the migration and the code that uses the new column in one deploy**. Symptom: rolling back the app still fails because the schema changed. Avoid: expand-contract across several releases.
3. **Strict consumer deserialization** (FAIL_ON_UNKNOWN_PROPERTIES enabled, strict enums). Symptom: the provider adds a field and the consumer breaks. Avoid: tolerant reader, an UNKNOWN enum value.
4. **Contract tests only run on the consumer side**. Symptom: pact files exist but the provider never verifies them, so breaks still slip through. Avoid: verify in the provider's CI, and let can-i-deploy block the deploy.

### 1-minute interview answer
"My rule is only add, never break: add optional fields, and consumers are tolerant readers. When a break is unavoidable I use expand-contract: add the new field alongside, write both, move consumers to the new one, and only remove the old one after at least one release; the database schema follows the same path. Big versions go in the URI for clarity. To catch problems early I use consumer-driven contracts with Pact: consumers produce pact files, providers verify them in CI, and can-i-deploy blocks a deploy that is not compatible. My experience is that most breaks come from format changes such as dates, so contracts must check formats too."

> Senior tip: most breaks come from **format changes**, not schema changes. Adding contract tests for date/currency/enum formats is 100x cheaper than fixing production parse failures.`,
    follow: [
      `When do you create /v2 instead of just adding fields?`,
      `Pact or Spring Cloud Contract - which do you choose, and why?`,
      `How do you retire an old API version without breaking clients that have gone quiet?`
    ]
  },
  'microservices-015': {
    q: `When do you apply CQRS and when do you also add event sourcing? List the benefits, the real costs and the traps you hit in production.`,
    a: `**Summary:** **CQRS** separates the write model from the read model (it can be just 2 tables, 2 services or 2 databases). **Event sourcing (ES)** stores **the event stream** as the source of truth instead of storing the current state. CQRS does not require ES; ES almost always comes with CQRS. Both are a **trade-off: complexity in exchange for query power/scale/audit**, never a default correct answer.

### Quick understanding
**CQRS** is like a restaurant with a **kitchen** and a **printed menu**: the kitchen (write model) is organized the way cooking is easiest, while the menu (read model) is presented the way guests choose most easily; when the kitchen changes a dish, the menu catches up a moment later. **Event sourcing** is like a **bank passbook**: the bank does not only store "balance is 5 million"; it stores every deposit and withdrawal line, and the balance is the sum of those lines. That is why it can answer "why is the balance 5 million?" or "what was the balance at 10am on Tuesday?".

### Terminology
- **Command / query**: an instruction that changes state / a read-only request for data.
- **Read model / projection**: a table or index that exists only for reading, built from events or from written data.
- **Event store**: storage for events, append-only per stream (usually one stream per aggregate).
- **Aggregate**: a cluster of domain objects that change together and enforce one consistency rule (for example Order + OrderLines).
- **Snapshot**: a picture of the aggregate's state at a given version, so you don't replay from the beginning.
- **Upcasting**: converting an old-version event into the new structure when it is read.
- **Eventual consistency**: the read model matches the written data after a short delay.
- **Read-your-writes**: whoever just wrote must be able to read their own write.

### CQRS: why and when
1. **The problem**: the write model (normalized, many foreign keys) serves transactions well, but business queries need a different shape (dashboards, full-text search, joins across aggregates). Why it is hard: optimizing for writes and optimizing for reads usually conflict.
2. **The solution**: write to the write model, publish events (through an outbox), and a consumer updates a flat (denormalized) read model such as a summary table or Elasticsearch.
3. **Benefits**: read queries are close to a key lookup; read scaling is independent (read replica, Elasticsearch); each side optimizes on its own.
4. **Real costs**: **eventual consistency** (a user creates something and opens the list immediately, and it may not be there yet - so the UI must show a status, or read straight from the primary for that user); two models mean extra mapping code, migrations, and the "I wrote it but it doesn't show" bug. CRUD over 20 endpoints plus CQRS is 20 more things that must be kept in sync.

~~~text
Command ─► [Write model: orders, order_lines] ─(outbox/event)─► Projector
                                                                   │
Query  ◄──────────── [Read model: order_summary / Elasticsearch] ◄─┘
                       (a few hundred ms to a few seconds behind)
~~~

### Event sourcing: the source of truth is the event log
~~~text
order-123 stream: [OrderCreated(v1)] [ItemAdded] [PaymentTaken(v2)] [Shipped]
                                       snapshot ──► current state = fold the events
~~~
1. **Write**: load the aggregate (snapshot + later events), run the command, produce new events, append them to the stream with a **version check** (optimistic concurrency: "append only if the stream is at version 7"). Why: two concurrent commands must not overwrite each other.
2. **Read**: projections subscribe to the stream and update the read model.
3. **Benefits**: a complete audit trail (finance, healthcare: "why is this amount what it is?" is answered from the event log); **temporal queries** (the state at 10am Tuesday = replay up to that moment); projections can be rebuilt at any time (rebuild Elasticsearch from zero); adding a new consumer does not touch the producer.

~~~java
// State = fold the events in order
Order rebuild(List<OrderEvent> events) {
    Order o = new Order();
    for (OrderEvent e : events) o.apply(e);   // apply only mutates state, no side effects
    return o;
}
~~~

### Costs and production traps of ES
- **Event evolution**: you must not modify old events; when the structure changes you must **upcast** (read a v1 event with v2 logic).
- Replaying the whole stream on every request is **O(n)**, so you need periodic **snapshots** (for example every 50-100 events) and a projection rebuild tool.
- **"Right to be forgotten" (GDPR)**: you cannot delete events because that breaks stream integrity; use **crypto-shredding** (encrypt personal data with a per-user key and delete the key) or anonymize.
- **Hard to debug**: the state is hidden inside 50 events, so a stream viewer tool is mandatory.
- **Storage grows**: append-only + snapshots, and partition by aggregateId so no stream grows without bound.

### When to choose
| Situation | Suggestion |
|---|---|
| Internal CRUD, balanced reads and writes | **no** - a normal repository is enough |
| Complex queries, reads ten times the writes | CQRS (a separate read model) |
| Audit is mandatory, you need replay/time-travel, event-rich domain (payments, games) | ES + CQRS |
| A new team, you need simplicity | don't use ES - the onboarding cost is huge |

Start with **CQRS-lite**: write through the service, read from a read replica or a summary table; add an event store only when you really need history/replay.

### Common pitfalls
1. **A projection drifts and nobody notices**. Symptom: dashboard numbers disagree with the written data. Avoid: a periodic reconciliation job + the ability to rebuild the projection.
2. **Events that carry too little or too much**. Symptom: consumers have to call back into the API for more data, or the event leaks internal structure. Avoid: events describe a business fact, with a schema version.
3. **Applying ES to everything**. Symptom: simple CRUD now needs events, projections and upcasters. Avoid: use it only in bounded contexts that truly need audit/time-travel.
4. **Ignoring read-your-writes**. Symptom: a user creates an order, doesn't see it, clicks create again, and ends up with a duplicate. Avoid: return the freshly written data in the response, or read from the write model for that user.

### 1-minute interview answer
"CQRS separates the write model from the read model; I use it when business queries need a very different data shape from the write model, or when reads greatly outnumber writes, such as dashboards or search. The read model is updated through events from an outbox, so I accept eventual consistency and handle read-your-writes. Event sourcing stores the event stream as the source of truth; I only add it when I need a full audit, time-travel or projection rebuilds, because it brings upcasting, snapshots, GDPR via crypto-shredding and debugging tooling. For ordinary CRUD I use neither. In practice I start with CQRS-lite and upgrade when there is a real need."

> Senior tip: every time someone proposes event sourcing, ask "who will build the projection rebuild tool and who is on call when the projection drifts?". If there is no answer, that is technical debt wrapped in a buzzword.`,
    follow: [
      `What do you do when a snapshot is corrupt? Who owns snapshot versioning?`,
      `If CQRS doesn't use ES, how do you keep the read model in sync?`,
      `How does upcasting events work concretely in Java code?`
    ]
  },
  'microservices-016': {
    q: `Compare blue-green, canary and feature flags. For database schema changes, how do you roll back safely? Explain the expand–contract rule when migrating.`,
    a: `**Summary:** blue-green **flips all traffic at once** (rollback = flip back), canary **pours traffic in stages** against SLOs (rollback = stop pouring), feature flags **decouple deploy from release** (toggle the feature at runtime). But **rolling back the app does not roll back the DB schema**, so migrations must be designed so they **never need a rollback**: compatible with the N-1 version of the app, following the **expand-contract** rule.

### Quick understanding
**Blue-green** is like having two stages: the show runs on the green stage while the blue one is prepared; at showtime you just switch the lights to the blue stage and invite the audience over - and if something goes wrong you invite them back. **Canary** is letting **a few customers taste the new dish** before it goes on the main menu. **A feature flag** is a **light switch**: the wiring (the code) is already in the wall, and you turn it on whenever you want. The database is the **house**: you can move furniture back and forth easily, but once you knock down a wall (DROP COLUMN) you cannot "undo" it - so always build the new wall first, move everything over, and only then tear down the old one.

### Terminology
- **Blue-green deployment**: two identical environments, only one receiving traffic; switch with the load balancer/DNS.
- **Canary release**: the new version receives a small share of traffic, increased gradually if the metrics look good.
- **Feature flag**: a runtime configuration switch deciding which code path runs, possibly per % of users.
- **Dark launch / shadow traffic**: run the new code on real traffic without returning its result to the user, purely to compare.
- **Expand-contract**: add a new structure that is backward compatible, migrate gradually, then remove the old structure.
- **Flag debt**: a flag that has been 100% on for ages and nobody removed, making the branching code hard to read.
- **Argo Rollouts / Flagger**: Kubernetes tools that automate canary/blue-green based on metrics.
- **Online schema change**: changing a large table's schema without a long table lock (gh-ost, pt-online-schema-change).

### Three strategies
| | Blue-green | Canary | Feature flag |
|---|---|---|---|
| How | 2 environments, flip the LB | 1% → 5% → 50% → 100% | deploy "dark", enable/disable by flag |
| Rollback | **instant** (flip back) | stop pouring traffic | **turn the flag off**, no redeploy |
| Monitoring | compare before/after | SLO/error rate per version | per % of users with the flag on |
| Cost | double the resources during the switch | needs good metrics + %-based routing | needs a flag system + many test combinations |
| Risk | long-lived connections (WebSocket), state | sticky sessions, user state | **flag debt**, flags nobody cleans up |

1. **Canary is strongest when you have trustworthy SLIs**: error rate, p99 per version, plus automatic promote/rollback (Argo Rollouts, Flagger; AWS CodeDeploy blue/green for ECS with CloudWatch alarms). Why: a human watching a dashboard at 2am misses things easily.
2. **Feature flags** separate "deployed" from "released"; good for A/B tests, dark launches, shadow traffic (call the new service in parallel and compare results, **without** letting the new code cause side effects). Trap: the number of test combinations doubles with every flag, so write a cleanup deadline into the ticket.
3. **Blue-green** fits when you need a decisive switch and instant rollback, and can afford double the resources during the switch.

### Rollback with DB migrations: the real question
~~~text
deploy v2 (migration + code) ── failure ──► roll back to v1
        └─ the code is OK again, but the schema was DROPped/retyped ⇒ v1 IS DEAD
~~~
Rule: **the migration must be backward compatible with the N-1 version of the app.** Why: during a rolling deploy, canary or blue-green, **v1 and v2 run at the same time against the same DB**. Change the schema with expand-contract, with each phase at least one release apart:

1. **Expand** (deploy v1.1): only add, never break; the new column is nullable and old v1 keeps running normally.
2. **Write both + backfill**: the code writes the old and the new column; backfill in small batches (for example 5,000 rows at a time) to avoid a long transaction holding locks and replicas falling behind.
3. **Switch reads** to the new column; a flag can drive this step.
4. **Contract**: DROP only when you are sure no version still reads the old column.

~~~sql
-- PHASE 1 (EXPAND): add, don't break; old v1 still runs
ALTER TABLE orders ADD COLUMN status_v2 VARCHAR(16);
-- PHASE 2: code writes both columns; background backfill in batches
UPDATE orders SET status_v2 = status
WHERE id BETWEEN :from AND :to AND status_v2 IS NULL;
-- PHASE 3 (CONTRACT): only when 100% nobody reads the old column
ALTER TABLE orders DROP COLUMN status;
~~~
- Don't edit a migration that has already run: Flyway/Liquibase detect the checksum change and fail on validate (which is good); add a new migration instead.
- Heavy DDL must not lock for long: PostgreSQL uses {{CREATE INDEX CONCURRENTLY}}; MySQL large tables use gh-ost/pt-online-schema-change, or ALTER ... ALGORITHM=INPLACE/INSTANT where supported.
- **You can roll back code, but migrations only move forward (forward fix)**, which is why the expand phase must be harmless to the old version.

### Common pitfalls
1. **Renaming a column in one step**. Symptom: during the rolling deploy, v1 pods report "column does not exist". Avoid: add the new column, write both, then drop the old one.
2. **The flag is on for 1% of users but the migration has run on 100% of the data**. Symptom: users without the flag still see the new data shape that old code does not understand. Avoid: the data must be readable by both code paths.
3. **Canary without per-version metrics**. Symptom: 5% of traffic fails but the average hides it. Avoid: attach a version label to metrics and compare canary against baseline.
4. **Backfilling with one giant UPDATE**. Symptom: table locks, replicas lag for minutes. Avoid: chunk it, pause between chunks, run off-peak.

### 1-minute interview answer
"Blue-green flips all traffic at once, so rollback is instant but it costs double the resources; canary pours traffic gradually against SLOs and can auto-rollback with Argo Rollouts; feature flags decouple deploy from release, and turning the flag off is enough. But all three only roll back code, never the schema, and during the deploy v1 and v2 run on the same DB. So I make migrations compatible with N-1 using expand-contract: add a nullable column, write both, backfill in batches, switch reads, and drop the old column only after at least one release. The question I always ask when reviewing a migration is: if the app were reverted 30 seconds from now, would the system still run?"

> Senior tip: every time you review a migration, ask yourself "if the app I just deployed is reverted 30 seconds from now, does the system still run?". If the answer is no, the migration is not safe, backups or not.`,
    follow: [
      `How do you compare v1 and v2 responses with shadow traffic without side effects?`,
      `The flag is enabled for 1% of users but the migration has already run on 100% of the data - what's the problem?`,
      `How do you verify in CI that a migration is backward compatible?`
    ]
  },
  'microservices-017': {
    q: `You lead a migration of a 500k-line monolith to microservices with no downtime. Give a step-by-step strangler fig plan, including data migration and the anti-corruption layer.`,
    a: `**Summary:** the **strangler fig** puts a facade/proxy in front of the monolith, then replaces the monolith's parts with new services step by step, shifting traffic gradually through canary/feature flags, syncing data with CDC and reconciliation, until the old part can be deleted entirely. The goal is not "rewrite it clean" but **shrinking the monolith while the product keeps running, with no downtime**. The anti-corruption layer keeps the old model from "infecting" the new service.

### Quick understanding
A strangler fig grows around a host tree, its roots spreading further and further, until the host rots away and the fig stands on its own. Applied to software: you don't demolish the old house and rebuild it (risky, doors closed for months); you **renovate room by room while people still live there**: put up a temporary partition (the facade) so guests enter the new room, move things over gradually, check carefully, and only then tear down the old room. The anti-corruption layer is the **interpreter** standing in between: the new room speaks "the new language" and never has to learn the old house's slang.

### Terminology
- **Strangler fig pattern**: replacing the old system piece by piece, with a routing layer in front.
- **Facade / front proxy**: the layer in front of the monolith (gateway, Nginx, Envoy) that decides which requests go to a new service.
- **Seam**: a "seam line" in the code where a part can be cut out with little impact on the rest.
- **Anti-corruption layer (ACL)**: a translation layer between the old and the new model, keeping the new model clean.
- **CDC (Debezium)**: capturing changes from the monolith DB's log to sync them into the new service's DB.
- **Reconciliation job**: a job that compares the data on both sides and reports differences.
- **Shadow traffic**: duplicating requests to the new service to compare results, without returning them to the user.
- **Branch by abstraction**: creating an interface inside the monolith and switching the implementation from the old module to a client of the new service.

### Step-by-step plan
1. **Measure and cover with tests before touching anything**: distributed tracing + integration tests for exactly the use case being extracted. Why: extracting from a monolith without tests is gambling; tracing shows who is calling what.
2. **Pick the first seam**: a clear boundary, changes independently, **few joins** with the rest, and a team that takes ownership. For example Catalog or Notification; **don't** start with Payments. Why: the first slice is for learning the process at low risk.
3. **Put the facade in place**: a gateway/front proxy routing by path or by %. Why: clients don't need to know anything, and rollback is just changing the route.
4. **Anti-corruption layer**: the new service does not use the monolith's models/DTOs but translates them into its own domain model. Why: otherwise the legacy mess spreads into the new service and you have only changed the address, not separated the boundary.
5. **Data migration** (the hardest part): use **CDC (Debezium)** from the monolith DB to the new service DB; run **dual-run** + a **reconciliation job** comparing both sides, where any difference is a bug. At any moment there is **exactly one source of truth for writes**: either write in the monolith and CDC across to the service, or (later phase) write through the new service with the monolith reading back through API/CDC. You can use **shadow traffic** to compare responses **without** writing side effects.
6. **Shift traffic** with canary + SLOs (5% → 25% → 100%); rollback = change the route, and because the data is already in sync nothing is lost.
7. **Actually clean up**: delete the old module, drop the old tables, remove the route, remove the code. This is the most frequently skipped step.

~~~text
                ┌──► catalog-service (new)  ← traffic 5% → 100%
client ─► facade┤         ▲ CDC + reconciliation
                └──► monolith (old)          ← the rest
  /api/catalog/* takes the top branch; every other path still goes to the monolith
~~~

### Numeric example of progress
~~~text
Q1: Catalog    100% traffic through the new service, 12 tables dropped, -40k lines
Q2: Notification 100%, 5 tables dropped, -15k lines
Q3: Order (hard) 30% canary, dual-run, 0.02% divergence → fix the mapping
Metric: % of traffic through new services + number of lines/tables DELETED from the monolith
~~~

### Signs of failure
- Code only **grows** (monolith and new services side by side forever): you have just built "a second monolith".
- The glue/integration layer balloons and nobody cleans it up.
- Transactions now span services without saga/outbox: you have built a distributed monolith before the split is finished.
- The old team still commits into the already-extracted part of the monolith: nobody truly owns the new service.

### When NOT to strangler
- The domain was wrong from the ground up and needs a full redesign: consider a rewrite, but still use a facade to run in parallel and shift traffic gradually.
- The monolith is already small with clear modules: only extract 1-2 places, or keep a modular monolith.

### Common pitfalls
1. **Writing to two places at once (dual write) without an outbox**. Symptom: the two sides drift apart and you don't know which is right. Avoid: a single write source + CDC, or add an outbox to the monolith first.
2. **The new service copies the monolith's entities wholesale**. Symptom: changing an old table breaks the new service. Avoid: an ACL that translates into its own model.
3. **Never deleting the old code**. Symptom: two years later you still maintain both. Avoid: make deletion part of the Definition of Done for every slice.
4. **Starting with the core module that has the most dependencies**. Symptom: the project drags on and the business loses confidence. Avoid: win quickly on an easy module first.

### 1-minute interview answer
"I use the strangler fig: put a facade in front of the monolith, pick a first seam with a clear boundary and few joins such as Catalog, and write the new service with an anti-corruption layer so it does not inherit the old model. I sync data with Debezium CDC, run dual-run with a reconciliation job, always keep a single source of writes, and use shadow traffic to compare responses. Traffic shifts gradually with canary against SLOs, and rollback is just changing the route. The trade-offs are the time spent running both systems and the cost of syncing. What I stress to the team is the last step: delete the old code and tables; I measure progress by the percentage of traffic through the new services and the number of tables deleted from the monolith."

> Senior tip: measure strangler progress with 2 numbers: **the % of traffic going through the new services** and **the number of modules/tables deleted from the monolith**. Without the second number it isn't a strangler, it's copy-paste into microservices.`,
    follow: [
      `If the monolith has no outbox, how do you dual-write to both sides safely?`,
      `How exactly does the reconciliation job compare the data on both sides?`,
      `When do you choose branch by abstraction instead of putting a proxy at the gateway?`
    ]
  },
  'microservices-018': {
    q: `Where should config and secrets live per the 12-factor app? Compare Spring Cloud Config, Kubernetes ConfigMap/AppConfig and Vault/AWS Secrets Manager, and point out the secret leak traps.`,
    a: `**Summary:** per 12-factor, **config is separated from code**, and environment differences are supplied through the **environment** (build once, deploy everywhere). **Secrets never live in git or in the image**: they are read from a secret manager (Vault, AWS Secrets Manager) at runtime, encrypted, audited for who read them, and rotatable. Ordinary config goes in a ConfigMap/Config Server (with versioning); feature flags that need controlled rollout go in AWS AppConfig.

### Quick understanding
A coffee machine (the artifact) is sold to many cafes. The manufacturer does **not hard-wire** the sugar level or the cup size; each cafe adjusts them with a dial (config/environment). The **key to the cash safe** (a secret) is never taped to the machine's body (the image) or written into the manual (git); it is kept in a **safe with a log of who borrowed it** (Vault/Secrets Manager), and the lock is changed regularly (rotation).

### Terminology
- **12-factor app**: a set of 12 principles for building cloud-native applications (config, logs, processes...).
- **Spring Cloud Config**: a server that supplies configuration (usually from git) to Spring applications.
- **ConfigMap / Secret (K8s)**: Kubernetes objects holding configuration / sensitive data, mounted into a pod as files or env vars.
- **AWS AppConfig**: a service for deploying configuration + feature flags gradually, with automatic rollback driven by CloudWatch alarms.
- **Vault / AWS Secrets Manager**: encrypted secret stores with audit, rotation and (Vault) dynamic secrets.
- **Dynamic secret**: credentials generated per application with a TTL, automatically revoked when they expire.
- **@RefreshScope**: a Spring Cloud annotation that recreates a bean when its configuration changes, without a restart.
- **KMS**: the key management service; data is encrypted with keys that KMS holds.

### 12-factor as it relates to config
1. **III. Config**: URLs, ports and credentials are environment, not hard-coded; the same artifact runs in dev/staging/prod. Why: rebuilding per environment means what you tested is not what you deployed.
2. **IV. Backing services**: DB, queue and mail are all "attached resources" configured externally; changing the env changes the backend.
3. **VI. Processes**: processes are stateless and do not store runtime config in the instance.
4. **XI. Logs**: write to stdout and let the platform collect them; don't depend on the environment's file paths.

### Where to keep config
| | How it works | Pros | Cons |
|---|---|---|---|
| **Spring Cloud Config** | a server reads git; the app uses {{spring.config.import=configserver:...}} | version history, PR review, refresh | one more service that must stay alive, depends on git |
| **K8s ConfigMap** | mount files/env into the pod | native, no extra component | no history (unless managed by GitOps); env vars only change on pod restart, mounted files update after a delay |
| **AWS AppConfig** | deploy config + **feature flags** progressively by %, monitor alarms | safe flag changes, automatic rollback | tied to AWS, needs app integration |
| **Vault / AWS Secrets Manager** | encrypted secrets, audit, **dynamic secrets** (Vault), rotation (Secrets Manager + Lambda) | rotatable, audit trail | extra read latency, needs sensible caching |

Since Spring Cloud 2020.0 (and with Spring Boot 3), the client no longer uses {{bootstrap.yml}} by default ({{@EnableConfigServer}} is server-side only); the client uses config import:

~~~yaml
spring:
  application:
    name: order-service        # the server picks the file by app name + profile
  config:
    import: "optional:configserver:http://config-server:8888"
# secrets: not here; read from Vault/Secrets Manager, for example
# spring.config.import: "aws-secretsmanager:prod/order-db"  (Spring Cloud AWS)
~~~

### The correct secret flow (step by step)
1. **The pod starts** with an identity (Kubernetes ServiceAccount bound to an IAM role via IRSA/Pod Identity, or Vault Kubernetes auth). Why: it needs no secret in order to fetch secrets.
2. **The app reads the secret at boot** from Vault/Secrets Manager and **caches it with a TTL** (for example 5-15 minutes). Why: Secrets Manager rate-limits API calls and charges per call.
3. **Rotation**: Secrets Manager rotates through Lambda; Vault dynamic secrets create a new DB user with a TTL. The app must survive a password change (the connection pool opens new connections with the new secret).
4. **Audit**: who read which secret, and when, is recorded (CloudTrail, Vault audit log).

~~~text
Pod (ServiceAccount) ─IAM role─► Secrets Manager ─► password (cached 10 min)
                                     │ rotate every 30 days (Lambda)
                                     └─ CloudTrail: who read it, when
~~~

### Secret leak traps
- **Git**: a secret in the repo is visible to everyone with read access and **stays in history** after you delete it. If it was already committed, **rotating the key** is the only remedy; deleting the file is not enough.
- **Actuator/dump**: {{/actuator/env}}, {{/actuator/configprops}}, heap dumps. Spring Boot 3 masks values on these endpoints by default (never set {{show-values: ALWAYS}}), and you still must block them from outside networks.
- **Image layers**: {{docker history}} can read ENV and files COPYed into the image; secrets must live outside the image.
- **Reading the secret on every request**: you get throttled exactly when load is high; always cache + refresh in the background.
- **Local .env files** must be gitignored; {{application-local.yml}} is dev-only and never deployed.
- **A Kubernetes Secret is only base64**, not encryption: enable encryption at rest for etcd and tight RBAC, or use the External Secrets Operator to pull from a secret manager.

### Common pitfalls
1. **One code branch / one build per environment**. Symptom: what reaches prod differs from what was tested. Avoid: one artifact, differences only in env/secret references.
2. **@RefreshScope on a bean holding connections**. Symptom: a refresh recreates the DataSource in the middle of a transaction. Avoid: only refresh lightweight beans (timeouts, flags); for DB credentials rely on pool rotation or a rolling restart.
3. **Never practising rotation**. Symptom: when real rotation happens the app dies because it still holds the old password. Avoid: practise rotation regularly, like you practise deploys.
4. **Secrets printed to logs**. Symptom: logs contain a connection string with the password. Avoid: mask them in logging and scan logs with secret-detection tools.

### 1-minute interview answer
"Per 12-factor, config is environment, not code: I build one artifact and deploy it everywhere. Ordinary config goes in ConfigMaps or Spring Cloud Config for versioning and review; feature flags that need gradual rollout go in AWS AppConfig. Secrets always live in Vault or Secrets Manager: the pod authenticates with an IAM identity, the app reads at boot and caches with a TTL, rotation is automatic, and every read is audited. The traps I close: secrets in git and history, actuator env, image layers, and the fact that a Kubernetes Secret is only base64. If a secret was committed, the first action is rotation, not deleting the file. I also allow changing timeouts and flags at runtime so on-call can tune them."

> Senior tip: operational configuration (timeouts, percentage rates) should be changeable at runtime: if changing a timeout needs a redeploy, you will never tune it during a 2am on-call.`,
    follow: [
      `What are the risks of runtime refresh with {{@RefreshScope}} for a bean holding a connection?`,
      `How does a Vault dynamic secret differ from a static secret in terms of rotation?`,
      `How do you detect a secret committed to git with CI?`
    ]
  },
  'microservices-019': {
    q: `A Kafka topic needs a partition count decision. What criteria do you base it on, and explain consumer rebalance: what do cooperative sticky assignor, {{max.poll.interval.ms}} and static membership solve?`,
    a: `**Summary:** partition count = max(expected consumer count, target throughput / throughput of one consumer). Rebalance is the number 1 cause of lag spikes: **cooperative sticky** moves only the partitions that must move, **static membership** ({{group.instance.id}}) avoids a rebalance on pod restart, **{{max.poll.interval.ms}}** detects a consumer that is "silently dead" because it processes for too long.

### Quick understanding
Imagine Kafka as a warehouse with many aisles (partitions). Each aisle is numbered, and goods inside one aisle are always taken out in order. A group of workers (the consumer group) splits the aisles between them: each aisle has exactly one worker, so two people never pick from the same aisle. When a worker joins or quits, the aisles are redistributed - that is a rebalance. And if a worker takes too long on one task, the coordinator assumes they are dead, hands their aisle to someone else - and the whole warehouse pauses to redistribute the work.

### Terminology
- **Partition**: an ordered sub-log inside a Kafka topic.
- **Consumer group**: a set of consumers sharing the same group.id, splitting a topic's partitions between them.
- **Rebalance**: the process of redistributing partitions when a consumer joins or leaves the group.
- **Cooperative Sticky Assignor**: a strategy that revokes only the partitions that really need to move and keeps the rest.
- **Static membership**: a consumer with a fixed group.instance.id, so a quick restart does not trigger a rebalance.
- **max.poll.interval.ms**: the maximum time allowed between two polls; past that threshold the consumer is considered hung and is kicked out of the group.
- **Offset**: the sequence number of a message inside a partition, used to mark how far processing has got.
- **Lag**: the gap between the latest offset and the consumer group's committed offset.

### Choosing the partition count
- **Parallelism**: you can never have more consumers than partitions. If you expect to scale to 32 consumers ⇒ partitions ≥ 32.
- **Throughput**: one consumer handles ~X msg/s (measured). Partitions ≥ desired_throughput / X.
- **Ordering**: a partition is the bottleneck if you need global ordering. More partitions means more ordering lost.
- **Too many partitions**: larger metadata, the controller takes longer to elect leaders, more file handles, slower replication.
- Thumb rule: start at 2-3x the current consumer count and grow gradually (partitions can only grow, never shrink).

### Consumer rebalance - what makes lag jump
- **Eager (old)**: a consumer joins/leaves ⇒ **revokes ALL partitions** → reassignment → processing stops for a few seconds. Rolling deploys = accumulated lag.
- **Cooperative Sticky** ({{partition.assignment.strategy=CooperativeStickyAssignor}}): only **revokes** the partitions that truly need to move, the rest **stay put** ⇒ near-zero downtime. Requires Kafka 2.4+, client 2.4+.
- **Static membership**: set a unique {{group.instance.id}} per pod. A consumer restarting within {{session.timeout.ms}} (45s default) is **not treated as leaving** ⇒ no rebalance. Works with StatefulSets (stable pod names); usually increase {{session.timeout.ms}} to allow enough restart time.
- **{{max.poll.interval.ms}}** (5 minutes default): if processing one batch takes longer than this threshold ⇒ the consumer is considered **hung** ⇒ the coordinator kicks it out of the group ⇒ a spurious rebalance. Raise it (e.g. 15-30 minutes) for heavy batches, and **at the same time set {{max.poll.records}}** lower so it polls more often.

~~~yaml
spring:
  kafka:
    consumer:
      group-id: order-service
      properties:
        partition.assignment.strategy: org.apache.kafka.clients.consumer.CooperativeStickyAssignor
        max.poll.interval.ms: 1800000      # 30 minutes for heavy jobs
        max.poll.records: 100              # poll less, finish faster
        group.instance.id: \${HOSTNAME}     # static membership (StatefulSet: stable pod name)
~~~

### Common pitfalls
- Switching straight from eager (Range) to {{CooperativeStickyAssignor}} in a single rolling deploy ⇒ during the transition the consumers share no common assignor ⇒ {{InconsistentGroupProtocolException}}. You must roll **in 2 steps**: first declare {{[CooperativeStickyAssignor, RangeAssignor]}}, then remove {{RangeAssignor}}.
- Static membership with a **Deployment**: the new pod gets a random HOSTNAME ⇒ a new {{group.instance.id}} ⇒ still a rebalance (the old member is only removed after {{session.timeout.ms}}). Static membership pays off with **StatefulSets** (stable names {{order-0}}, {{order-1}}). If two processes with the same {{group.instance.id}} run at the same time, the later member **fences** the old one ({{FencedInstanceIdException}}).
- Static membership + a large {{session.timeout.ms}} ⇒ if a pod really dies, its partitions **stand still** until the timeout expires.
- {{max.poll.interval.ms}} too large ⇒ a genuinely **hung** consumer (deadlock, an outbound call without a timeout) while the heartbeat thread still runs ⇒ the coordinator doesn't notice in time ⇒ partitions are stuck longer. (A process that is truly dead is caught by {{session.timeout.ms}}.)

### 1-minute interview answer
"When designing a Kafka topic I choose the partition count as max(expected consumers, target throughput divided by the throughput of one consumer), and I use orderId as the key so messages of the same order stay ordered. Rebalance is the number one cause of lag spikes, so I use cooperative sticky to move only the partitions that need to move, and static membership so a pod restart does not trigger a rebalance. On offsets, I commit only after processing, giving at-least-once, and I set max.poll.interval.ms large enough for heavy batches while limiting max.poll.records so polling stays frequent. The trade-off is that more partitions mean more metadata and slower leader election. My experience is to monitor the rebalance rate: healthy is 0 rebalances between deploys, and any rebalance means a bad deploy or a stuck consumer."

> Senior tip: monitor the **rebalance rate** (metric {{rebalance-total}} per minute). Healthy = 0 rebalances between deploys. A rebalance = either a bad deploy, or max.poll.interval.ms too low, or a consumer stuck in processing.`,
    follow: [
      `When you add partitions to a running topic, how does the key mapping change and how do you handle ordering?`,
      `How does cooperative sticky behave when consumers join/leave at the same time?`,
      `Static membership + K8s rolling update: how long should the preStop delay be relative to session.timeout.ms?`
    ]
  },
  'microservices-020': {
    q: `Spring Kafka supports blocking retry ({{DefaultErrorHandler}} + BackOff) and non-blocking retry ({{@RetryableTopic}}). How do the two modes differ, how do you configure the DLT, and how does retry affect ordering?`,
    a: `**Summary:** **Blocking retry** = the container calls the listener again right there on that partition (with backoff) via {{DefaultErrorHandler}} - simple, **preserves ordering** but **blocks the partition**. **Non-blocking retry** = {{@RetryableTopic}} pushes the failed message to separate {{-retry}} topics, and the main consumer keeps processing later messages - **doesn't block the partition** but **loses per-key ordering**. When retries are exhausted the message goes to the DLT ({{-dlt}}).

### Quick understanding
Imagine you are processing orders on a conveyor belt (a Kafka partition). **Blocking retry** is like discovering a defective product, stopping the whole belt, fixing that product, and only then letting it run again - simple, correct order, but the entire line stands still. **Non-blocking retry** is like moving the defective product to a separate shelf (the retry topic) while the main belt keeps running - nothing gets stuck, but a later product can reach the customer before the defective one (ordering is lost). In the end, both send products that cannot be fixed to a "deal with it later" store (the DLT).

### Terminology
- **Blocking retry**: call the listener again on the same partition, seek back to the offset, wait for the backoff - keeps ordering, blocks the partition.
- **Non-blocking retry**: move the failed message to a dedicated retry topic and let the main consumer keep polling - no blocked partition, ordering lost.
- **DLT (Dead Letter Topic)**: the topic holding messages that exhausted their retries, or that cannot be retried, for later debugging/replay.
- **BackOff**: the waiting strategy between retries (FixedBackOff, ExponentialBackOff).
- **Pause partition**: non-blocking retry temporarily pauses the retry topic's partition until the delay is due.
- **exclude / addNotRetryableExceptions**: the list of exceptions that are not retried and go straight to the DLT (for example BusinessException, DeserializationException).
- **Recoverer**: handles the case when retries are exhausted - DeadLetterPublishingRecoverer writes to the DLT.
- **idempotent consumer**: one that can process the same message twice without side effects - mandatory with non-blocking retry.

### Blocking retry ({{DefaultErrorHandler}})
~~~java
@Bean
DefaultErrorHandler errorHandler(KafkaTemplate<Object, Object> template) {
    var recoverer = new DeadLetterPublishingRecoverer(template); // retries exhausted -> topic.DLT
    var handler = new DefaultErrorHandler(recoverer, new FixedBackOff(1_000L, 2)); // 1 initial attempt + 2 retries
    handler.addNotRetryableExceptions(BusinessException.class); // business error -> DLT immediately
    return handler;
}
~~~
- A failing listener ⇒ the error handler **seeks back** to that offset and calls again after the backoff; keep the total backoff short relative to {{max.poll.interval.ms}} so you are not treated as a hung consumer.
- Pros: simple code, **natural ordering** (later messages don't run before the one being retried).
- Cons: the partition stands still while retrying; a long retry (3 x 30s) = the partition stops for 90s ⇒ lag grows.
- Fits when retries are short (a few seconds total) or when **per-key ordering is mandatory**.

### Non-blocking retry ({{@RetryableTopic}})
~~~java
@RetryableTopic(
    attempts = "4",                       // total attempts, including the first
    backoff = @Backoff(delay = 2_000, multiplier = 2, maxDelay = 60_000),
    autoCreateTopics = "true",
    topicSuffixingStrategy = TopicSuffixingStrategy.SUFFIX_WITH_INDEX_VALUE,
    exclude = { BusinessException.class } // business error -> DLT immediately
)
@KafkaListener(topics = "order.created", groupId = "order-service")
public void handle(OrderCreatedEvent evt) { ... }

@DltHandler
public void dlt(OrderCreatedEvent evt) { /* log + alert */ }
~~~
- A failure ⇒ the message is published to {{order.created-retry-0}}, {{-retry-1}}... (the suffix follows the index, as configured above; you can choose a suffix based on the delay value instead), with headers such as {{retry_topic-attempts}}, {{retry_topic-backoff-timestamp}}.
- **How the delay is achieved**: the retry topic's listener sees the message is not due yet ⇒ Spring Kafka **pauses the partition** of that retry topic (KafkaConsumerBackoffManager) and resumes it when due. There is no Kafka Streams or "timer consumer", and the message does **not** return to the original topic - the same listener method is called again from the retry topic.
- The main listener **keeps polling** later messages ⇒ the original partition isn't blocked.
- Some "fatal" exceptions (for example {{DeserializationException}}, {{MessageConversionException}}, {{ClassCastException}}) go straight to the DLT by default, with no retry.

### DLT (Dead Letter Topic)
- When {{attempts}} are exhausted ⇒ the message goes to {{order.created-dlt}} (non-blocking) or {{order.created.DLT}} ({{DeadLetterPublishingRecoverer}} default).
- Headers {{kafka_dlt-exception-fqcn}}, {{kafka_dlt-exception-message}}, {{kafka_dlt-exception-stacktrace}}, {{kafka_dlt-original-topic}}/{{-partition}}/{{-offset}} help with debugging/replay.
- Always **alert on the number of messages in the DLT** - a growing DLT = a bug waiting to be fixed.
- Replay: fix the code/payload then push back to the original topic; the consumer must be idempotent.

### Ordering under retry
- **Non-blocking retry breaks ordering**: A (key=order-1) fails and goes to the retry topic, B (same key, arriving later) is still processed immediately on the original topic ⇒ B runs **before** A.
- If you need per-key ordering ⇒ use **blocking retry**, or design the consumer to tolerate out-of-order events (check version/state, skip events older than the current state).
- Blocking retry preserves ordering but every other key on the same partition must wait too ⇒ only acceptable when retries are short.

### Common pitfalls
1. **Retrying every exception**. Symptom: a validation error is retried 4 times, wastes time, and still ends in the DLT. Avoid: addNotRetryableExceptions / exclude for business and deserialization errors.
2. **Blocking retry with a long total backoff**. Symptom: the partition stands still for minutes, lag grows, and it may even exceed max.poll.interval.ms. Avoid: a short total backoff (a few seconds); use non-blocking retry for long retries.
3. **Enabling @RetryableTopic for events that need ordering**. Symptom: Cancelled is processed before Created. Avoid: blocking retry, or make the consumer check version/state.
4. **Nobody watching the DLT and retry topics**. Symptom: thousands of failed messages sit there for weeks. Avoid: alert on the number of messages entering the DLT and on the lag of each retry topic.

### 1-minute interview answer
"When I design a Kafka consumer I classify errors first: transient errors like timeouts or 503 are retried; business or validation errors go straight to the DLT and are never retried five times. I prefer blocking retry when I must keep the order of events for the same order and the retries are short (a few seconds in total), so the partition does not get stuck. When throughput matters more than ordering I use non-blocking retry (@RetryableTopic), pushing failed messages to separate -retry topics while the main consumer keeps going - but then I must design the consumer to be idempotent because events with the same key can arrive out of order. In the end, exhausted messages go to the DLT, and I always alert on the DLT volume because that signals a bug waiting to be fixed."

> Senior tip: classify errors before choosing a mode: transient errors (timeout, 503) ⇒ retry; business/validation errors ⇒ {{exclude}}/{{addNotRetryableExceptions}} to go to the DLT immediately, don't retry 5 times. Non-blocking retry adds topics + consumers, and you must monitor lag separately for each {{-retry-*}} topic; for events that need ordering (state changes of the same order) think carefully before enabling it.`,
    follow: [
      `Non-blocking retry pauses the partition of the retry topic to wait out the backoff - how do you monitor lag for the -retry topics?`,
      `When should you use blocking retry instead of non-blocking?`,
      `How can a consumer tolerate events with the same key arriving out of order after a retry?`
    ]
  }
});
