/*
 * English translation of js/data/q-api.js — task T509. Format: js/core/i18n.js (content overlay).
 * ids: api-018 api-019 api-020 api-021 api-022
 */
App.i18n.content({
  'api-018': {
    q: 'Design an error model for a banking API on Spring Boot 3 following RFC 9457 Problem Details: type/title/detail/instance, multi-field validation errors, business errors and 5xx — how to make clients handle them programmatically without parsing strings?',
    a: `**Summary:** RFC 9457 (replacing RFC 7807) defines a standard error body {{application/problem+json}} with {{type}} (URI identifying the error type), {{title}}, {{status}}, {{detail}}, {{instance}}, plus extension members. Spring Boot 3 has the {{ProblemDetail}} class built in; enable {{spring.mvc.problemdetails.enabled=true}} so framework exceptions also return the same format. Clients should switch on {{type}} + {{status}}, never parse {{detail}}.

### Why a standard is needed
- Every team inventing their own {{code}}/{{message}}/{{errorCode}} → partner SDKs must handle N formats.
- {{detail}} is human-readable text, may change language, not a contract.
- {{type}} is a **machine-readable error code**, stable, can point to a docs page explaining how to fix it.

~~~text
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json

{
  "type": "https://api.bank.vn/problems/insufficient-funds",
  "title": "Insufficient funds",
  "status": 422,
  "detail": "Account 0123456 needs 5,200,000 VND but only has 5,000,000 VND.",
  "instance": "/v1/transfers/9f2c",
  "traceId": "4bf92f3577b34da6",
  "balance": 5000000,
  "required": 5200000
}
~~~

### Spring Boot 3: configuration and handlers
~~~yaml
spring:
  mvc:
    problemdetails:
      enabled: true   # framework exceptions (404, 405, binding errors) -> problem+json
~~~

> This property only registers a default {{ResponseEntityExceptionHandler}} **when you do not already have** a bean of that kind. If you write your own advice {{extends ResponseEntityExceptionHandler}} as below, your advice replaces it (it still returns ProblemDetail for framework exceptions), and the property no longer has any effect.

~~~java
@RestControllerAdvice
class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(InsufficientFundsException.class)
    ProblemDetail insufficient(InsufficientFundsException e) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNPROCESSABLE_ENTITY, e.getMessage());
        p.setType(URI.create("https://api.bank.vn/problems/insufficient-funds"));
        p.setTitle("Insufficient funds");
        p.setInstance(URI.create("/v1/transfers/" + e.transferId()));
        p.setProperty("balance", e.balance());      // extension member
        p.setProperty("required", e.required());
        p.setProperty("traceId", MDC.get("traceId"));
        return p;                                    // Spring sets status + content-type automatically
    }

    @Override   // @Valid errors: collect by field
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders h,
            HttpStatusCode code, WebRequest req) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST, "Invalid data");
        p.setType(URI.create("https://api.bank.vn/problems/validation-failed"));
        p.setProperty("errors", ex.getBindingResult().getFieldErrors().stream()
                .map(f -> Map.of("field", f.getField(), "message", f.getDefaultMessage()))
                .toList());
        return ResponseEntity.badRequest()
                .contentType(MediaType.APPLICATION_PROBLEM_JSON).body(p);
    }
}
~~~

### Error classification
| Group | Status | Example type | Notes |
|---|---|---|---|
| Validation | 400 | validation-failed | With {{errors}} array per field |
| Authn | 401 | unauthenticated | With {{WWW-Authenticate}}, no token details leaked |
| Authz | 403 | forbidden | Do not reveal whether resource exists |
| Not found | 404 | not-found | |
| Business conflict | 409/422 | duplicate-transfer, insufficient-funds | One type per case |
| Rate limited | 429 | rate-limited | With {{Retry-After}} |
| System | 500 | internal-error | Generic detail, no stack/SQL leaked |

### Content rules
- {{detail}} tells **the user what to do**, does not leak table names, SQL, stack traces, hostnames.
- 5xx: log fully on server, return {{traceId}} for support to look up; do not return exception message.
- 401 must include {{WWW-Authenticate}} header; 405 must include {{Allow}}; 429 must include {{Retry-After}}.
- Multi-language: keep {{type}} fixed, translate {{title}}/{{detail}} via {{MessageSource}} using {{Accept-Language}}.
- Docs page per {{type}} URL: partners can read how to handle, reduces support tickets.

### Pitfalls
- **Mixing two formats**: new endpoints return problem+json, old ones return {{error/message}} → SDK must parse both. Migrate by version, announce clearly.
- **Body status differs from HTTP status** (body 500 but HTTP 200, or vice versa) → which does client trust? Always match.
- **type is a dead URL** (404) → loses documentation value; host statically on docs portal.
- **Returning {{errors}} as concatenated string** → client cannot highlight fields.
- **Leaking info via 404/409**: attackers can probe whether a transaction ID exists.

> Senior tip: Lock down the {{type}} set as an **enum in OpenAPI** and review it like a public API — adding a new type is a contract change requiring notice. Name types by **cause/action** (insufficient-funds, card-expired) not by layer (db-error, service-exception): clients need to know what to do, not where the error originated. And always have a contract test verifying every 4xx/5xx response is problem+json.`,
    follow: [
      'How to make Spring Security also return problem+json instead of its default body?',
      'Should validation error lists go in the type or in extension members?'
    ]
  },
  'api-019': {
    q: 'Rate limiting for a public API running multiple instances behind a load balancer: which algorithm, where to count so you don\'t get "each instance has its own limit", and how to return 429 correctly for clients?',
    a: `**Summary:** Use **token bucket** (allows controlled burst) or sliding-window counter, count centrally in **Redis via atomic Lua script**; each instance only keeps a local cache for early rejection. Return 429 Too Many Requests with {{Retry-After}} and {{RateLimit-*}} headers; key by API key/consumer, not just IP.

### Algorithm choice
| Algorithm | Burst | Memory | Drawback |
|---|---|---|---|
| Fixed window | Allows 2x burst at window boundary | 1 counter | 2x limit at boundary second |
| Sliding window log | Exact | 1 entry per request in window | High RAM at large limits |
| Sliding window counter | Near-exact, smooth | 2 counters | Small error at boundary |
| **Token bucket** | Exact by capacity | 2 numbers per key | Needs time-based refill |
| Leaky bucket | Perfectly smooth | 1 queue | Adds latency, unfit for API |

Token bucket fits APIs best: each consumer has {{capacity}} tokens, refilled at {{rate}} tokens/sec; request consumes 1 (or more by "cost"). It lets a client burst 100 requests in 1 second then pause — matching real batch job behavior.

### Why central counting
If each pod keeps its own bucket with limit 100/min and there are 10 pods, the client effectively gets 1000/min — the limit becomes meaningless and depends on autoscaling. Redis (or gateway using Redis) is the source of truth; local bucket is just a coarse filter (e.g., 10% of limit) to offload Redis during floods.

### Atomic Lua script
~~~lua
-- KEYS[1] = rl:{consumerId}:{endpoint}
-- ARGV = capacity, refillPerSec, nowMs, cost
local cap  = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local now  = tonumber(ARGV[3])
local cost = tonumber(ARGV[4])
local d = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(d[1])
local ts = tonumber(d[2])
if tokens == nil then tokens = cap; ts = now end
local delta = math.max(0, now - ts) / 1000.0
tokens = math.min(cap, tokens + delta * rate)
local allowed = 0
if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
end
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], math.ceil(cap / rate * 1000) + 60000)
return { allowed, math.floor(tokens) }
~~~
- Entire read-modify-write runs in one Lua execution; Redis is single-threaded so no race.
- Don't do GET then SET from Java: two requests interleaving will both see tokens available and both allow.
- Script touches only one key, safe on Redis Cluster.
- {{nowMs}} comes from the pod's clock: if pods drift apart by a few hundred milliseconds, the bucket refills incorrectly. You can call {{redis.call('TIME')}} inside the script (allowed since Redis 5) so every pod shares Redis's clock instead of its own.

~~~java
public Decision check(String consumer, String endpoint, int cost) {
    List<?> r = redis.execute(SCRIPT, List.of("rl:" + consumer + ":" + endpoint),
            String.valueOf(capacity), String.valueOf(refillPerSec),
            String.valueOf(clock.millis()), String.valueOf(cost));
    long allowed   = ((Number) r.get(0)).longValue();
    long remaining = ((Number) r.get(1)).longValue();
    return new Decision(allowed == 1, remaining);
}
~~~

### Returning the error correctly
~~~http
HTTP/1.1 429 Too Many Requests
Retry-After: 7
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 7
Content-Type: application/problem+json

{"type":"https://api.bank.vn/problems/rate-limited","title":"Too many requests","status":429}
~~~
- {{Retry-After}} in seconds (or HTTP-date) — client knows how long to wait instead of retrying immediately.
- {{RateLimit-Limit/-Remaining/-Reset}} is the shape used by the older IETF drafts (many gateways still emit it); the newer draft (draft-ietf-httpapi-ratelimit-headers) merges them into two structured headers, {{RateLimit}} and {{RateLimit-Policy}}. It is not an RFC yet, so document the exact format in your API docs; many legacy clients only read {{X-RateLimit-*}}.
- Client retries **must add jitter**, otherwise all clients come back at the same second and create a second wave.

### Keys and policies
- Key by **consumer/API key** primarily; add dimension by endpoint and by user to stop one account from abusing.
- IP is only fallback: corporate NAT, IPv6 /64 means many users share one "IP".
- Cost-based: heavy endpoints (reports, export) cost 10 tokens; light endpoints cost 1.
- Different limits per service tier; store config per consumer, not hard-coded.

### When Redis is down
- Read/query APIs: **fail-open** with tight local bucket — favor availability.
- Payments/login: **fail-closed** or very low local limit — favor safety.
- Document this decision in the runbook; don't leave on-call guessing at 2 AM.

> Senior tip: Rate limit is not a substitute for **bulkhead** and timeout. A valid consumer can still exhaust the connection pool; limit concurrency (semaphore) per resource type. Alert on 429 rate per consumer: sudden spike usually means client retry loop or leaked key, not "system is slow". And measure with one number: if limit is 100/min and 1% of traffic gets 429 that's normal, 30% is an incident requiring partner contact.`,
    follow: [
      'How to combine per-user and per-IP rate limits to stop both bots and account abuse?',
      'Should rate limit live at the gateway or inside each service?'
    ]
  },
  'api-020': {
    q: 'Two devices editing the same beneficiary: A saves first, B overwrites losing A\'s changes. Design optimistic concurrency with If-Match/@Version in Spring Boot 3 + JPA, and how to return 412/409/428 so clients handle it correctly?',
    a: `**Summary:** Every resource has a **monotonically increasing version** ({{@Version}} column or service-managed) returned via {{ETag}}. Client sends {{If-Match}} on PUT/PATCH; server only writes if current version still matches, else 412 Precondition Failed. Missing If-Match on required endpoint → 428; semantic business conflict (duplicate code, invalid state) → 409. Check-and-update must be in a **single conditional UPDATE** or transaction with {{@Version}}, not "read version then compare in Java".

### How lost update happens
~~~text
t0  A GET beneficiary  -> version 7, dailyLimit 10M
t1  B GET beneficiary  -> version 7, dailyLimit 10M
t2  A PUT {limit: 20M} If-Match 7 -> OK, version 8
t3  B PUT {limit: 15M} If-Match 7 -> must 412; if server ignores If-Match
                                       then A's 20M change silently disappears
~~~
This is the classic lost update; without version it's "last write wins" silently — for a transfer limit, that's a business bug.

### Three status codes, three meanings
| Code | When | Client action |
|---|---|---|
| 428 Precondition Required | Endpoint requires If-Match but request lacks it | Add If-Match and retry |
| 412 Precondition Failed | If-Match doesn't match current version | GET again, merge, ask user if real conflict |
| 409 Conflict | Business conflict: duplicate beneficiary code, invalid state machine | Show business error, don't blindly retry |

Don't use 409 for version mismatch: client can't distinguish "retry after GET" from "business rejected".

### Spring Boot 3 + JPA
~~~java
@Entity
class Beneficiary {
    @Id Long id;
    @Version Long version;        // JPA auto-increments, validates on flush
    String name;
    BigDecimal dailyLimit;
}
~~~

~~~java
@PutMapping("/beneficiaries/{id}")
public ResponseEntity<?> update(@PathVariable long id,
        @RequestHeader(value = "If-Match", required = false) String ifMatch,
        @Valid @RequestBody BeneficiaryRequest req) {
    if (ifMatch == null) {
        return ResponseEntity.status(428).header("ETag", currentEtag(id))
            .body(problem("precondition-required", 428, "Send If-Match with current version"));
    }
    // If-Match uses STRONG comparison (RFC 9110): a weak ETag W/"7" never matches.
    // -> parseEtag returns -1 for the W/ form, so the service matches no version -> 412
    long expected = parseEtag(ifMatch);
    try {
        Beneficiary saved = service.update(id, expected, req);
        String etag = '"' + String.valueOf(saved.getVersion()) + '"';
        return ResponseEntity.ok().eTag(etag).body(saved);
    } catch (OptimisticLockingFailureException e) {
        return ResponseEntity.status(412).eTag(currentEtag(id))
            .body(problem("version-conflict", 412, "Data changed, please reload"));
    }
}
~~~

How service uses expected version:
- **Method A (recommended)**: conditional UPDATE, check row count:
~~~java
@Modifying(clearAutomatically = true)   // bulk update bypasses persistence context
@Query("update Beneficiary b set b.name = :name, b.dailyLimit = :limit, " +
       "b.version = b.version + 1 where b.id = :id and b.version = :expected")
int updateIfVersion(long id, long expected, String name, BigDecimal limit);
~~~
  Returns 0 rows → throw {{OptimisticLockingFailureException}}. Single statement, atomic, no race window.
- **Method B**: inside the transaction, load the entity, **compare {{entity.getVersion()}} with {{expected}} and throw {{OptimisticLockingFailureException}} if they differ**, then set the fields; {{@Version}} covers the remaining race between load and flush. Note: assigning {{setVersion(expected)}} on a managed entity does **not** work — Hibernate uses the version it loaded — so you must do the comparison yourself. The @Version exception is only thrown at flush/commit.

### Pitfalls
- **Reading version in controller then comparing**: two requests can still race between compare and write. Let the DB be the judge.
- **ETag from {{hashCode()}} or JSON serialization**: field/map order changes between runs → false 412. Use version number or **stable** content hash.
- **ETag from updated_at with second precision**: two updates in same second share ETag → lose one change. Use microseconds or version counter.
- **Forgetting to return ETag after write**: client has no new version, next request guaranteed 412.
- **{{If-Match: *}}**: means "resource must exist", not "match any version"; don't use for updates.
- **Multi-instance**: version in DB works cluster-wide; caching version in memory does not.

### Client handling 412 gracefully
- GET again, diff against local; if they edited **different fields**, auto-merge and PUT with new version.
- If same field → show diff for user to choose, don't auto-overwrite.
- Retry with backoff + max attempts; each retry must GET fresh, don't reuse old If-Match.
- With partial PATCH, consider JSON Merge Patch and still keep If-Match; JSON Patch has "test" op but doesn't replace DB version check.

> Senior tip: For money data I usually **don't** let clients "overwrite" on 412 — force reload and confirm. Track 412 rate per endpoint: unusually high means UI caches too long or multiple tabs editing. And never use pessimistic lock for user forms: holding a row lock across an HTTP request is the fastest way to exhaust the connection pool.`,
    follow: [
      'When is optimistic locking not enough and you must use pessimistic lock?',
      'How to return 412 with enough info for client to auto-merge?'
    ]
  },
  'api-021': {
    q: 'With a system spanning mobile app, web admin, banking partners, and 30 internal microservices: when to choose REST, gRPC, GraphQL at each boundary? Draw the protocol architecture and state the operational cost of running multiple protocols simultaneously.',
    a: `**Summary:** Choose protocol by **boundary**, not preference: partners/public use REST + JSON + OpenAPI (firewall-friendly, cacheable, debuggable, wide SDK support); internal sync services use gRPC (strict schema, small payload, streaming, deadline propagation); diverse clients needing aggregated data use GraphQL at BFF layer. Real architecture is **hybrid**: mobile/web → BFF → internal gRPC → Kafka for async. The price is three toolchains, three versioning schemes, three observability stacks — only worth it when each boundary has a clear reason.

### Selection by boundary
| Boundary | Choice | Why | Avoid |
|---|---|---|---|
| Banking partners | REST/JSON, OpenAPI | Firewall allows 443, curl works, SDK in every language, easy caching | gRPC (many partners lack HTTP/2 client), GraphQL (hard to limit query cost) |
| Mobile app | REST or GraphQL BFF | GraphQL reduces over-fetching for complex screens | Direct gRPC (needs gRPC-Web + proxy) |
| Web admin | REST | Simple CRUD, HTTP caching, few diverse queries | GraphQL unless screens are truly complex |
| Internal sync service | gRPC | Protobuf compact, HTTP/2 multiplex, deadline, codegen | REST/JSON for high-throughput |
| Internal async service | Kafka (events) | Decouple, replay, backpressure | Chained sync calls |
| Partner realtime | Webhook or SSE | Simple, traverses proxies | GraphQL subscription |

### Reference architecture
~~~text
Android/iOS ──┐
              ├─► API Gateway ──► GraphQL BFF ──┐
Web admin ────┘        │                        ├─► account-svc (gRPC)
                       └─► REST /v1 (admin) ────┤
Partner ──► API Gateway ──► REST /partner/v1 ───┤─► transfer-svc (gRPC)
                                                 └─► ledger-svc (gRPC)
                                                          │
                                                      Kafka (events)
~~~
- BFF (Backend for Frontend) holds **screen-shaped schema**, calls multiple gRPC services behind, merges and trims fields.
- Gateway handles authn, rate limit, routing; may transcode gRPC-JSON for a few special clients but don't turn it into a complex translation layer.

### gRPC: what you gain, what you lose
- Gain: {{.proto}} is contract + codegen; payload much smaller than JSON; multiplexing on one connection; bidirectional streaming; deadline auto-propagates via metadata.
- Lose: hard to debug by eye (need grpcurl), browser requires gRPC-Web proxy, load balancing needs L7 that understands HTTP/2 (mesh or client-side LB), CDN/cache nearly unusable, errors are numeric status + binary detail.
- Schema evolution: only add fields with new numbers, **reserve** deleted numbers/names, never change type; this discipline is mandatory, not optional.

### GraphQL: what you gain, what you lose
- Gain: client picks fields, one request for many resources, eliminates "v2 because mobile needs one more field" versioning.
- Lose: N+1 with naive resolvers (must batch/DataLoader), malicious queries can cost 1000x more (must limit depth/complexity, timeout, persisted queries), HTTP caching hard (only cached persisted GET), authorization must check **per field**, observability must be field-level.
- Federation fits many teams owning schema, but federation gateway is a separate system needing on-call.

### REST: don't drop it until you must
- REST wins on universality: caching, CDN, HTTP semantics, tooling, new hires understand it instantly.
- Real drawback: chatty when one screen needs 8 resources, over-fetching, streaming requires separate SSE/WebSocket, not native like gRPC.
- If you have one client and CRUD, REST is the cheapest to operate correctly.

### Operational cost of multiple protocols (lead must articulate)
1. **Observability**: traces must cross HTTP/JSON, gRPC (metadata), GraphQL (field-level) — standardize on W3C traceparent + OpenTelemetry, no custom hacks.
2. **Identity & auth**: same identity but three transport mechanisms (Bearer header, gRPC metadata, GraphQL context) → one shared library.
3. **Versioning**: REST uses URI/header, gRPC uses field numbers, GraphQL uses field deprecation — write guidelines for each.
4. **Testing**: contract test for REST (OpenAPI), buf breaking for proto, persisted queries for GraphQL.
5. **People**: on-call must debug all three; if not, incidents drag on.

### How to migrate without big-bang
- Put gateway first, migrate route by route (strangler), run in parallel, compare results (shadow traffic) before cutover.
- Start with **one** new protocol at one boundary with clear pain; don't rewrite everything just because "gRPC is faster".

> Senior tip: In banking, the biggest constraint is often not performance but **auditability and debuggability during incidents**. REST/JSON leaves readable access logs — that's why it remains the default at partner boundaries. gRPC saves real payload (typically 30–60% reduction with large DTOs) but only worth it internally where you control all clients. GraphQL only appears when screen count and client variance are large enough that N+1/complexity cost is offset.`,
    follow: [
      'Should GraphQL BFF call REST or gRPC downstream? Why?',
      'How to keep traces intact when client uses GraphQL and backend uses gRPC?'
    ]
  },
  'api-022': {
    q: 'You are the **receiver** of webhooks from a partner bank: they deliver at-least-once, may send duplicates, out of order, retry for 72 hours. Design the receiving endpoint to ensure no duplicate processing, no lost events, and no retry storm taking down your system.',
    a: `**Summary:** Receive webhooks with **ack fast, process later**: verify signature on raw body, insert event into table with unique {{(provider, event_id)}} (insert-first to block duplicates), return 2xx within ~1 second, then process asynchronously. All processing must be idempotent; transient errors go to internal DLQ with your own retry schedule, don't depend on partner retries. Don't trust event order — use version/sequence or call partner API to fetch canonical state.

### Why at-least-once is **your** problem
The sender only guarantees "deliver at least once": timeouts, lost ACKs, deploys mid-send all create duplicates. If your endpoint processes synchronously for 5 seconds, partner times out at 3 seconds and retries → two workers both credit the account. Correct architecture:

~~~text
POST /webhooks/bank
  │
  ├─ 1. verify HMAC + timestamp + key id        (cheap, synchronous)
  ├─ 2. INSERT event (unique provider+event_id) ← block dupes at DB
  ├─ 3. return 200/202 immediately (business logic not processed yet)
  │
  └─ worker (async, with its own retries)
        ├─ process idempotently per event_id
        ├─ transient error → retry with backoff
        └─ permanent error → DLQ + alert
~~~

### Verifying signature correctly
- Sign **raw body bytes** as received, not the parsed-then-reserialized object (field order/whitespace changes break signature).
- Compare **constant-time** ({{MessageDigest.isEqual}}), not string {{equals}}.
- Check timestamp within ±5 min window to block replays; combine with storing seen {{event_id}}.
- Support **key rotation**: header carries key id, server keeps two secrets simultaneously; with only one secret, the day partner rotates keys is the day you lose events.
- Return 401 on bad signature, and **do not** log raw body containing customer data.

~~~java
@PostMapping("/webhooks/bank")
public ResponseEntity<Void> receive(
        @RequestHeader("X-Signature") String sig,
        @RequestHeader("X-Timestamp") long ts,
        @RequestHeader("X-Key-Id") String keyId,
        @RequestBody byte[] raw) {

    if (Math.abs(clock.millis() - ts) > Duration.ofMinutes(5).toMillis()) {
        return ResponseEntity.badRequest().build();
    }
    if (!verifier.valid(keyId, ts, raw, sig)) {            // HMAC-SHA256, constant-time
        return ResponseEntity.status(401).build();
    }
    try {
        inbox.insertIfAbsent(provider, eventIdOf(raw), raw);   // unique constraint
    } catch (DuplicateKeyException dup) {
        return ResponseEntity.ok().build();                // already received, ack again
    }
    worker.wakeUp();                                       // process async
    return ResponseEntity.accepted().build();
}
~~~

### Deduplication at DB layer, not code
- {{existsBy... then save}} has a race: two parallel requests both see not-exists.
- Use unique index {{(provider_id, event_id)}} and catch {{DuplicateKeyException}} — DB is the judge.
- Inbox table stores state: RECEIVED, PROCESSING, DONE, FAILED, with attempt count and last error.
- If payload arrives before the business record exists (event beats the create-transaction), worker retries with backoff instead of marking FAILED immediately.

### Event ordering
- Don't assume events arrive in order. Use partner's {{sequence}}/{{version}}: only apply if greater than stored version, skip stale ones.
- With state machines (PENDING → PAID → REFUNDED), validate transitions; backward transition signals out-of-order, needs reconciliation.
- Safest: when in doubt, call partner API to fetch current state (source of truth) instead of inferring from event chain.

### 2xx, 4xx or 5xx?
| Situation | Return | Reason |
|---|---|---|
| Inbox insert succeeded | 200/202 | Partner stops retrying |
| Duplicate event | 200 | Still "received", avoids useless retry |
| Bad/missing signature | 401/400 | Config error, must surface |
| Invalid payload schema | 400 | Partner must fix, retry won't help |
| Transient DB/Redis error | 5xx | Let partner retry on their schedule |
| Business rejects (order not found) | 200 + internal DLQ | Avoid 72h retry storm for no reason |

### Operations
- Alert on: DLQ depth, age of oldest non-DONE event, signature failure rate, duplicate rate.
- Separate rate limit for webhook endpoint per provider — retry storms will happen, need a valve.
- Daily reconciliation with partner statement/ledger to catch completely lost events (at-least-once doesn't guarantee no-loss if sender gives up).
- Load test by replaying 10,000 duplicate events in 1 minute: correct system acks all without creating duplicate ledger entries.

> Senior tip: Never let the webhook endpoint call heavy business services directly. I've seen a partner retry turn 3,000 events into 40,000 requests in 10 minutes and choke the entire user-facing API — because the endpoint processed synchronously and had no rate limit. Inbox + worker + DLQ is the minimum viable model; the hardest part isn't the code but **reconciliation**: you must have a job that cross-checks with the partner, otherwise you only know events are missing when customers call.`,
    follow: [
      'If partner doesn\'t send sequence, how to handle out-of-order?',
      'Should webhook receiver share queue with internal events or keep separate?'
    ]
  }
});