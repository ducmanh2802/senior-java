/*
 * English translation of js/data/q-api.js — task T963. Format: js/core/i18n.js (content overlay).
 * ids: api-038
 */
App.i18n.content({
  'api-038': {
    q: `API gateway pattern: how are routing, auth, rate limiting, circuit breaker, and request/response transformation handled at the gateway? When to use a gateway vs a service mesh?`,
    a: `**Summary:** The API gateway is the single entry point: routing by path/host, TLS termination, auth (JWT/API key), rate limiting, circuit breaker, request/response transformation, and aggregation. A service mesh (Istio/Linkerd) handles east-west traffic between services with mTLS, retries, and circuit breakers in sidecars. The gateway is for north-south (client to cluster); the mesh is for east-west (service to service).

### Quick understanding
A gateway is like a building receptionist: checks ID, directs visitors, limits the number of guests. A service mesh is like the internal security system between departments: each department has its own guard (sidecar) checking people moving between rooms.

### Gateway responsibilities
- Routing: path/host to upstream service.
- TLS termination.
- Authn/authz: JWT validation, API key, OAuth2.
- Rate limiting per consumer.
- Circuit breaker, timeout, retry.
- Request/response transform: header injection, body rewrite.
- Aggregation: BFF pattern, composing multiple services.
- Observability: access log, metrics, tracing.

### Gateway options
- Spring Cloud Gateway (reactive, Java).
- Kong, Envoy, AWS API Gateway, Apigee.
- Trade-off: managed (AWS) vs self-hosted (Kong/Envoy).

### Gateway vs Service Mesh
- Gateway: north-south, client-facing, coarse-grained policy.
- Mesh: east-west, service-to-service, fine-grained, mTLS, traffic splitting.
- Can combine: gateway at the edge plus mesh inside the cluster.
- Mesh overhead: sidecar memory/CPU, complexity; not needed with few services.

### In production
- Symptom: gateway becomes a bottleneck (single point of failure) -> scale horizontally, health checks.
- Measure: added latency, error rate, throughput.
- Tuning: connection pool, timeout, response caching.

### Sample 1-minute spoken answer
"API gateway is the entry point: routing, TLS, auth, rate limit, circuit breaker, transform, aggregation. Service mesh handles east-west with mTLS in sidecars. Gateway for north-south, mesh for east-west; combine when both are needed."

### Real-world example
A system with 25 microservices, each service validating JWT itself, applying rate limits itself, configuring CORS itself - each one differently, and one service forgetting to check token expiry. Introducing Spring Cloud Gateway (or Kong): centralized token validation and rate limiting at the gateway, path-based routing, attaching {{X-Request-Id}}/traceparent, unified CORS and error bodies. Lessons after 3 months: (1) a dev put business logic into a gateway filter (calculating shipping fees) -> every business change required a gateway deploy, risking the whole system - moved it back into the service; (2) downstream services still must check authorization because the gateway only knows "who", not "what can be done with which resource"; (3) the gateway runs at least 3 replicas, with per-route circuit breakers so one slow service does not exhaust gateway resources. Service mesh (Istio, Linkerd) was considered later for mTLS and retries between internal services - an east-west problem, distinct from the gateway handling north-south traffic.

> Senior tip: don't put business logic in the gateway; keep the gateway stateless and thin; separate BFFs for mobile/web to avoid coupling clients to backend evolution.`,
    follow: [
      'How does the Spring Cloud Gateway filter chain work and when to use a custom filter?',
      'How does a service mesh sidecar (Envoy) intercept traffic using iptables?',
      'Gateway aggregation vs client-side composition: trade-off on latency and coupling.'
    ]
  }
});
