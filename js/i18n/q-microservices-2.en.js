/*
 * English translation of js/data/q-microservices.js — task T191. Format: js/core/i18n.js (content overlay).
 * ids: microservices-011 microservices-012 microservices-013 microservices-014 microservices-015 microservices-016 microservices-017 microservices-018 microservices-019 microservices-020
 */
App.i18n.content({
  'microservices-011': {
    q: `Explain the role of API Gateway and BFF, and where they differ. Compare client-side load balancing with server-side (Kubernetes) and service discovery.`,
    a: `**Summary:** A **gateway** is the shared infrastructure front door for every client (TLS, auth, rate limiting, routing); a **BFF** is the aggregation layer **per experience** (web, mobile) written with business logic. Load balancing: **client-side** is flexible but the client must be smart; **server-side** is simpler and adds one hop but gives centralised control.

### API Gateway
- Shared concerns: terminate TLS, authenticate JWT (validate signature, issuer, audience), rate limit/WAF, routing to services, request/response transformation, cache, observability (one place to attach tracing).
- Spring Boot 3 has **Spring Cloud Gateway** (reactive, Netty) - routing via predicates + filters; there are also Envoy, Kong, APISIX, AWS API Gateway.
- **The gateway must not hold business logic**: every time there is a domain if/else in the gateway you are creating a "god tier". It becomes the deploy bottleneck and the place everyone is afraid to touch.

~~~yaml
spring:
  cloud:
    gateway:
      routes:
        - id: order
          uri: lb://order-service          # lb:// => use service discovery to pick an instance
          predicates:
            - Path=/api/orders/**
      default-filters:
        - name: CircuitBreaker
          args: { name: default, fallbackUri: forward:/fallback }
~~~

### BFF (Backend For Frontend)
- Web needs 3 calls merged into one list; mobile needs different fields, a smaller payload, plus recommendations. A BFF **per experience** handles that aggregation.
- Different from a gateway: the gateway handles **policy** (infra), the BFF handles **data/API shape** (product).
- How the two BFFs (web/mobile) share session/auth is the real question - usually they still get the token from a common IdP.
- Trap: BFFs multiply until there are 20 small services nobody maintains; if both experiences use exactly the same API, don't create a BFF.

### Service discovery & load balancing
| | Client-side | Server-side (Kubernetes) |
|---|---|---|
| Who picks the instance | **client** (Eureka/Consul + Spring Cloud LoadBalancer) | the cluster LB (Service/ClusterIP → kube-proxy/iptables or Envoy) |
| Hops | 1 (directly to the instance) | 2 (through Service → pod) |
| Retry/smart routing | the client does it (with its own resilience config) | central LB, usually round-robin only |
| Health check | client/registry query | kube-probe (liveness/readiness) |
| Fits | polyglot, no K8s, need balancing by real load | **K8s environments - recommended** |

- In K8s: a **headless Service** ({{clusterIP: None}}) returns Pod IPs directly for StatefulSets; external-dns + Ingress for the edge.
- DNS-based discovery has cache/staleness: low TTL ⇒ a flood of DNS queries; high TTL ⇒ traffic sent to a dead pod ⇒ always need timeout + retry on the client.

### Pitfall
- A gateway aggregating 10 services with no per-route timeout ⇒ the slowest one eats the whole budget.
- Client-side LB + per-service client retry ⇒ every team rewrites the resilience logic once; this is why the mesh was born.

> Senior tip: in Kubernetes, don't bother writing your own service discovery - Service + CoreDNS + readiness probe already is service discovery; invest in timeout/retry/tracing on the client.`,
    follow: [
      `When should you use gRPC + client-side LB instead of REST through the gateway?`,
      `What is the risk of the web and mobile BFFs sharing the same token?`,
      `How does a headless Service differ from a normal Service, and when do you need one?`
    ]
  },
  'microservices-012': {
    q: `How do you build observability for a system of 30 microservices? Distinguish RED/USE, correlation id and OpenTelemetry, and point out the cardinality trap.`,
    a: `**Summary:** metrics for **trends**, logs for **per-event detail**, traces for **the journey of one request across services**. RED measures per endpoint/service, USE measures per resource; the correlation id (trace_id) is the thread that ties logs to traces.

### The three pillars + how they connect
- **Trace**: a request entering the gateway creates a trace id per the **W3C TraceContext** standard (header {{traceparent}}), propagated over HTTP/Kafka to every service, with each service creating a span.
- **Log**: put the trace/span id into MDC and print it in the log - now finding "the logs of the failed request" only means copying the trace_id from the trace UI into the log backend.
- **Metric**: count RED per service/endpoint, alert on the SLO.

~~~text
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
             │  ────────── trace id ──────────  ── span id ──  flags
Spring: pattern %X{traceId}/%X{spanId} in logback.xml
~~~

### RED vs USE
- **RED** (Rate, Errors, Duration) - per **request**: how many req/s each endpoint gets, what percentage are errors, how long p99 is. Use it for services/APIs.
- **USE** (Utilization, Saturation, Errors) - per **resource**: how much of the thread pool is used, is the queue full, GC pauses, CPU. Use it for the JVM/machine/Kafka.
- Saturation is the earliest predictor of an outage: the queue starts filling before the error rate moves at all.

### OpenTelemetry in practice
- **OTel Java agent** ({{java -javaagent:opentelemetry-javaagent.jar}}): auto-instruments HTTP, JDBC, Kafka, logback - no code changes, exports OTLP → Collector → Jaeger/Tempo/Grafana.
- Spring Boot 3 uses **Micrometer Observation** ({{ObservationRegistry}}) as the abstraction; the Micrometer bridge goes to OTel/Zipkin - write the code once, change the backend whenever you like.
- **Sampling**: 1% head-based will miss exactly the incident you need to see; tail sampling (keep 100% of errors + slow requests) is the right choice at the collector.

### Cardinality trap
Metric labels must be **bounded and predictable**: {{method, status, endpoint}}. Wrong:
~~~java
// WRONG: user_id/order_id as labels => millions of series, Prometheus RAM explodes, slow queries
registry.counter("orders", "order_id", orderId).increment();
// RIGHT: counter by result, keep ids in logs/traces
registry.counter("orders_total", "result", result).increment();
~~~
Signs: the series count grows without bound, Prometheus queries lag, the container gets OOMKilled.

### SLO & alerting
- SLI: availability = {{good requests / total}}, latency = p99 per endpoint.
- A 99.9% SLO ⇒ a 43 minutes/month error budget; alert when the budget burns too fast (burn rate) instead of alerting on every single error.
- Alert on the **symptoms** customers see (5xx, p99) + technical alarms (Kafka lag, GC) - not just CPU.

> Senior tip: with 30 services most of the value comes from **consistency**: the same metric names, the same labels, the same latency unit (ms), the same trace header. As the architect, your first job is to write the observability dictionary, not to install tools.`,
    follow: [
      `How does a trace propagate through Kafka?`,
      `Why is tail sampling better than head sampling for incidents, and what does it cost?`,
      `How exactly do you alert on the error budget burn rate?`
    ]
  },
  'microservices-013': {
    q: `Two internal services call each other. Do you choose OAuth2 client credentials, mTLS or a service mesh? Explain the trade-offs and how authorization works on each side.`,
    a: `**Summary:** **mTLS** answers "which service is this" (identity at the workload level), **OAuth2 client credentials** answers "what may this service do" (permission by scope/audience). The two complement each other: the mesh handles transport + identity, the app handles authorization + audit; the mesh does not replace the app.

### OAuth2 client credentials
- Service A gets a token from the IdP (Keycloak, Auth0, Cognito, Entra) using {{client_id}}/{{client_secret}} (or the safer private_key_jwt), with a short TTL (5–15 minutes), **cached until it expires** then refreshed - don't request a token per request.
- Scope/audience is attached per API: {{scope=orders.read orders.write}}, and the resource server **must validate {{audience}}** - if a token issued to service X is still accepted by service Y, scope is meaningless.
- Spring Boot 3:
~~~java
http.oauth2Client(o -> o.clientRegistrationRepository(reg))          // client side requests the token
    .oauth2ResourceServer(r -> r.jwt(j -> j.decoder(jwtDecoderWithAudienceValidator()))); // server side validates JWT + audience (JwtClaimValidator on the decoder)
~~~
- Problem: **secret sprawl** (client_secret in every service config) ⇒ must rotate periodically, store in Vault/KMS. When delegating on behalf of someone, use token exchange (RFC 8693).

### mTLS
- Authentication **with cryptographic proof**: a mutual TLS connection ⇒ identity comes from **the peer's certificate**, not from a header anyone can forge.
- Short-lived workload identity (SPIFFE/SPIRE issues certificates with a ~1 hour lifetime, auto-rotated) - no more "a 2-year cert pasted everywhere".
- Implementing mTLS per service yourself is very painful (certificate distribution, rotation, SAN) ⇒ that is why the mesh was born.

### Service mesh (Istio, Linkerd)
- Sidecar (Envoy) intercepts every connection: **automatic mTLS**, retry/timeout, LB, telemetry (RED out of the box) - the Java app doesn't have to be rewritten.
- Trade-off: an extra hop and a few ms of latency, CPU/RAM per pod (sidecar), more operational components, harder debugging when packets go through a proxy.
- Fits: **polyglot/multi-team**, many services, wanting uniform mTLS + traffic policy. Doesn't fit: 3–5 services, a thin team.

### Authorization on each side (defense in depth)
1. **Network**: deny-by-default east-west (Kubernetes NetworkPolicy, mesh AuthorizationPolicy) - "internal" does not mean "trusted".
2. **Authenticate**: mTLS for workload identity; JWT for service/user delegation identity.
3. **Authorize**: least-privilege scope/role, evaluated in the service (don't trust an {{X-User}} header coming from the network).
4. **Audit**: log who called whom, with which scope, with what result - mandatory for money-related business.

### Production pitfalls
- Scope {{*}} for every service ⇒ one compromised service means the whole system.
- Secrets in env vars / image layers: leaked via {{/actuator/env}}, crash dumps, {{docker history}} ⇒ use a secret manager read at runtime.
- Mesh "automatic mTLS" but namespaces with different policy ⇒ some paths are still silently plaintext - verify with {{istioctl analyze}}/policy.

> Senior tip: secrets and certificates must be **rotatable without redeploying the whole cluster**. If rotation means downtime, you don't have a plan - measure it with an actual rotation exercise once a quarter.`,
    follow: [
      `When would you choose private_key_jwt instead of client_secret_basic?`,
      `How does the mesh handle telemetry compared with instrumenting the app with the OTel agent?`,
      `How do you enforce least-privilege scopes across dozens of services?`
    ]
  },
  'microservices-014': {
    q: `How do you version APIs to stay backward compatible? Explain expand–contract and how consumer-driven contract testing runs in CI.`,
    a: `**Summary:** don't bump the version on every release - **only add fields, never break**; breaking changes follow the **expand → migrate consumers → contract** cycle (a two-phase deploy, at least 1 release apart). Consumer-driven contract tests catch breaks in CI instead of in production.

### Choosing a versioning strategy
| Approach | Pros | Cons |
|---|---|---|
| URI (/v2) | explicit, cacheable, easy to route | duplicates resources, links scattered |
| Header ({{X-API-Version}}) | clean URL, version per client | hard to test, can't be linked |
| Query (?version=2) | visible, easy to log | bloats the URL, complex cache keys |
| Media type | REST-proper | poor tooling, few teams use it |

- Recommendation: **URI versioning for major breaks** (simple, everyone understands it), header/query for small variations.
- Compatibility rules (JSON): adding optional fields is OK; **do not** rename, change the type, change the meaning, remove a field, or change the date format. Consumers must ignore unknown fields - Spring Boot (Jackson) disables {{FAIL_ON_UNKNOWN_PROPERTIES}} by default so adding fields is safe; **but** changing "2024-05-01" to epoch millis is a silent break.

### Expand–contract (parallel change)
~~~text
Phase 1 (EXPAND):   ALTER TABLE orders ADD COLUMN status_v2 VARCHAR(16);   ← add a nullable column, OLD code still runs
                    NEW code writes both status (old) and status_v2 (new), backfill gradually
Phase 2:            deploy the consumer reading status_v2; verify with metrics comparing the two columns
Phase 3 (CONTRACT): after at least 1 release, ALTER TABLE orders DROP COLUMN status
~~~
Always deploy in this order: **producer expands first → consumer switches to reading the new shape → producer contracts afterwards**. Never combine "change the schema + start using the new schema" in a single deploy: rolling back the app does not roll back the schema.

### Consumer-driven contract testing
- **Pact** (JVM): the consumer writes expectations ("I need field X, of type Y, and this endpoint returns 201") → produces a pact file → **the provider verifies that pact in the provider's CI**. There is a Pact Broker for storage + **can-i-deploy**: service B v1.2 can only deploy once the provider has confirmed the contract.
- **Spring Cloud Contract**: provider-driven - the provider writes a DSL and generates a stub jar for consumer tests to run offline (no shared environment needed).
- Unlike traditional integration tests: contract tests encode **the real consumption story**, run thousands of times per CI, and don't need to compose the whole system.

### When a break is unavoidable
- **Sunset header** ({{Sunset: Wed, 01 Jan 2026 00:00:00 GMT}}) + {{Deprecation: true}}, announced 6–12 months ahead.
- Measure usage of the old version (metrics by version header/URL) - stop when the numbers reach zero, not on a hunch.
- The "N-1" strategy: support only 2 versions at a time.

> Senior tip: most breaks come from **format changes**, not schema changes. Adding contract tests for date/gender/currency formats is 100× cheaper than fixing production parse failures.`,
    follow: [
      `When do you create /v2 instead of just adding fields?`,
      `Pact or Spring Cloud Contract - which do you choose, and why?`,
      `How do you retire an old API version without breaking clients that have gone quiet?`
    ]
  },
  'microservices-015': {
    q: `When do you apply CQRS and when do you also add event sourcing? List the benefits, the real costs and the traps you hit in production.`,
    a: `**Summary:** **CQRS** separates the write model and the read model (it can be just 2 tables, 2 services, 2 databases); **Event sourcing** stores **the event stream** as the source of truth instead of the current state. CQRS does not require ES; ES almost always comes with CQRS. Both are a **trade-off of complexity for query/scale/audit**, not a default correct choice.

### CQRS - why, when
- When the write model (normalized, many FKs) serves transactions well but **business queries need a different shape** (dashboards, search, joins across aggregates).
- Benefits: a flat (denormalized) read model gives O(1) queries; read scaling is independent (read replica/Elasticsearch); each side optimises on its own.
- Real costs:
  - **Eventual consistency**: a user creates something and immediately lists it, it may not be there yet ⇒ the UI must show a status, or do read-your-write by routing straight to the primary.
  - Two models ⇒ mapping code, migrations, the "I wrote it but it doesn't show" bug.
  - If you don't need it, don't: CRUD over 20 endpoints plus CQRS = 20 more things that must be kept in sync.

### Event sourcing - the source of truth is the event log
~~~text
order-123 stream: [OrderCreated(v1)] [ItemAdded] [PaymentTaken(v2)] [Shipped]
                                      snapshot ──► current state = fold the events
~~~
- **Benefits**: a complete audit trail (finance, healthcare - "why is this amount what it is?" answered from the log, not from a trigger log that has been disabled); **temporal queries** ("the state at 10am Tuesday" - replay up to that point); projections can be rebuilt at any time (rebuild Elastic from zero); decoupling: adding a new consumer doesn't touch the producer.
- **Costs & production traps**:
  - **Event evolution**: you must not modify old events; you have to **upcast** (read an event v1 with v2 logic) when reading an old stream.
  - Replaying the whole stream per request is **O(n)** ⇒ you need periodic **snapshots** (every 50–100 events) and a projection rebuild tool.
  - "Right to be forgotten": you must **anonymize events** rather than delete them (deleting breaks stream integrity).
  - Difficult debugging: the state is hidden in 50 events, nobody can see "what the current value is" - a stream viewer tool is mandatory.
  - Storage grows: append-only + snapshots; partition by aggregateId so a stream doesn't grow without bound.

### When to choose
| Situation | Suggestion |
|---|---|
| Internal CRUD, balanced reads and writes | **no** - a normal repository is enough |
| Complex queries, reads 50× the writes | CQRS (a separate read model) |
| Audit is mandatory, you need replay/time-travel, event-rich domain (payments, games) | ES + CQRS |
| Simplify the data model for a new team | don't use ES - you'll pay with 3 months of onboarding |

- Start with **CQRS-lite**: write through service A, read from a read replica/cache; add an event store only when you really need history/replay.

> Senior tip: every time someone proposes event sourcing, ask "who will build the projection rebuild tool and who is on call when the projection drifts?" - if there's no answer, that's technical debt wrapped in a buzzword.`,
    follow: [
      `What do you do when a snapshot is corrupt? Who owns snapshot versioning?`,
      `If CQRS doesn't use ES, how do you keep the read model in sync?`,
      `How does upcasting events work concretely in Java code?`
    ]
  },
  'microservices-016': {
    q: `Compare blue-green, canary and feature flags. For database schema changes, how do you roll back safely? Explain the expand–contract rule when migrating.`,
    a: `**Summary:** blue-green **flips traffic in one shot** (rollback = flip back), canary **pours traffic in stages** against SLOs (rollback = stop pouring), feature flags **decouple deploy from release** (toggle at runtime). But **rolling back the app does not roll back the schema** - so migrations must be designed so they **don't need a rollback**.

### Three strategies
| | Blue-green | Canary | Feature flag |
|---|---|---|---|
| How | 2 environments, flip the LB | 1% → 5% → 50% → 100% | deploy "dark", enable/disable by flag |
| Rollback | **instant** (flip back) | stop pouring traffic | **turn the flag off**, no redeploy |
| Monitoring | compare before/after | SLO/error budget per % of traffic | per % of users seeing the flag |
| Cost | double the resources | needs good metrics + routing | needs a flag system + test matrix |
| Risk | stateful/WS connections stick | sticky sessions, user state | **flag debt** - flags sprout with nobody cleaning them up |

- Canary is the strongest option when you have **trustworthy SLIs/SLOs** (error rate, latency p99 per version) + auto-promote/rollback (Argo Rollouts, Flagger, ECS blue/green with CloudWatch alarms).
- Feature flags: separate "deployed" from "released"; good for A/B tests, dark launch (call the new service in parallel and compare results - **shadow traffic**). Traps: the test matrix ×2, flags that live forever, unreadable branching code ⇒ put a removal deadline in the ticket.

### Rollback with DB migrations - the real question
~~~text
deploy v2 (migration + code) ── failure ──► roll back to v1
        └─ the code returns OK, but the schema has been DROPped/retyped ⇒ v1 IS DEAD
~~~
Rule: **the migration must be backward compatible with the N-1 version of the app.** Schema changes follow **expand–contract**, at least one release apart:

~~~sql
-- PHASE 1 (EXPAND) - deploy v1.1: add, don't break
ALTER TABLE orders ADD COLUMN status_v2 VARCHAR(16);   -- nullable, old v1 still runs normally
-- PHASE 2 - code writes both columns, background backfill (chunked, avoid a long transaction holding locks)
UPDATE orders SET status_v2 = status WHERE status_v2 IS NULL;
-- PHASE 3 (CONTRACT) - only once you are 100% sure nobody reads the old column
ALTER TABLE orders DROP COLUMN status;
~~~
- Don't edit a migration that has already run (Flyway/Liquibase detect the checksum change and fail on validate/migrate - which is good); add a new changeset instead.
- Heavy DDL: **no long locks** - Postgres {{CREATE INDEX CONCURRENTLY}}, MySQL big tables use gh-ost/pt-online-schema-change.
- You can roll back **code**, migrations only **move forward** (forward fix) - which is why Phase 1 must be harmless to the old version.

> Senior tip: every time you review a migration, ask yourself "if the app I just deployed is reverted 30 seconds from now, does the system still run?" If the answer is no, the migration isn't safe, backups or not.`,
    follow: [
      `How do you compare v1 and v2 responses with shadow traffic without side effects?`,
      `The flag is enabled for 1% of users but the migration has already run on 100% of the data - what's the problem?`,
      `How do you verify in CI that a migration is backward compatible?`
    ]
  },
  'microservices-017': {
    q: `You lead a migration of a 500k-line monolith to microservices with no downtime. Give a step-by-step strangler fig plan, including data migration and the anti-corruption layer.`,
    a: `**Summary:** **Strangler fig** = put a facade/proxy in front of the monolith, gradually "encircle" and swallow the old modules with new services, shifting traffic over via feature flags/canary. The goal is not "rewrite it clean" but **shrinking the old module while the product keeps running**.

### Step-by-step plan
1. **Measure & cover before touching anything**: distributed tracing + integration tests for exactly the use case being extracted. A monolith without tests = extraction is a gamble.
2. **Pick the first seam** by these criteria: clear boundary, changes independently, **no complex joins** with the rest, a team that owns it. For example the "Catalog" or "Notification" module - don't start with "Payments".
3. **Put a facade in place**: gateway/front-proxy routing by path/percentage:
~~~text
/api/catalog/*  ──► catalog-service   (new, traffic 5% → 100%)
              └──► monolith          (old, the rest)
~~~
4. **Anti-corruption layer**: the new service does not use the monolith's models/DTOs. Translate into its own domain model - otherwise the legacy "poison" spreads into the new service and you've only split the address, not the boundary.
5. **Data migration** (the hardest part):
   - **CDC (Debezium)** from the monolith DB to the new service DB + **dual-run**: read both, compare (a reconciliation job), any difference is a bug.
   - Writes: only **one source of truth** at a time - either write through the new service (the monolith reads it back via API), or write in the monolith and CDC across to the service (if there's no outbox yet, add the outbox first).
   - Shadow traffic: mirror requests to the new service, compare responses, **no** side effects written.
6. **Shift traffic** with canary + SLOs; rollback = flip back, and the data is already in sync so nothing is lost.
7. **Actually clean up**: delete the old module, drop the old tables, **remove the route, remove the code**. This is the most frequently skipped step.

### Signs of failure
- Code only **grows** (monolith + new services in parallel forever) ⇒ you have just built "a second monolith".
- The glue/integration layer balloons and nobody cleans it up.
- Transactions now span services without saga/outbox - this kind of strangler **creates a distributed monolith before the split is finished**.
- The old team still commits to the monolith in parallel ⇒ nobody truly owns the new service.

### When NOT to strangler
- The domain was wrong from the ground up, it needs a full redesign and the team is small ⇒ consider a rewrite inside the new product (but you still need the strangler to run traffic in parallel).
- The monolith is already small with clear modules ⇒ you only need to extract 1–2 places.

> Senior tip: measure strangler progress with 2 numbers: **the % of traffic going through the new services** and **the number of modules/tables deleted from the monolith**. Without the second number it isn't a strangler, it's copy-paste into microservices.`,
    follow: [
      `If the monolith has no outbox, how do you dual-write to both sides safely?`,
      `How exactly does the reconciliation job compare the data on both sides?`,
      `When do you choose branch by abstraction instead of putting a proxy at the gateway?`
    ]
  },
  'microservices-018': {
    q: `Where should config and secrets live per the 12-factor app? Compare Spring Cloud Config, Kubernetes ConfigMap/AppConfig and Vault/AWS Secrets Manager, and point out the secret leak traps.`,
    a: `**Summary:** 12-factor: **config separated from code**, environment differences supplied by the **environment** (build once, deploy everywhere); **secrets are not in git or the image** - read from a secret manager at runtime, encrypted, audited and rotatable.

### 12-factor as it relates to config
- **III. Config**: URLs, ports, credentials are environment, not hard-coded in the codebase - the same artifact runs in dev/staging/prod.
- **VI. Processes**: stateless, don't store runtime config in the instance.
- **IV. Backing services**: everything is "another service" (DB, queue, mail) ⇒ changing the env changes the backend.
- **XI. Logs**: write to stdout, don't write files because "they don't need to know the path" - that is an environment-dependent form.

### Where to keep config
| | How it works | Pros | Cons |
|---|---|---|---|
| **Spring Cloud Config** | git-backed server, app {{spring.config.import=configserver:...}} | version history, PR review, push notification refresh | another service must stay alive, git = single point |
| **K8s ConfigMap** | mount files/env into the pod | native, no extra component | not versioned, secrets should be kept separate, a change = restart (or a reload sidecar) |
| **AWS AppConfig** | deploy config + **feature flags** with gradual rollout, %, alarms on metrics | safe for flags, controlled rollout | locked to AWS, needs app instrumentation |
| **Vault / AWS Secrets Manager** | encrypted secrets, audit, **dynamic secrets** (DB users created on demand, TTL) | rotatable, audit trail | secret read latency, needs sensible caching |

Since Spring Cloud 2020.0 (and Spring Boot 3), the client no longer uses {{bootstrap.yml}} by default ({{@EnableConfigServer}} is server-side only) - use import:

~~~yaml
spring:
  config:
    import: "optional:configserver:http://config-server:8888"
  application:
    name: order-service        # the server picks profile/label based on this
~~~

### Secret leak traps
- **Git**: a secret in the repo = exposed to everyone with read access, and still in history after you "delete" it. If it already happened: **rotating the key** is the only remedy, deleting the file is not enough.
- **Actuator/dump**: {{/actuator/env}}, {{/actuator/configprops}}, heap dumps, logs {{DataSource password: ***}} but it is still somewhere else - Boot 3 masks values in /env by default (don't enable {{show-values=ALWAYS}}), and you must still block these endpoints outside the internal network.
- **Image layers**: {{docker history}} can read ENV ⇒ keep secrets in a secret manager, read them at boot.
- **Reading the secret per request**: AWS Secrets Manager has rate limits ⇒ **cache by TTL** (e.g. 5–15 minutes) and refresh in the background, otherwise burst traffic gets throttled exactly when things are tense.
- **Local .env** must be gitignored; the {{application-local.yml}} profile is for dev, never deployed.

### Doing it right
1. "Clean" config (port, features, URLs) → ConfigMap/Config server, with versioning.
2. Secrets (passwords, keys) → Vault/Secrets Manager/KMS, encrypted at rest, **audit who reads them**, TTL/dynamic credentials.
3. **Automatic rotation** (30–90 days) and test rotation like you test deploys.
4. Environment differences via **env/secret references**, not via 3 code branches.

> Senior tip: configuration flags (timeouts, percentage rates) should be readable at runtime - if changing a timeout needs a redeploy, you'll never tune it during a 2am on-call.`,
    follow: [
      `What are the risks of runtime refresh with {{@RefreshScope}} for a bean holding a connection?`,
      `How does a Vault dynamic secret differ from a static secret in terms of rotation?`,
      `How do you detect a secret committed to git with CI?`
    ]
  },
  'microservices-019': {
    q: `A Kafka topic needs a partition count decision. What criteria do you base it on, and explain consumer rebalance: what do cooperative sticky assignor, {{max.poll.interval.ms}} and static membership solve?`,
    a: `**Summary:** partition count = max(expected consumer count, target throughput / throughput of one consumer). Rebalance is the number 1 cause of lag spikes: **cooperative sticky** moves only the partitions that must move, **static membership** ({{group.instance.id}}) avoids a rebalance on pod restart, **{{max.poll.interval.ms}}** detects a consumer that is "silently dead" because it processes for too long.

### Choosing the partition count
 - **Parallelism**: you can't have more consumers than partitions. If you expect to scale to 32 consumers ⇒ partitions ≥ 32.
 - **Throughput**: one consumer handles ~X msg/s (measured). Partitions ≥ desired_throughput / X.
 - **Ordering**: a partition is the bottleneck if you need global ordering. More partitions = more ordering lost.
 - **Too many partitions**: larger metadata, the controller takes longer to elect leaders, more file handles, slower replication.
 - Thumb rule: start at 2–3× the current consumer count, grow gradually (partitions can only grow, never shrink).

### Consumer rebalance - what makes lag jump
 - **Eager (old)**: a consumer joins/leaves ⇒ **revokes ALL partitions** → reassignment → processing stops for a few seconds. Rolling deploys = accumulated lag.
 - **Cooperative Sticky** ({{partition.assignment.strategy=CooperativeStickyAssignor}}): only **revokes** the partitions that truly need to move, the rest **stay put** ⇒ near-zero downtime. Requires Kafka 2.4+, client 2.4+.
 - **Static membership**: set a unique {{group.instance.id}} per pod. A consumer restarting within {{session.timeout.ms}} (45s default) is **not treated as leaving** ⇒ no rebalance. Works with StatefulSets (stable pod names); usually increase {{session.timeout.ms}} to allow enough restart time.
 - **{{max.poll.interval.ms}}** (5 minutes default): if processing one batch takes longer than this threshold ⇒ the consumer is considered **hung** ⇒ the coordinator kicks it out of the group ⇒ a spurious rebalance. Raise it (e.g. 15–30 minutes) for heavy batches, and **at the same time set {{max.poll.records}}** lower so it polls more often.

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

### Production pitfalls
 - Switching straight from eager (Range) to {{CooperativeStickyAssignor}} with a single rolling deploy ⇒ during the transition the consumers have no common assignor ⇒ {{InconsistentGroupProtocolException}}. You must roll **in 2 steps**: first declare {{[CooperativeStickyAssignor, RangeAssignor]}}, then remove {{RangeAssignor}}.
 - Static membership with a **Deployment**: the new pod gets a random HOSTNAME ⇒ a new {{group.instance.id}} ⇒ still a rebalance (the old member is only removed after {{session.timeout.ms}}). Static membership pays off with **StatefulSets** (stable names {{order-0}}, {{order-1}}). If two processes with the same {{group.instance.id}} run at the same time, the later member **fences** the old one ({{FencedInstanceIdException}}).
 - Static membership + a large {{session.timeout.ms}} ⇒ if a pod really dies, its partitions **stand still** until the timeout expires.
 - {{max.poll.interval.ms}} too large ⇒ a genuinely **hung** consumer (deadlock, an outbound call without a timeout) while the heartbeat thread still runs ⇒ the coordinator doesn't notice in time ⇒ partitions are stuck longer. (A process that is truly dead is caught by {{session.timeout.ms}}.)

 > Senior tip: monitor the **rebalance rate** (metric {{rebalance-total}} per minute). Healthy = 0 rebalances between deploys. A rebalance = either a bad deploy, or max.poll.interval.ms too low, or a consumer stuck in processing.`,
    follow: [
      `When you add partitions to a running topic, how does the key mapping change and how do you handle ordering?`,
      `How does cooperative sticky behave when consumers join/leave at the same time?`,
      `Static membership + K8s rolling update: how long should the preStop delay be relative to session.timeout.ms?`
    ]
  },
  'microservices-020': {
    q: `Spring Kafka supports blocking retry ({{DefaultErrorHandler}} + BackOff) and non-blocking retry ({{@RetryableTopic}}). How do the two modes differ, how do you configure the DLT, and how does retry affect ordering?`,
    a: `**Summary:** **Blocking retry** = the container calls the listener again right there on that partition (with backoff) via {{DefaultErrorHandler}} – simple, **preserves ordering** but **blocks the partition**. **Non-blocking retry** = {{@RetryableTopic}} pushes the failed message to separate {{-retry}} topics, the main consumer keeps processing later messages – **doesn't block the partition** but **loses per-key ordering**. When retries are exhausted the message goes to the DLT ({{-dlt}}).

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
- A failing listener ⇒ the error handler **seeks back** to that offset and calls again after the backoff; keep the total backoff short relative to {{max.poll.interval.ms}} so you aren't treated as a hung consumer.
- Pros: simple code, **natural ordering** (later messages don't run before the one being retried).
- Cons: the partition stands still while retrying; a long retry (3 × 30s) = the partition stops for 90s ⇒ lag grows.
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
- A failure ⇒ the message is published to {{order.created-retry-0}}, {{-retry-1}}… (by default the suffix follows the delay, e.g. {{-retry-2000}}), with headers such as {{retry_topic-attempts}}, {{retry_topic-backoff-timestamp}}.
- **How the delay is achieved**: the listener of the retry topic sees the message isn't due yet ⇒ Spring Kafka **pauses the partition** of that retry topic (KafkaConsumerBackoffManager) and resumes it when due. There is no Kafka Streams or "timer consumer", and the message does **not** go back to the original topic – the listener method is called again from the retry topic.
- The main listener **keeps polling** later messages ⇒ the original partition isn't blocked.
- Some "fatal" exceptions (e.g. {{DeserializationException}}, {{MessageConversionException}}, {{ClassCastException}}) go straight to the DLT by default, with no retry.

### DLT (Dead Letter Topic)
- When {{attempts}} are exhausted ⇒ the message goes to {{order.created-dlt}} (non-blocking) or {{order.created.DLT}} ({{DeadLetterPublishingRecoverer}} default).
- Headers {{kafka_dlt-exception-fqcn}}, {{kafka_dlt-exception-message}}, {{kafka_dlt-exception-stacktrace}}, {{kafka_dlt-original-topic}}/{{-partition}}/{{-offset}} help with debugging/replay.
- Always **alert on the number of messages in the DLT** – a growing DLT = a bug waiting to be fixed.
- Replay: fix the code/payload then push back to the original topic; the consumer must be idempotent.

### Ordering under retry
- **Non-blocking retry breaks ordering**: A (key=order-1) fails and goes to the retry topic, B (same key, arriving later) is still processed immediately on the original topic ⇒ B runs **before** A.
- If you need per-key ordering ⇒ use **blocking retry**, or design the consumer to tolerate out-of-order events (check version/state, skip events older than the current state).
- Blocking retry preserves ordering but every other key on the same partition must wait too ⇒ only acceptable when retries are short.

> Senior tip: classify errors before choosing a mode: transient errors (timeout, 503) ⇒ retry; business/validation errors ⇒ {{exclude}}/{{addNotRetryableExceptions}} to go to the DLT immediately, don't retry 5 times. Non-blocking retry adds topics + consumers, and you must monitor lag separately for each {{-retry-*}} topic; for events that need ordering (state changes of the same order) think carefully before enabling it.`,
    follow: [
      `Non-blocking retry pauses the partition of the retry topic to wait out the backoff - how do you monitor lag for the -retry topics?`,
      `When should you use blocking retry instead of non-blocking?`,
      `How can a consumer tolerate events with the same key arriving out of order after a retry?`
    ]
  }
});
