/*
 * English translation of js/data/q-api.js — task T186. Format: js/core/i18n.js (content overlay).
 * ids: api-011 api-012 api-013 api-014 api-015 api-016 api-017
 */
App.i18n.content({
  'api-011': {
    q: `Design a webhook sent to a partner (partner integration): HMAC signature, retry with exponential backoff, idempotency key, ensuring event ordering. Example: bank sends transaction notification to e-wallet partner.`,
    a: `**Summary:** Webhook = HTTP callback from server → partner when an event occurs. Security: HMAC-SHA256 signature + timestamp. Reliability: retry with exponential backoff + dead letter queue. Idempotency: partner deduplicates via {{X-Delivery-ID}}. Ordering: sequence number per resource + partition by account.

### Production-Grade Webhook Architecture
~~~text
Bank Core System          Webhook Dispatcher          Partner (E-wallet)
     │                          │                          │
     ├─ Event: TXN_CREATED ───►│                          │
     │                          ├─ Persist Outbox (DB)    │
     │                          │   (event_id, payload,   │
     │                          │    target_url, hmac_key,│
     │                          │    retry_count, status) │
     │                          ▼                          │
     │                     Dispatcher Pool                │
     │                          │                          │
     │                          ├─ POST /webhook/txn      │
     │                          │  X-Delivery-ID: uuid    │
     │                          │  X-Timestamp: unix-ms   │
     │                          │  X-Signature: HMAC      │
     │                          │  X-Sequence: 1001       │
     │                          │  {event: TXN_CREATED...}│
     │                          ▼                          │
     │                     Partner validates               │
     │                          │                          │
     │                          ◄── 200 OK (processed)    │
     │                          │                          │
     │                          ├─ Mark delivered         │
     │                          │                          │
     │                     (if fail)                       │
     │                          ├─ Schedule retry         │
     │                          │  backoff: 10s, 30s, 1m, │
     │                          │  5m, 15m, 1h... (max 72h)│
     │                          ▼                          │
~~~

### Payload & Signature
~~~json
// Request body
{
  "eventId": "evt_abc123",
  "eventType": "TRANSACTION_COMPLETED",
  "timestamp": "2024-01-15T10:30:00.123Z",
  "sequence": 1001,
  "data": {
    "transactionId": "txn_001",
    "accountId": "acc_123",
    "amount": 500000,
    "currency": "VND",
    "status": "SUCCESS"
  }
}

// Headers
X-Delivery-ID: dlv_xyz789          // KEPT UNCHANGED across all retries of the same event (for partner dedup)
X-Timestamp: 1705315800123         // Unix ms, prevent replay > 5min
X-Signature: sha256=abcdef...      // HMAC-SHA256(timestamp + "." + payload, secret)
X-Sequence: 1001                   // ordering per account
~~~

### HMAC Verification (Partner Side)
~~~java
@PostMapping("/webhook/transactions")
ResponseEntity<String> receive(
        @RequestHeader("X-Signature") String signature,
        @RequestHeader("X-Timestamp") long timestamp,
        @RequestHeader("X-Delivery-ID") String deliveryId,
        @RequestBody String payload) {
    
    // 1. Check timestamp (replay protection)
    if (Math.abs(System.currentTimeMillis() - timestamp) > 5 * 60 * 1000) {
        return ResponseEntity.status(400).body("Timestamp too old");
    }
    
    // 2. Verify HMAC (sign timestamp too so attacker cannot swap timestamp for old payload)
    String expected = "sha256=" + HmacSHA256(timestamp + "." + payload, webhookSecret);
    if (!MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),
                               signature.getBytes(StandardCharsets.UTF_8))) {  // constant-time compare
        return ResponseEntity.status(401).body("Invalid signature");
    }
    
    // 3. Idempotency: INSERT first, unique constraint on delivery_id is the arbiter
    //    (existsBy... then save has a race when 2 requests arrive in parallel)
    try {
        inboxRepo.insert(deliveryId, payload);          // RECEIVED state
    } catch (DuplicateKeyException dup) {
        return ResponseEntity.ok().build();             // already received, ack again
    }

    // 4. Business logic in async worker reading inbox table; return 2xx fast
    return ResponseEntity.accepted().build();
}
~~~

### Retry & Ordering
| Strategy | Description |
|----------|-------------|
| **Exponential backoff + jitter** | {{delay = min(base * 2^attempt, max) * (0.9 + 0.2 * random())}} |
| **Max retry** | 10-12 times within 72h, then DLQ |
| **Per-account ordering** | Partition dispatcher by {{accountId}} → single-threaded per partition |
| **Sequence gap detection** | Partner tracks {{lastSequence}} per account; gap → request replay |

### Outbox Pattern (Ensures Events Are Not Lost)
- Write event to **outbox table** in the same transaction as business logic.
- Dispatcher polls outbox (CDC or scheduler) → publishes.
- Avoids dual-write problem (DB commit OK but publish fails).

> Senior tip: Banks use **Kafka/EventHub** as the backbone, webhook dispatcher is a consumer. Partner only receives HTTPS callback. **Always version webhook API** ({{/webhook/v1/}}, {{/webhook/v2/}}) — partner migrates gradually. Test webhook with **ngrok** locally + **automated signature verification** in CI.`,
    follow: [
      'Outbox relay: polling publisher vs CDC (Debezium) — how do they differ?',
      'How to handle partner being down for a long time (circuit breaker for webhook dispatcher)?'
    ]
  },
  'api-012': {
    q: `Embedded Tomcat in Spring Boot: configure maxThreads, acceptCount, connectionTimeout. Why do requests hang at the Tomcat layer (thread pool exhausted, slow client, connection leak)?`,
    a: `**Summary:** Embedded Tomcat uses a thread pool (maxThreads defaults to 200) to handle requests. maxConnections (NIO) defaults to 8192; acceptCount (OS TCP backlog when maxConnections is reached) defaults to 100. connectionTimeout of the connector defaults to 60s (Tomcat standalone server.xml sample sets 20s). Requests hang when: thread pool exhausted (sync blocking I/O), slow client (read/write timeout), connection leak (pool doesn't return connection). Fix: virtual threads (Java 21), async processing, tuning pool, monitoring.

### Key Configuration (application.yml)
~~~yaml
server:
  tomcat:
    threads:
      max: 200           # max worker threads (default 200)
      min-spare: 10      # core pool size
    accept-count: 100    # TCP backlog when max-connections reached (default 100)
    connection-timeout: 20s    # wait for request line after accept / read timeout (connector default 60s)
    max-connections: 8192      # max connections Tomcat holds concurrently (default 8192 with NIO)
    keep-alive-timeout: 20s    # idle between keep-alive requests (default = connection-timeout)
    max-http-form-post-size: 2MB  # limit form post
    accesslog:
      enabled: true
      pattern: "%h %l %u %t \"%r\" %s %b %{ms}T %{X-Request-ID}i"  # %{ms}T = processing time (ms); Tomcat 10+: %D is microseconds
~~~

### Thread Pool Model (Tomcat 10 / Spring Boot 3)
~~~text
                     ┌─────────────────────┐
                     │  Acceptor Thread    │  (1 thread, accept() socket)
                     └──────────┬──────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │   Poller (NIO)      │  (selector: socket with data → dispatch to worker)
                     └──────────┬──────────┘
                                │
                     ┌──────────▼──────────┐
                     │  Worker Thread Pool │  (maxThreads, parse request + run servlet)
                     │  [T1, T2, ..., T200]│
                     └─────────────────────┘
~~~
- When all 200 workers are busy, accepted connections are still held (up to max-connections) and requests **queue in the executor** waiting for a free thread — this is where requests "hang". accept-count only takes effect when connection count hits max-connections.

### Why Requests Hang (Queue)
| Root Cause | Symptoms | Diagnosis | Fix |
|------------|----------|-----------|-----|
| **Sync blocking I/O** (JDBC, sync HTTP client) | Thread pool full, CPU low, latency up | Thread dump: many threads RUNNABLE at {{SocketInputStream.read}}, {{JDBC}} | Virtual threads (Java 21), @Async, WebFlux, async HTTP client |
| **Slow client / Slowloris** | High connection count, low thread count, read timeout | Access log: %D large, connection count > thread count | {{connection-timeout}}, {{max-connections}}, WAF/rate limit |
| **Connection leak (HikariCP)** | Pool exhausted, "Connection not available" | HikariCP metrics: {{active}} = {{max}}, {{idle}} = 0 | {{connection-timeout}}, {{max-lifetime}}, {{leak-detection-threshold}} |
| **Large request body** | Thread blocked reading body | {{max-http-form-post-size}}, {{max-swallow-size}} | Stream processing, limit body size |
| **Synchronous external call** | Thread waiting on downstream | Thread dump: {{RestTemplate.exchange}}, {{WebClient.block}} | WebClient reactive, Resilience4j timeout/bulkhead |

### Virtual Threads (Java 21 + Spring Boot 3.2+)
~~~yaml
spring:
  threads:
    virtual:
      enabled: true  # enable virtual threads for Tomcat
# server.tomcat.threads.max no longer applies: Tomcat uses virtual thread executor
~~~
- Each request = 1 virtual thread (carrier thread pool small ~CPU cores).
- Blocking I/O (JDBC, RestTemplate) **does not block carrier thread** → high throughput. Real limit shifts to downstream resources (Hikari pool, downstream) ⇒ need bulkhead/semaphore.
- **Note**: blocking inside {{synchronized}} (JDK 21–23, fixed in JDK 24 — JEP 491) and native calls will **pin** carrier thread. ThreadLocal doesn't pin but consumes memory with millions of virtual threads. CPU-bound work (Jackson serialize) still occupies carrier while running.

### Monitoring & Alerting
~~~promql
# Need server.tomcat.mbeanregistry.enabled=true for Micrometer to have tomcat_threads_* / tomcat_connections_*
# Thread pool usage
tomcat_threads_busy_threads / tomcat_threads_config_max_threads > 0.8

# Connection usage
tomcat_connections_current_connections / tomcat_connections_config_max_connections > 0.8

# Request latency (P99)
histogram_quantile(0.99, rate(http_server_requests_seconds_bucket[5m])) > 5
~~~

> Senior tip: **Always enable access log with request processing time** (%{ms}T or %D microseconds) — debugging production without request time logs is flying blind. Spring Boot 3.2+: {{spring.threads.virtual.enabled=true}} is a game-changer for blocking I/O. But **not a silver bullet**: CPU-bound workloads don't get faster, synchronized (pre-JDK 24) still pins carrier. Profile with {{jcmd <pid> Thread.print}} or {{async-profiler}} before tuning.`,
    follow: [
      'How does Tomcat configuration for gRPC (h2c) differ from HTTP/1.1?',
      'How to detect HikariCP connection leak in production without restarting the app?'
    ]
  },
'api-013': {
    q: `Compare REST vs gRPC vs GraphQL: which to choose for mobile app, for internal service (microservice), for external partner? Trade-offs in latency, payload, tooling, evolution.`,
    a: `**Summary:** REST (HTTP/JSON) — universal, cacheable, great tooling, fits public API, mobile, partner. gRPC (HTTP/2 + Protobuf) — lowest latency, contract-first, streaming, fits internal service-to-service. GraphQL — flexible query, single endpoint, fits BFF (Backend for Frontend), mobile with complex UI. No "silver bullet", often combine.

### Detailed Comparison
| Criterion | REST (HTTP/1.1/2 + JSON) | gRPC (HTTP/2 + Protobuf) | GraphQL (HTTP + JSON) |
|-----------|--------------------------|-------------------------|----------------------|
| **Protocol** | HTTP/1.1, HTTP/2 | HTTP/2 (required) | HTTP/1.1, HTTP/2 |
| **Serialization** | JSON (text, verbose) | Protobuf (binary, compact) | JSON (response shape defined by client) |
| **Schema/Contract** | OpenAPI (optional) | .proto (required, codegen) | SDL (Schema Definition Language) |
| **Latency** | Average | **Lowest** (binary, multiplexing) | Higher (N+1 resolver, parsing) |
| **Payload Size** | Large | **Smallest** (binary, often significantly smaller than JSON — measure with real payload) | Depends on query (can over-fetch if client is poor) |
| **Streaming** | SSE, WebSocket | **Native** (unary, server/client/bidi stream) | Subscription (WebSocket) |
| **Caching** | **Native** (HTTP cache, ETag, CDN) | Hard (custom) | Hard (POST body, persisted query) |
| **Browser Support** | **Native** (fetch, axios) | Needs grpc-web / Envoy proxy | Native (fetch) |
| **Tooling** | Very rich | Good (protoc, buf, grpcurl) | Good (Apollo, Relay, GraphiQL) |
| **Evolution** | URL/header versioning | Field number, backward compat | Deprecation directive, schema stitching |
| **Learning Curve** | Low | Medium (Protobuf, HTTP/2) | High (resolver, dataloader, security) |

### When to Choose What?

**Mobile App (Public API)**
→ **REST** (or GraphQL for BFF)
- CDN cache, ETag, conditional requests save bandwidth on 3G/4G.
- Simple tooling (Retrofit, Dio, Alamofire).
- GraphQL: Use **BFF pattern** — mobile calls BFF (GraphQL), BFF aggregates from internal REST/gRPC.

**Internal Service (Microservice Sync Call)**
→ **gRPC**
- Latency critical (P99 low for payment, ledger).
- Contract-first: .proto shared via buf schema registry, breaking change detected in CI.
- Streaming: server push real-time (balance update, fraud alert).
- Load balancing: gRPC holds long-lived HTTP/2 connections so L4 load balancer (typical K8s Service) funnels traffic to few pods ⇒ need client-side LB (round_robin) or L7 proxy (Envoy, service mesh).

**External Partner (Partner Integration)**
→ **REST + OpenAPI** (or gRPC if partner is technically strong)
- Partner tests easily (Postman, curl), no protobuf toolchain needed.
- OpenAPI spec published → partner auto-generates SDK.
- Clear versioning: {{/v1/}}, {{/v2/}}, 12-month deprecation policy.

### Real-World Combination (Polyglot API)
~~~text
┌─────────────┐     REST/OpenAPI      ┌─────────────┐
│  Mobile App │ ◄───────────────────► │   BFF/      │
│  (React     │                       │   API GW    │
│   Native)   │                       │  (Spring    │
└─────────────┘                       │   Cloud     │
                                       │   Gateway)  │
                                       └──────┬──────┘
                                              │
                      ┌────────────────────────┼────────────────────────┐
                      ▼                        ▼                        ▼
               ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
               │  Account    │          │ Transaction │          │  Ledger     │
               │  Service    │          │  Service    │          │  Service    │
               │  (gRPC)     │◄────────►│  (gRPC)     │◄────────►│  (gRPC)     │
               └─────────────┘          └─────────────┘          └─────────────┘
~~~

### Anti-patterns
- **gRPC for public API** → partner suffers from tooling, firewall blocks HTTP/2.
- **GraphQL for service-to-service** → tight coupling, N+1 death spiral, hard to trace.
- **REST for high-frequency internal call** → JSON serialization overhead, no streaming.

> Senior tip: Common model at banks: **REST for public/open banking**, **gRPC for core banking internal** (transfer, ledger, limit check), **GraphQL for BFF mobile/web**. Spring Boot 3.x: Spring gRPC (official project, still new), {{spring-graphql}} (official). Always have an **API Gateway** (Spring Cloud Gateway / Kong / Apigee) terminate TLS, auth, rate limit, route REST↔gRPC translation.`,
    follow: [
      'GraphQL N+1 problem: how does DataLoader work, when is it not enough?',
      'gRPC error handling: rich error model (google.rpc.Status) vs HTTP status code?'
    ]
  },
  'api-014': {
    q: `API-first with OpenAPI (springdoc, generator): contract before code, review API changes, generate client/server stub. CI/CD process to ensure no breaking changes.`,
    a: `**Summary:** API-first = write OpenAPI spec **before** implementation. springdoc-openapi generates spec from code (code-first) — used to compare against approved spec; validating response matches spec needs a separate validator library (contract test). Generator (openapi-generator) produces client/server stubs. CI gate: {{oasdiff}} (or openapi-diff) compares new spec vs baseline, fails build if breaking.

### API-first Process
~~~text
1. Design: Write API spec (YAML) ──► Review (Arch, Security, Partner)
                                   │
2. Baseline: Commit spec to 'main' branch (git tag v1.0.0)
                                   │
3. Implement: Dev generates server stub (interface + DTO)
                                   │
4. Contract Test: MockMvc + validator (e.g., swagger-request-validator) verifies request/response match spec
                                   │
5. CI Gate: 'oasdiff' / openapi-diff compares HEAD vs baseline
                                   │
6. Release: Tag version, publish spec to portal (Stoplight, Redocly, SwaggerHub)
                                   │
7. Client: Partner generates SDK from spec (Java, Kotlin, TypeScript, Go, Python)
~~~

### springdoc-openapi 2.x (Spring Boot 3)
~~~yaml
dependencies:
  - org.springdoc:springdoc-openapi-starter-webmvc-ui:2.6.0
  - org.springdoc:springdoc-openapi-starter-webmvc-api:2.6.0
~~~

~~~java
@RestController
@RequestMapping("/api/v1/accounts")
@Tag(name = "Account", description = "Customer account management")
@SecurityRequirement(name = "bearerAuth")
class AccountController {

    @Operation(summary = "Create new account", 
               responses = {
                   @ApiResponse(responseCode = "201", description = "Created",
                       content = @Content(schema = @Schema(implementation = AccountResponse.class))),
                   @ApiResponse(responseCode = "422", description = "Validation error",
                       content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
               })
    @PostMapping
    ResponseEntity<AccountResponse> create(
            @Valid @RequestBody @Parameter(description = "Account opening info") CreateAccountRequest req) {
        return ResponseEntity.created(uri).body(service.create(req));
    }
}
~~~

### Generate Server Stub (Interface-first)
~~~xml
<!-- pom.xml: openapi-generator-maven-plugin -->
<plugin>
  <groupId>org.openapitools</groupId>
  <artifactId>openapi-generator-maven-plugin</artifactId>
  <version>7.10.0</version>
  <executions>
    <execution>
      <goals><goal>generate</goal></goals>
      <configuration>
        <inputSpec>\${project.basedir}/src/main/resources/openapi/account-api.yaml</inputSpec>
        <generatorName>spring</generatorName>  <!-- default library: spring-boot -->
        <configOptions>
          <delegatePattern>true</delegatePattern>  <!-- generate interface + delegate -->
          <useSpringBoot3>true</useSpringBoot3>
          <interfaceOnly>false</interfaceOnly>
          <implFolder>generated</implFolder>
        </configOptions>
      </configuration>
    </execution>
  </executions>
</plugin>
~~~
- Dev implements {{AccountApiDelegate}} (generated interface), doesn't modify generated code.

### Contract Test (Validate Implementation Matches Spec)
~~~java
@SpringBootTest
@AutoConfigureMockMvc
class AccountContractTest {
    
    @Autowired MockMvc mvc;
    
    @Test
    void createAccount_specCompliant() throws Exception {
        String spec = mvc.perform(get("/v3/api-docs"))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();
        
        // Validate with openapi-validator (optional)
        // Or use Pact/Spring Cloud Contract for consumer-driven contract
    }
    
    @Test
    void createAccount_responseMatchesSchema() throws Exception {
        mvc.perform(post("/api/v1/accounts")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@bank.vn\",\"initialBalance\":1000}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.email").value("test@bank.vn"))
            .andExpect(jsonPath("$.id").exists());
    }
}
~~~

### CI Breaking Change Detection
~~~yaml
# .github/workflows/api-contract.yml
name: API Contract Check
on: [pull_request]
jobs:
  breaking-changes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }  # need history for baseline
      
      - name: Download baseline spec (from main)
        run: |
          git show origin/main:src/main/resources/openapi/account-api.yaml > baseline.yaml
      
      - name: Current spec (file in PR)
        run: cp src/main/resources/openapi/account-api.yaml current.yaml
        # code-first: run app then curl localhost:8080/v3/api-docs.yaml > current.yaml
      
      - name: Check breaking changes
        uses: oasdiff/oasdiff-action/breaking@main   # should pin to tag/commit
        with:
          base: baseline.yaml
          revision: current.yaml
          fail-on: ERR  # fail build if breaking change exists
~~~

### Breaking vs Non-breaking Changes
| Type | Breaking? | Example |
|------|-----------|---------|
| Add optional field to response | No | Add {{metadata}} object |
| Add required field to request | **Yes** | {{required: [newField]}} |
| Remove field | **Yes** | Drop {{phone}} |
| Change field type | **Yes** | {{int}} → {{string}} |
| Change enum value | **Yes** | Add/remove value |
| Add new endpoint | No | GET /v1/accounts/{id}/cards |
| Change status code | **Yes** | 200 → 201 |
| Add response header | No | {{X-Request-ID}} |

### Versioning Strategy
- **URL versioning**: {{/api/v1/}}, {{/api/v2/}} (recommended, clear).
- **Header versioning**: {{Accept: application/vnd.bank.v2+json}} (clean URL, harder to test).
- **Deprecation policy**: Support old version at least 12 months, {{Sunset}}, {{Deprecation}} headers.

> Senior tip: **Don't generate partner client SDK from code** — generate from **reviewed & baselined spec**. Use {{buf}} (Protobuf) or {{oasdiff}} (OpenAPI) in CI to catch breaking changes early. Declare error response as {{ProblemDetail}} (springdoc reads @ExceptionHandler in @ControllerAdvice) so spec has consistent error schema. Doc portal (Redocly/Stoplight) auto-deploys from {{main}} branch — partner always sees latest spec.`,
    follow: [
      'Consumer-driven contract (Pact) vs Provider-driven (OpenAPI) — how do they differ?',
      'How to version API when multiple teams deploy independently (monorepo vs polyrepo)?'
    ]
  },
  'api-015': {
    q: `POST /payments is not idempotent: user clicks "Pay" twice or mobile retries after timeout. Design Idempotency-Key to avoid double charge — where to store, how to handle concurrent requests, what TTL?`,
    a: `**Summary:** Client generates an {{Idempotency-Key}} (UUID) for each payment and **keeps the same key** on retry. Server stores key + request fingerprint + response already returned; second request with same key **replays the old response**, doesn't call PSP/card core again. Unique index on {{(merchant_id, idempotency_key)}} in PostgreSQL is the anti-race mechanism, TTL typically 24 hours.

### Why HTTP Alone Isn't Enough
- POST is **not idempotent** per RFC 9110: resending means creating another transaction.
- Timeout doesn't tell if server processed it or not: client sees network error, PSP already charged, blind retry = double charge.
- {{Idempotency-Key}} is being standardized (IETF draft) and already used by Stripe, PayPal, Adyen. Key is generated by **client** because only client knows two requests share the same intent.

### State Table
| Record State | New Request with Same Key | Returns |
|---|---|---|
| IN_PROGRESS | While first request not done | 409 Conflict with short Retry-After |
| COMPLETED | Any time within TTL | Replay exact status + body |
| FAILED (business error finalized) | Within TTL | Replay old error, don't retry |
| None | First request | 200/201 + store result |

> Only **system errors** (5xx, timeout calling PSP) should allow retry with same key; finalized business errors replay as-is.

### Where to Store
~~~sql
create table payment_idempotency (
  merchant_id      varchar(32)  not null,
  idem_key         varchar(64)  not null,
  request_hash     char(64)     not null,   -- SHA-256 of method + path + body
  status           varchar(16)  not null,   -- IN_PROGRESS | COMPLETED | FAILED
  response_status  int,
  response_body    jsonb,
  created_at       timestamptz  not null default now(),
  primary key (merchant_id, idem_key)
);
create index on payment_idempotency (created_at);  -- cleanup job for old data
~~~

### Processing Flow (insert-first)
1. **Reserve**: {{insert ... on conflict do nothing}}. If 0 rows inserted, read existing record and compare {{request_hash}}.
2. Hash differs → 422: client reused key for different payload, must not replay incorrectly.
3. Record is IN_PROGRESS → 409 for client to backoff, or short wait then read again.
4. Record COMPLETED → replay exact status/body, add header {{Idempotent-Replayed: true}}.
5. If first request: call PSP (pass **same key** to PSP if they support it), write result, flip status.

~~~java
// reserve/complete are 2 short transactions; DO NOT hold transaction while calling PSP
public ResponseEntity<String> pay(String key, PayRequest req) {
    String hash = sha256(canonicalJson(req));
    int inserted = repo.reserve(merchantId, key, hash);   // INSERT ... ON CONFLICT DO NOTHING
    if (inserted == 0) {
        IdemRow row = repo.find(merchantId, key);
        if (!row.requestHash.equals(hash)) {
            return ResponseEntity.unprocessableEntity().body("key reused with different payload");
        }
        if ("IN_PROGRESS".equals(row.status)) {
            return ResponseEntity.status(409).header("Retry-After", "1").build();
        }
        return ResponseEntity.status(row.responseStatus)
                .header("Idempotent-Replayed", "true").body(row.responseBody);
    }
    try {
        PspResult r = psp.charge(req, key);               // idempotent at PSP side too
        repo.complete(merchantId, key, r.status(), r.body());
        return ResponseEntity.status(r.status()).body(r.body());
    } catch (PspTimeout e) {
        repo.fail(merchantId, key);                        // allow retry with same key
        throw e;
    }
}
~~~

### Production Pitfalls
- **Writing key after calling PSP**: process dies between the two steps → money charged, key not stored, retry charges again. Always reserve first.
- **Wrong key scope**: using global key instead of per-merchant/API-key → two merchants colliding on UUID is rare but possible, and one merchant could read another's response.
- **No body hash**: client reuses key for different order, server replays old order → wrongful charge, very hard to trace.
- **TTL too short**: partner may retry up to 24h; set TTL 7 days for safety, cleanup via batch job to avoid table locks.
- **Auto-retry inside**: must not auto-retry 5xx when unsure if PSP processed; retry must go through same key.
- **Stuck IN_PROGRESS record**: process dies after reserve but before writing result. Use short lease and reconciliation job with PSP; don't auto-retry PSP for stuck record.

> Senior tip: At large payment gateways, idempotency table grows millions of rows/day — partition by month and drop old partitions instead of DELETE. Monitor {{Idempotent-Replayed}} ratio: sudden spike usually means client timeout storm or slow PSP, not an idempotency bug. For internal transfers, add **system-generated reference id** and end-of-day reconciliation to catch "charged but response lost" cases.`,
    follow: [
      'What if PSP does not support idempotency key?',
      'Should Idempotency-Key be tied to user session or payment intent? Why?'
    ]
  },
  'api-016': {
    q: `Public partner API needs schema change. Choose URI versioning or header? Deprecation and sunset process for a version without breaking customer integrations?`,
    a: `**Summary:** Only bump **major version** on breaking changes. For public partner API, URI versioning ({{/v1/}}, {{/v2/}}) usually wins because it's easy to route at gateway, readable in logs/metrics, easy to test with curl; header/media-type versioning is "cleaner" REST but requires {{Vary}}, gateway predicates, and is easily dropped by proxies/caches. Deprecation is a **process with telemetry, communication, grace period, and brownout** — not a one-day switch-off.

### URI vs Header
| Criterion | URI ({{/v2/accounts}}) | Header / media type |
|---|---|---|
| Debug, log, metric | Very clear, separate series by path | Must parse header, easily lost through proxy |
| Cache/CDN | Natural key by URL | Needs {{Vary: Accept}} or custom header, prone to wrong cache |
| Gateway routing | Simple prefix match | Header predicate, more complex config |
| "REST purity" | Seen as mixing version into resource | Resource stable, version in representation |
| Client SDK | Generated from path, easy to understand | SDK must set default header |
| Risk | URL bloats with versions | Client forgets header → falls to default version |

For internal service-to-service APIs, best is **no URL versioning**: add optional fields, keep tolerant reader (Spring Boot ignores unknown fields by default), only create new endpoint when semantics change.

### Breaking or Not?
- **Breaking**: remove/rename field, change type, add **required** field to request, change status code, tighten validation, change unit meaning (VND → USD), change pagination style.
- **Non-breaking**: add optional field to response, add endpoint, add enum value **if client was warned to tolerate unknown values** (many clients have hardcoded switch-case so in practice still need advance notice).
- Changing defaults (page size, timezone, rounding) is also breaking even if schema doesn't change — this is the type most often overlooked.

### Deprecation Lifecycle
~~~text
T0  announce + document + email/portal to partners
T0  /v1 responses add Deprecation + Sunset + Link to migration guide headers
T1  (in parallel) /v2 runs stable, parity tests between both versions
T2  brownout: /v1 returns 503/410 in short windows (e.g., 5 min every hour) to surface clients
T3  measure usage by consumer; only sunset when no significant traffic remains
T4  hard shutdown, keep 410 Gone + Link to migration for at least one cycle
~~~

- Suggested headers: {{Deprecation}} (RFC 9745), {{Sunset}} (RFC 8594, HTTP-date), {{Link: <https://api.bank.vn/migrate/v2>; rel="deprecation"}}.
- Don't return 404 immediately: 404 makes client think endpoint never existed (wrong URL, calling env without route) and they don't know what to do next; 410 Gone says "gone forever", with Link to migration guide.

~~~java
// Spring MVC: two thin version facades sharing one service
@RestController
@RequestMapping("/v2/accounts")
class AccountControllerV2 {
    @GetMapping("/{id}")
    AccountDtoV2 get(@PathVariable long id) {
        return AccountDtoV2.from(service.get(id));   // v2 is canonical model
    }
}

@RestController
@RequestMapping("/v1/accounts")
class AccountControllerV1 {
    @GetMapping("/{id}")
    AccountDtoV1 get(@PathVariable long id) {
        return AccountDtoV1.from(service.get(id));   // adapter: map back to old shape
    }
}
~~~

Business logic only in service; controller v1 just maps data. Don't scatter {{if v1}} throughout code. (Spring Framework 7 / Spring Boot 4 will add built-in API versioning support, but adapter separation principle remains.)

### Measure Before Shutdown
- Count requests by {{api_key}} + version in access log/Micrometer; dashboard "consumers still calling v1".
- For large partners: agree sunset date in writing; keep time-limited exception instead of delaying whole system.
- Watch 4xx spike after changing defaults — sign clients depend on old behavior.

> Senior tip: Banks typically commit to 12–24 months for partner APIs, but real cost is **two test suites and two bug surfaces**. Reduce by keeping old version as a **thin adapter** on new model (map fields, don't copy business logic), and enable brownout early — partner team migrates much faster than email reminders. Don't let clients without version silently fall into "latest"; pin them to an announced default version.`,
    follow: [
      'Is media-type versioning truly "cleaner" than URI in operations?',
      'How to auto-detect breaking changes in CI?'
    ]
  },
  'api-017': {
    q: `Transactions table has 80M rows, transaction history API needs stable pagination with continuous inserts. Design cursor (keyset) pagination: SQL, index, cursor format, and pitfalls causing client to see duplicates or missing rows?`,
    a: `**Summary:** Cursor pagination means "fetch after the last record seen", using keyset {{WHERE (created_at, id) < (?, ?) ORDER BY created_at DESC, id DESC LIMIT ?}}. No OFFSET so each page costs O(log n + page size) and results are stable despite inserts. Cursor must be **opaque + signed**, carry exact precision of sort columns, and bind to the filter/sort used.

### Why OFFSET Dies at Deep Pages
~~~sql
-- Page 5000: PostgreSQL still walks 100,000 index entries then discards
select id, created_at, amount, status
from transactions
where account_id = 42
order by created_at desc, id desc
offset 100000 limit 20;
~~~
- Cost grows linearly with offset, p99 explodes at deep pages.
- Insert/delete between two calls makes rows **shift**: client sees duplicates or missing rows.
- Infinite scroll UI only needs next, no page jumps, so OFFSET buys nothing.

### Keyset SQL
~~~sql
create index idx_txn_acct_created_id
  on transactions (account_id, created_at desc, id desc);

-- First page
select id, created_at, amount, status
from transactions
where account_id = :acct
order by created_at desc, id desc
limit :size + 1;              -- fetch one extra to know has_more

-- Next page: row-wise comparison, uses composite index correctly
select id, created_at, amount, status
from transactions
where account_id = :acct
  and (created_at, id) < (:cursorTs, :cursorId)
order by created_at desc, id desc
limit :size + 1;
~~~

PostgreSQL compares row-wise in correct column order and uses the composite index. {{id}} is a mandatory tie-breaker: many transactions share the same {{created_at}} (batch import) and cursor with only timestamp would skip or repeat rows.

### Cursor Format
~~~java
record Cursor(Instant createdAt, long id, String filterHash) {}

String encode(Cursor c) throws Exception {
    String json = mapper.writeValueAsString(c);
    String body = Base64.getUrlEncoder().withoutPadding()
                        .encodeToString(json.getBytes(StandardCharsets.UTF_8));
    return body + "." + hmacSha256(body, cursorSecret);   // prevent cursor tampering
}
~~~
- **Opaque**: client must not construct cursors; exposing base64 of id lets client probe other accounts' data.
- **HMAC signed**: without signature, client could modify timestamp/id to read out of scope.
- **filterHash**: hash of (accountId, from, to, status, sort). Cursor from filter A used with filter B returns nonsense; server must reject with 400.
- Return {{next_cursor}} and {{has_more}}; don't return {{total}} unless truly needed.

### Pitfalls Causing Duplicates or Missing Rows
| Pitfall | Consequence | Prevention |
|---|---|---|
| Cursor only has timestamp | Lose rows in same second/microsecond | Add id as tie-breaker |
| Lost time precision | Postgres stores microsecond, JS Date only milli → drift | Serialize epoch micro or full ISO string |
| Sort by updatable column | Row jumps to another page | Sort by immutable column, or document consequence |
| Mix OFFSET with cursor | Deep pages still slow, still shift | Pick one mechanism |
| Unbounded page size | {{size=100000}} causes OOM/DoS | Cap at 100, validate input |
| Cursor lives too long | Data changed significantly | TTL 24h, return 400 with guidance |

### Total Count & Prev Page
- Don't run {{count(*)}} every page. If UI needs it, use estimate ({{reltuples}} after ANALYZE) or background count job.
- Prev page: reverse condition and order then reverse results; or return {{prev_cursor}} too.
- For full export: run in {{repeatable read}} transaction or snapshot for consistent pages.

> Senior tip: Test pagination by inserting data **while** client is paging — that's when bugs surface. Spring Data 3.1+ has {{Window}} and {{ScrollPosition}} to avoid writing raw SQL, but signing cursor and filterHash still DIY. Don't put cursor in query string then log verbatim if it contains sensitive data; sign and encrypt enough that exposure is harmless.`,
    follow: [
      'How does keyset pagination support dynamic multi-column sorting?',
      'How to achieve stable pagination when sorting by a nullable column?'
    ]
  }
});