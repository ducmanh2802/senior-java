/*
 * English translation of js/data/q-api.js — task T962. Format: js/core/i18n.js (content overlay).
 * ids: api-031 api-032 api-033 api-034 api-035 api-036 api-037
 */
App.i18n.content({
  'api-031': {
    q: `How do HTTP/1.1, HTTP/2, and HTTP/3 differ in multiplexing, head-of-line blocking, and header compression (HPACK)? What is the impact on the connection pool of Java clients (HttpClient, RestClient)?`,
    a: `**Summary:** HTTP/1.1 processes requests sequentially on each TCP connection, so clients must open multiple connections in parallel; HTTP/2 multiplexes — interleaving multiple request/response pairs on a single connection via binary framing — and compresses headers with HPACK, but still suffers head-of-line blocking (a lost packet stalls all streams behind it) at the TCP layer; HTTP/3 moves to QUIC (a protocol running over UDP with TLS 1.3 integrated) so each stream is independent, avoiding transport-layer head-of-line blocking. With Java HttpClient (Java 11+), when the server supports HTTP/2 via ALPN, the client automatically coalesces to nearly 1 connection per host, so "increasing the connection pool" in the HTTP/1.1 style is no longer as meaningful.

### Context: why HTTP had to evolve
Imagine calling to order several dishes, but each call can order only one dish and you must wait for confirmation before calling the next dish. That is HTTP/1.1 over one connection. To be faster, people open many calls in parallel (many TCP connections) — costly on both sides. HTTP/2 was born to order many dishes over **the same call** (multiplexing). HTTP/3 goes further: if one packet is lost, the other dishes still proceed, without waiting for that packet to be resent.

### Mechanism comparison step by step
| Criterion | HTTP/1.1 | HTTP/2 | HTTP/3 |
|---|---|---|---|
| Transport layer | TCP | TCP + TLS (usually) | QUIC over UDP + TLS 1.3 integrated |
| Multiplexing | No (one request/response at a time per connection) | Yes: numbered streams, split into frames interleaved on 1 TCP connection | Yes: each QUIC stream independent |
| Head-of-line blocking | Yes at both HTTP and TCP | Not at HTTP, **still at TCP** (1 lost packet → all streams wait for retransmit) | Not at transport layer (lost packet affects only that stream) |
| Header compression | No (sends Cookie, User-Agent again every request) | HPACK: static table + dynamic table, Huffman coding | QPACK (HPACK variant suited for QUIC, avoids HOL from table references) |
| Typical connections per host | 6 (browser) or pool N (Java client) | Usually 1 | Usually 1 |
| Connection setup | TCP handshake + TLS handshake | Like HTTP/1.1 + ALPN negotiate h2 | 1-RTT or 0-RTT (faster, supports network migration) |

### How HPACK works (HTTP/2)
HTTP headers often repeat (:method, :path, cookie, authorization). HPACK compresses using two tables:
1. **Static table**: 61 popular headers available on both client and server (e.g. :method GET is index 2).
2. **Dynamic table**: newly seen headers are added to a shared table for that connection; next time only the index is sent.
3. String values can be Huffman-encoded to shrink further.
Example: 10 consecutive requests with the same 500-byte Authorization header — HTTP/1.1 sends 5,000 bytes of headers; HTTP/2 after the first request sends only a few index bytes.

### Impact on Java client connection pool
- **java.net.http.HttpClient (Java 11+)**: defaults to negotiating HTTP/2 via ALPN (Application-Layer Protocol Negotiation — a step in the TLS handshake for both sides to pick the protocol). When the server supports h2, HttpClient uses **one connection** for multiple concurrent requests to the same host. So increasing "pool size" the HTTP/1.1 way (opening many connections) does not help; instead, limit concurrent streams and timeouts.
- **RestClient / WebClient (Spring, using Reactor Netty)**: also support HTTP/2; the ConnectionProvider manages connections, but with HTTP/2 enabled, 1 connection carries many streams.
- **Fallback**: if the server/proxy does not support h2, HttpClient falls back to HTTP/1.1 (pool connections as before). Check ALPN in practice, don't assume.
- **Note on HTTP/3**: Java HttpClient (up to Java 21) does not officially support HTTP/3; need external libraries (Jetty, Netty incubator) to use QUIC.

~~~seq
title: HTTP/2 multiplexing over one TCP connection
actors: Java Client | TCP Conn | API Server
Java Client -> TCP Conn: Stream 1: GET /orders/1
Java Client -> TCP Conn: Stream 3: GET /orders/2
Java Client -> TCP Conn: Stream 5: POST /payments
TCP Conn -> API Server: Interleaved frames (S1, S3, S5)
API Server --> TCP Conn: Response frame S3 (finished first)
TCP Conn --> Java Client: Response Stream 3
API Server --> TCP Conn: Response frames S1, S5
TCP Conn --> Java Client: Response Stream 1, Stream 5
~~~

### Real-world example
Assume a Java service (Spring Boot 3, Java 21) calls downstream catalog-service: 1,500 QPS, each request returns ~2 KB JSON, target p99 latency 80ms. Initially using HttpClient default HTTP/1.1; under load the client opens ~120 concurrent TCP connections to the same host, p99 rises to 220ms due to head-of-line blocking and connection/TLS handshake cost. Downstream CPU rises from handling many connections.

Handling: (1) Enable HTTP/2 on the reverse proxy (Nginx/Envoy) and ensure ALPN h2 in the TLS terminator. (2) Use the default HttpClient (self-negotiates h2). (3) Reduce old-style pool configuration (no need for 120 connections), set reasonable per-request timeouts. (4) Measure with metrics: actual connections per host, h2 vs h1 ratio.

Result: connections to catalog dropped from ~120 to ~6 (each client instance keeps 1 h2 connection per host, 6 instances), p99 down to 65ms, client memory down ~40MB from fewer socket buffers, downstream CPU down 12%. With 0.5% packet loss, p99 is still better than expected because of TCP head-of-line blocking (HTTP/2) — if latency is more sensitive, consider HTTP/3 at the edge.

### Common production errors
- **Increasing connection pool when already on HTTP/2**: does not improve throughput, only wastes resources; check ALPN negotiation via logs or HttpClient.newBuilder().version(...) and connection count metrics.
- **Load balancer/proxy "speaks" HTTP/1.1 to the backend**: the client sees h2 to the LB but LB connects h1 to the app — end-to-end multiplexing is not used. Check each hop.
- **Confused timeout layers**: HTTP/2 has connection timeout and stream timeout; setting only connection timeout may let a slow stream hang long without being cut.
- **HPACK dynamic table and security**: CRIME/BREACH variants (HPACK bomb) can occur if the server does not limit table size; use safe default configuration from reputable servers/proxies.

### Sample interview answer
"I look at the differences along three axes: multiplexing, head-of-line blocking, and header compression. HTTP/1.1 processes sequentially on each connection, so the client must open multiple TCP connections in parallel — wasteful resources and still HOL blocked. HTTP/2 allows multiplexing: many request/response pairs are split into frames and interleaved on the same TCP connection, and HPACK compresses headers using static and dynamic tables, greatly reducing overhead from repeated headers. However, HTTP/2 still runs over TCP, so if a packet is lost, all streams on that connection must wait for retransmission — that is transport-layer head-of-line blocking. HTTP/3 solves this with QUIC over UDP: each stream is independent, a lost packet only affects the related stream, and TLS 1.3 is integrated so connection setup is faster. With Java, HttpClient from Java 11 automatically negotiates HTTP/2 via ALPN; when successful, it uses nearly one connection for multiple concurrent requests to the same host, so the HTTP/1.1 mindset of 'increasing the connection pool' is no longer appropriate. I would measure actual connections and p99 before/after, and verify ALPN end-to-end because a proxy in between may still downgrade to HTTP/1.1."

> Senior tip: Before "tuning the pool", verify the actual protocol via metrics (connections per host, h2 ratio). Enabling HTTP/2 end-to-end (or at least to important hops) usually brings more benefit than any pool tuning; in high packet-loss environments (mobile, cross-region), consider HTTP/3 at the edge to cut head-of-line blocking at its root.`,
    follow: [
      'How does ALPN negotiation work and when does HttpClient fall back to HTTP/1.1?',
      'Can the HPACK dynamic table be poisoned and what is the mitigation?',
      'When should HTTP/2 be turned off (load balancer not supported, high packet loss)?'
    ]
  },
  'api-032': {
    q: `gRPC internals: HTTP/2 streams, protobuf encoding (varint, field number), deadline propagation. When should gRPC not be used?`,
    a: `**Summary:** gRPC is RPC over HTTP/2: each call is a stream, messages serialized with Protocol Buffers (binary, field number + varint). Deadline propagates from client to server and downstream. Don't use when the client is a browser directly, payload is very large/media, or easy debugging with curl is needed.

### Quick understanding
gRPC is like calling a remote function over the network: define the function in proto, generate code, call it like a local method. Protobuf packs data into small labeled buckets → small and fast. Deadline is like a timer: expired → the whole call chain is cancelled.

### Protobuf encoding
- Message = sequence of fields, each field = (field_number << 3) | wire_type.
- Varint: base-128 variable-length integer, high bit is continuation → small numbers take 1 byte.
- Field number is the field identity; adding a new field doesn't break old clients.
- Compared to JSON: 3–10x smaller, faster to parse, but not human-readable.

### HTTP/2 streams
- Unary, server streaming, client streaming, bidirectional.
- Metadata via headers; trailers carry status code + message.

### Deadline propagation
- Client sets deadline (Context.withDeadlineAfter).
- Server receives via grpc-timeout header; when calling downstream must propagate remaining deadline.
- Downstream out of time → CANCELLED, avoids useless work.
- Cancellation must also be propagated.

### When not to use gRPC
- Direct browser client (needs gRPC-Web + proxy).
- Very large payload / media streaming.
- Team needs easy curl/Postman debugging.
- Public API for third parties.
- Load balancer/proxy doesn't support HTTP/2 or trailers.

### In production
- Symptom: deadline exceeded cascade → check propagation and per-hop timeout.
- Measure: latency per hop, cancellation rate, message size.
- Tuning: reasonable deadline, keepalive, max message size, retry only idempotent.

### Sample 1-minute spoken answer
"gRPC is RPC over HTTP/2 with protobuf binary: field number + varint; each call is an HTTP/2 stream; deadline propagates. I don't use it when the client is a browser directly, payloads are large/media, or easy debugging and public APIs are needed."

### Inside: one protobuf message on the wire
For message Payment with int64 amount = 1 and string currency = 2, value amount = 150, currency = "VND": each field writes a **tag** = (field number × 8 + wire type) then the value. amount: tag 08 (field 1, varint), value 150 as varint 2 bytes 96 01; currency: tag 12 (field 2, length-delimited), length 03, then 3 bytes "VND". Total **9 bytes**, vs about 33 bytes for equivalent JSON. Field **names are not on the wire** — so renaming fields is safe, but **changing the field number or type** of a used field breaks compatibility; dropped fields must have their number **reserved**.

### Real-world example
Two internal services (pricing ↔ ordering) call each other 12,000 times/second via REST JSON, CPU serialization takes 25%. Switched to gRPC: payload ~70% smaller, p99 down from 35ms to 11ms. But the first incident: a dev changed field discount's number from 5 to 6 when "reordering the proto file" → the old service read the value with the wrong type, applied wrong discounts for 40 minutes. After that added **buf breaking** to CI to block breaking changes. Deadline: ordering service sets a 300ms deadline; gRPC passes the remaining deadline via grpc-timeout header to the next service, so the pricing service cancels itself when the client has given up instead of doing useless work.

> Senior tip: Deadline propagation is the biggest advantage — set the deadline at the edge and propagate down; don't set per-service timeouts independently because the total exceeds the edge deadline.`,
    follow: [
      'How does gRPC load balancing work when the client holds a long-lived connection?',
      'Proto field evolution: what are reserved field number and reserved name for?',
      'Compare gRPC vs REST for internal microservices: latency, throughput, debugging.'
    ]
  },
  'api-033': {
    q: `Server-side idempotency key: where to store, race when two requests with the same key arrive concurrently, how to replay the old response?`,
    a: `**Summary:** Server-side idempotency key is a mechanism so an operation (usually POST) takes effect **only once** even if the client resends many times. The client sends the Idempotency-Key header (usually a UUID). The server stores the key together with request hash and response in a durable store (DB with unique constraint or Redis with SETNX) with TTL; requests with duplicate key return the old response intact. When two requests with the same key arrive concurrently, the server uses an atomic insert so only one request is processed; the other waits or gets "processing" status; if the same key but different body → 422.

### Context: why the server must protect itself
Idempotency key (idempotency key — an identifier to mark "this is the same operation") exists because the network is unreliable: client POSTs to create an order, the server processes it but the response is lost, the client times out and retries. If the server processes from scratch again, the order is created twice. The client may promise "I won't send duplicates", but the server must not trust that promise — the server must verify itself.

### Storage design — where to store, what to store
- **What to store**: a record with key, scope (e.g. user_id + endpoint), request_hash (SHA-256 of the body to detect the client reusing the key for a different body), status (processing/completed/failed), response_status, response_body, created_at, expires_at.
- **Where to store**:
  - **Relational DB (PostgreSQL/MySQL)**: durable, unique constraint on (scope, key) for atomic insert. Suitable for financial transactions because it needs a durable source of truth.
  - **Redis**: fast, uses SETNX (set-if-not-exists) with TTL. Suitable for high throughput, but persistence (RDB/AOF) and data loss risk on crash must be considered — should not be the sole source of truth for money.
  - **Common practice**: DB is the source of truth, Redis is a fast check layer if latency optimization is needed.
- **TTL**: usually 24 hours; long enough for the client to retry within a reasonable window, short enough not to bloat the store.

### Race when two requests with the same key arrive concurrently — step by step
Suppose due to concurrent retry or a client bug, two requests R1 and R2 with the same Idempotency-Key: k1 arrive nearly simultaneously:

~~~seq
title: Race of two requests with the same Idempotency-Key
actors: Client R1 | Client R2 | API | DB
Client R1 -> API: POST /orders (key k1)
Client R2 -> API: POST /orders (key k1)
API -> DB: INSERT key k1, status=processing (atomic)
DB --> API: R1 OK (inserted)
API -> DB: INSERT key k1 (atomic)
DB --> API: R2 FAIL (unique conflict)
API -> DB: R1 processes business, stores response
DB --> API: R1 completed
API --> Client R1: 201 + response
API -> DB: R2 reads key k1 again
DB --> API: status=completed + old response
API --> Client R2: 201 + old response (same as R1)
~~~

Cases to handle:
1. **Key does not exist**: perform atomic insert with status=processing. Only the side whose insert succeeds runs the business logic.
2. **Insert fails (unique constraint hit)**: read the existing record. If request_hash differs → return **422 Unprocessable Entity** (client misused the key for a different body). If status=processing → return **409 Conflict** with Retry-After or short wait (poll) depending on design. If completed → return the **old response intact** (same status code, same body) so the client sees the first request as successful.
3. **Applies only to write methods**: POST/PATCH; GET does not need it.

### Real-world example
Assume a ticketing system: 800 QPS at ticket sale, p99 latency 150ms, client timeout rate 0.4%. Without idempotency key, each sale records ~1,200 duplicate orders/day (user clicks again while spinner spins), average refund/void handling takes 6 minutes/order for customer service.

Implementation: (1) App client generates UUID per "Book ticket" click, keeps the same key when retrying. (2) idempotency_records table (PostgreSQL) with unique index (user_id, endpoint, idem_key), TTL 24h cleaned by job. (3) Transaction: INSERT ... ON CONFLICT DO NOTHING RETURNING; if insert fails, SELECT the existing record. (4) Return old response with Idempotent-Replayed: true header for easy debugging.

Result after 1 month: duplicate orders down to < 5/day (only cases where the client generates a new key each time — fixed in the app), p99 up ~4ms, customer-service load from duplicate orders down ~90%.

### Common production errors
- **Not hashing the body**: the client accidentally reuses the key for a different request content → the server returns an out-of-context old response. Always store and compare request_hash.
- **Storing response in Redis not durable for financial transactions**: Redis restart loses the record → retry after restart creates duplicates. Financial transactions must use durable DB as source of truth.
- **Returning a different response from the first time**: the client relies on the response (e.g. order_id) to display; if replay returns a different body, the client is confused. Must return the **stored response intact**.
- **Wrong key scope**: a global key for every user can collide; a too-narrow key (per attempt) loses the anti-duplicate effect. Use scope (user_id, endpoint, key).

### Sample interview answer
"I design server-side idempotency key as a blocking layer at the start of write requests. The client sends the Idempotency-Key header as a UUID for each business operation and keeps the same key when retrying. The server hashes the body, then tries to insert a record (scope, key, request_hash, status=processing) into the DB with a unique constraint — this operation is atomic, so when two requests with the same key arrive concurrently, only one insert succeeds and runs the business logic. The other hits unique conflict: if body hash differs I return 422 because the client misused the key; if processing I return 409 or ask to wait; if completed I return the stored old response intact, same status code and body. I store in PostgreSQL as the source of truth because it's durable; Redis only if a fast check is needed, but not the sole place for financial transactions. TTL is usually 24 hours. The point I emphasize is hashing the body and returning the exact old response; otherwise this mechanism causes hard-to-debug context errors worse than duplicates."

> Senior tip: For financial transactions, choose a DB with unique constraint as the atomic "barrier" and treat the stored response as immutable. Don't optimize by skipping storing the response body — the client needs a stable response on replay, and you need evidence of processing when investigating incidents.`,
    follow: [
      'How to handle partial failure: request processed but response lost?',
      'Should idempotency key scope be global or per (user, endpoint)?',
      'Compare idempotency key with natural idempotency via PUT with resource id.'
    ]
  },
  'api-034': {
    q: `ETag and If-Match: optimistic concurrency over HTTP, what is the difference between 412 Precondition Failed and 409 Conflict?`,
    a: `**Summary:** ETag (Entity Tag — a "fingerprint"/version of a resource) and If-Match enable optimistic concurrency control (assume conflicts are rare, check only on write) over HTTP. Client GET receives ETag, on update sends If-Match: <etag>; server compares with current version, if different returns **412 Precondition Failed** (precondition not satisfied — version drifted, client needs to fetch and retry). **409 Conflict** is different in nature: used when the request conflicts with the **current business state** (e.g. cancel an already-delivered order), not version drift; the client usually can't just blindly retry but must handle business logic.

### Context: why optimistic concurrency is needed
Imagine two people editing a Google Doc together without a merge mechanism: the later editor silently overwrites the earlier one. With an API, two clients GET the same order (version 5), both edit, both PUT — without version checking, the later write silently overwrites the earlier one (lost update). Optimistic concurrency solves this by: "only write if the version is still what you read".

### ETag and If-Match step by step
- **ETag** is a server-generated value attached to the current representation of the resource. It can be a content hash ("a1b2c3") or a version number ("v5"). A strong ETag means byte-for-byte identical; a weak ETag (W/"v5") means semantically equivalent.
- **If-Match**: header the client sends with write requests (PUT/PATCH/DELETE) to say "only proceed if the current ETag matches this value". If-Match: * means "only proceed if the resource exists".
- **If-None-Match**: the opposite, usually used for conditional GET (returns 304 Not Modified if unchanged) or create-only-if-not-exists.

~~~seq
title: Optimistic concurrency with ETag and If-Match
actors: Client A | Client B | API | DB
Client A -> API: GET /orders/42
API -> DB: Read order version 5
API --> Client A: 200 + ETag: "v5"
Client B -> API: GET /orders/42
API --> Client B: 200 + ETag: "v5"
Client B -> API: PUT /orders/42 (If-Match: "v5")
API -> DB: Check version == 5? OK, update
API --> Client B: 200 + ETag: "v6"
Client A -> API: PUT /orders/42 (If-Match: "v5")
API -> DB: Check version == 5? NO (already 6)
API --> Client A: 412 Precondition Failed
Client A -> API: GET /orders/42 (fetch again)
~~~

### 412 Precondition Failed vs 409 Conflict
| Criterion | 412 Precondition Failed | 409 Conflict |
|---|---|---|
| Cause | Precondition (If-Match, If-None-Match, If-Unmodified-Since) not satisfied | Request conflicts with **current business state** of the resource |
| Example | PUT with If-Match: "v5" but resource is already "v6" | Cancel an order but order is already DELIVERED; create user with duplicate email (business uniqueness) |
| What client should do | GET resource again + new ETag, merge changes, retry | Read error, handle per business rules (notify user, choose another way); **do not** blindly retry |
| Nature | Version drift (technical concurrency) | State/rule conflict (business) |

Distinguishing clearly helps client (and debuggers) know whether to auto-retry: 412 is usually retryable after refreshing data; blindly retrying 409 is usually useless or causes a loop.

### Real-world example
Assume an inventory management system: 300 QPS inventory updates from many channels (web, app, partner), each product record read/written by ~4 clients concurrently during sale hour. Previously used "last write wins" (silent overwrite) → about 0.8% updates lost (lost update), causing oversell ~120 orders/day, each order aftermath takes ~15 minutes.

Implementation: (1) Each GET /inventory/:sku response returns ETag as version number (version column in DB). (2) Client sends If-Match on PUT/PATCH. (3) Server uses UPDATE ... WHERE sku=? AND version=?; if affected rows = 0 → return 412. (4) Client on 412 fetches again, recomputes delta, retries (max 3 times with backoff).

Result: lost update down to 0, 412 rate ~2.1% during sale hour (real conflicts detected), retry succeeds 97% within 2 attempts, race-caused oversell down to < 5 orders/month.

### Common production errors
- **Confusing 409 with version error**: API returns 409 when ETag drifts, so the client doesn't know to refresh and retry; use 412 correctly for precondition failure.
- **Using weak ETag for full update**: weak ETag only ensures semantic equivalence, may miss important byte differences; for full-replacement PUT, prefer strong ETag.
- **Not returning ETag in GET response**: client has no value to send If-Match → loses concurrency control. Every GET of a mutable resource should consider returning ETag.
- **ETag not stable across instances/cache**: if ETag is computed from timestamp or instance-local state, the same content can yield different ETags after load balancing → false 412. Compute ETag from content or DB version.

### Sample interview answer
"I use ETag and If-Match to implement optimistic concurrency control over HTTP. The flow is: client GETs a resource and receives an ETag header representing the current version; on update, client sends PUT or PATCH with If-Match with that ETag. The server compares with the stored version — if it matches, update and return a new ETag; if not, return 412 Precondition Failed to report the version has changed. On receiving 412, the client should GET the new data, merge changes, then retry — not blindly overwrite. I distinguish 412 from 409 clearly: 412 is a failed precondition, i.e. technical version drift and usually retryable; 409 Conflict is a business state conflict, e.g. cancelling an already-delivered order — blind retry doesn't solve it, the client must handle business rules. In practice I combine ETag with a version column in the DB and UPDATE ... WHERE id=? AND version=? for atomic checking at the data layer."

> Senior tip: Standardize error semantics in the API contract: 412 = "refresh then retry", 409 = "read the business error and decide". This clarity helps clients implement retries correctly and reduces many "infinite retry" or "lost update" bugs during integration.`,
    follow: [
      'When to use If-None-Match (conditional GET) instead of If-Match?',
      'ETag with distributed cache and load balancer: how is consistency?',
      'How does conditional request in HTTP caching (304 Not Modified) differ from concurrency control?'
    ]
  },
  'api-035': {
    q: `Webhook: at-least-once delivery, HMAC signature + timestamp anti-replay, retry and ordering — how?`,
    a: `**Summary:** Webhook is an HTTP callback mechanism (server A proactively POSTs events to server B's URL) usually operating on the **at-least-once** model (deliver at least once — may duplicate, must not lose). To prevent forgery and replay (resending old requests), the provider signs the payload with HMAC-SHA256 over timestamp + "." + body, and the receiver verifies the signature with constant-time comparison, and rejects if the timestamp is too old. Provider retries with exponential backoff on error; receiver must return 2xx quickly, process asynchronously (push to queue), be **idempotent** by event id, and handle out-of-order events itself.

### Context: why webhook is "harder" than a normal API call
Webhook inverts the direction: instead of you calling the provider, the provider calls you. You don't control timing, call count, order, or the intermediary network. Three problems always appear: (1) requests may be resent → you process duplicates; (2) attackers may forge requests → you execute fake commands; (3) events arrive out of order → you update state incorrectly. Good design accepts at-least-once and protects on the receiver side.

### HMAC signature + timestamp against forgery and replay
- **HMAC** (Hash-based Message Authentication Code — authentication code using hash function and secret key): provider and receiver share a secret. Provider computes signature = HMAC-SHA256(secret, timestamp + "." + raw_body) and sends it in headers (e.g. X-Signature, X-Timestamp).
- **Receiver verifies step by step**:
  1. Get timestamp from header, compute |now - timestamp|; if greater than threshold (e.g. 300 seconds) reject — anti-replay (attacker captures an old request and resends it).
  2. Recompute HMAC from **raw body** bytes (do not parse JSON then serialize again, because formatting may change).
  3. Compare signatures using a **constant-time** function (takes the same time regardless of which character differs) to prevent timing attack (inferring the signature gradually by measuring comparison time).
  4. Support secret rotation: allow 2 valid secrets during transition.

~~~seq
title: Webhook: sign, deliver, retry and idempotent processing
actors: Provider | Receiver API | Queue | Worker | DB
Provider -> Receiver API: POST event (X-Timestamp, X-Signature)
Receiver API -> Receiver API: Verify timestamp + HMAC
Receiver API -> DB: Save event_id if not present (dedup)
Receiver API -> Queue: Push event for async processing
Receiver API --> Provider: 200 OK (fast)
Worker -> Queue: Take event
Worker -> Worker: Process business logic (idempotent)
note Provider..Receiver API: If timeout/5xx, Provider retries with backoff
Provider -> Receiver API: POST again same event
Receiver API -> DB: event_id already present -> skip
Receiver API --> Provider: 200 OK
~~~

### At-least-once, retry, and ordering
- **At-least-once**: provider only considers it successful on receiving 2xx. On timeout, network error, 5xx → retry. So the same event may arrive multiple times.
- **Retry strategy**: exponential backoff (gaps grow: 1s, 2s, 4s, 8s...) + jitter (random noise) to avoid "thundering herd"; limit number of attempts and have dead-letter/alert at the end.
- **Receiver replies fast**: verify signature, save/dedup event, push to queue, return 2xx — **do not** run heavy business logic in the request handler, because slowness makes the provider treat it as error and retry.
- **Order not guaranteed**: retry may make event B (newer, resent later) arrive after event A (older) or interleaved. Receiver needs: attach event_id and occurred_at/sequence; dedup by event_id; if strict ordering is needed, store state and skip older events (compare version/sequence) or fetch latest state from provider.

### Real-world example
Assume payment gateway integration sending webhook payment.succeeded to an e-commerce system: 120 events/minute normally, 1,200 events/minute during flash sale, p99 business processing (update order, send email) ~900ms. Initially receiver processed synchronously in the handler and did not strictly verify signature.

Incident: (1) A spotty network made 3% of requests time out → provider retry created ~2,500 duplicate/out-of-order processing, some loyalty points added twice. (2) A forged request (no valid signature) slipped into staging due to missing check.

Handling: (1) Verify HMAC-SHA256 + timestamp (5-minute window), compare constant-time; reject invalid signature with 401. (2) webhook_events table with unique event_id for dedup. (3) Handler only does verify + persist + enqueue, returns 200 within 50ms; worker runs idempotent business logic. (4) Provider retries max 8 times with exponential backoff + jitter.

Result: duplicate processing down to 0 (every duplicate deduped), no forged request accepted, provider retry rate clearly reduced because receiver returns 200 fast; during flash sale the queue absorbs the burst, order update latency increases slightly (p95 ~3 seconds) but acceptable per business.

### Common production errors
- **Running business logic synchronously in webhook handler**: slow → provider times out → retry storm → load multiplies. Always separate receive (fast) and process (async).
- **Parse JSON then re-sign to verify**: whitespace/field order changes break the signature. Must verify on **raw body bytes**.
- **Compare signature with regular ==**: vulnerable to timing attack. Use MessageDigest.isEqual (Java) or equivalent constant-time function.
- **Not deduping by event_id**: treat at-least-once as at-most-once → duplicate business logic. Idempotency is mandatory at receiver.
- **Trusting arrival order**: updating state in arrival order can overwrite new state with an old event (late retry). Use occurred_at/sequence to skip stale events or fetch latest state from provider if needed.

### Sample interview answer
"When designing webhook reception, I assume the at-least-once model: the provider retries when it doesn't receive 2xx, so the same event can arrive multiple times and order is not guaranteed. For security, I require the provider to sign the payload with HMAC-SHA256 over a string of timestamp and raw body; the receiver checks the timestamp within an allowed window, e.g. 5 minutes, against replay, then recomputes the HMAC and compares using a constant-time function to prevent timing attacks — and I always verify on the raw body, not re-parsed JSON. For reliability, my handler only does three fast things: verify signature, dedup by event id via unique constraint, push to queue, then return 200. Business logic runs in the worker and must be idempotent. For ordering, I don't trust arrival order: each event has occurred_at or sequence, the worker skips events older than current state or fetches the latest state from the provider if needed. This lets the system withstand retry storms, forged requests, and out-of-order delivery while keeping business correctness."

> Senior tip: Treat the webhook endpoint as "untrusted public input": verify signature + timestamp first, return 2xx only after durable persist/dedup (so a later crash doesn't lose the event), and monitor retry/duplicate/invalid-signature rates — these metrics detect integration errors and attacks early.`,
    follow: [
      'How to verify HMAC constant-time to prevent timing attack?',
      'Webhook ordering guarantees: do any providers guarantee in-order?',
      'Compare webhook with polling and SSE for event delivery.'
    ]
  },
  'api-036': {
    q: `Distributed rate limiting: fixed window vs sliding window log/counter vs token bucket on Redis (atomic Lua script) — how to choose?`,
    a: `**Summary:** Fixed window is simple but spikes at boundaries; sliding window log is accurate but memory-heavy; sliding window counter balances; token bucket allows burst and continuous refill. On Redis, use Lua script for atomic check-and-increment, avoiding races between instances.

### Quick understanding
Rate limit is like a water quota: fixed window is "100 liters per hour" — minute 59 and minute 0 can draw 200 liters in 2 minutes (boundary spike). Sliding window is "100 liters in any consecutive 60 minutes". Token bucket is "a bucket of 100 tokens, 1 token added per second, draw up to 100 at once".

### Algorithms
- Fixed window: counter per (key, window); reset each window. Simple, O(1) memory. Boundary spike.
- Sliding window log: store timestamp of each request; count in [now-W, now]. Accurate, O(N) memory.
- Sliding window counter: weighted average of current and previous window. Balanced.
- Token bucket: bucket capacity + refill rate; consume a token per request; allows burst up to capacity.
- Leaky bucket: FIFO queue with fixed rate; smoothing, no burst.

### Redis Lua atomic
- INCR + EXPIRE is not atomic across multiple instances → race.
- Lua script runs atomically on single-threaded Redis.
- Sliding window counter: needs 2 keys (prev, curr) + Lua weighted compute.
- Token bucket: store {tokens, last_refill} hash; Lua computes refill and consume.

### How to choose
- Public API: token bucket (burst-friendly).
- Login/password reset: small fixed window (anti brute force).
- Billing/quota: sliding window counter.
- Strict fairness: leaky bucket.

### In production
- Symptom: 429 storm when traffic bursts → tune token bucket capacity.
- Measure: 429 rate, Redis latency, key cardinality.
- Tuning: per-user/per-IP/per-endpoint keys; Redis Cluster hash tag so atomic Lua runs on the correct slot.

### Sample 1-minute spoken answer
"Fixed window is simple but has boundary spikes; sliding window counter balances accuracy and memory; token bucket allows burst plus refill. On Redis use an atomic Lua script to avoid races between instances."

### Real-world example
OTP sending API uses **fixed window** 5 times/minute by phone number via INCR + EXPIRE on Redis. Attacker sends 5 at second 59 and 5 at second 61 → 10 OTPs in 2 seconds (window boundary effect), SMS cost spikes about 18 million VND overnight. Another bug: INCR then EXPIRE as two separate commands; pod crashes between them → key never expires, phone number blocked forever. Switched to **token bucket** written as a **single Lua script** (Redis runs the script atomically): read token count and last refill time, refill by elapsed time, consume a token if enough, set TTL — all in one call. Added a second limit by IP and by device. Abnormal SMS cost disappeared; normal users unaffected thanks to allowing short bursts (bucket capacity 3).

> Senior tip: Key design matters more than the algorithm — per-user for authenticated, per-IP for anonymous, per-endpoint for expensive ops; use Redis Cluster hash tag so atomic Lua runs on the correct slot.`,
    follow: [
      'Specifically how many requests in 2 minutes is the fixed window boundary spike?',
      'Token bucket vs leaky bucket: when is burst desirable vs dangerous?',
      'Rate limit response headers (X-RateLimit-*) — what to return and how does the client retry?'
    ]
  },
  'api-037': {
    q: `HTTP caching: how do Cache-Control, ETag, Vary, stale-while-revalidate work, and when to use CDN vs browser cache?`,
    a: `**Summary:** Cache-Control controls who may cache and for how long (max-age, s-maxage, no-store). ETag/Last-Modified enable conditional requests → 304. Vary differentiates response by header (Accept, Accept-Encoding). stale-while-revalidate allows serving stale while revalidating in the background. CDN caches at the edge (s-maxage), browser caches at the client (max-age).

### Quick understanding
Cache is like a fridge: max-age is the expiry date, ETag is a freshness seal, Vary is "version by taste" (Accept-Language), stale-while-revalidate is "use old stock while buying new stock".

### Cache-Control directives
- public/private: who may store.
- max-age: TTL at client.
- s-maxage: TTL at shared cache (CDN).
- no-store: do not store (sensitive data).
- no-cache: must revalidate before use.
- must-revalidate: must not use stale after expiry.
- stale-while-revalidate=N: serve stale for N seconds while revalidating in background.
- stale-if-error=N: serve stale when origin errors.

### Conditional request
- Client sends If-None-Match (ETag) or If-Modified-Since.
- Server returns 304 Not Modified (no body) if unchanged → saves bandwidth.
- Strong vs weak ETag.

### Vary
- Vary: Accept, Accept-Encoding, Accept-Language → cache key includes those headers.
- Vary: * → effectively disables caching.

### CDN vs browser
- Browser cache: per-user, short max-age, suitable for personalized.
- CDN: shared, long s-maxage, edge close to user, suitable for static/public.
- Combine: max-age=60, s-maxage=3600, stale-while-revalidate=86400.

### In production
- Symptom: stale data after deploy → purge CDN or versioned URLs.
- Measure: hit ratio, origin load, bandwidth.
- Tuning: cache key design, purge API, versioned assets.

### Sample 1-minute spoken answer
"Cache-Control with max-age/s-maxage controls client/CDN TTL; ETag enables conditional 304; Vary differentiates by header; stale-while-revalidate serves stale while revalidating. CDN for public/shared, browser for personalized."

### Real-world example
Product catalog API (changes a few times per hour) receives 6,000 requests/second, nearly all hitting the service directly. Add Cache-Control: public, max-age=60, stale-while-revalidate=300 and ETag (content hash): CDN serves 94% of requests, service down to ~350 requests/second; when cache expires, CDN still serves the old copy while refreshing in the background, so users don't see latency. Related incident: API "my cart" was misconfigured with the same CDN rule with public → one user saw another user's cart (CDN caches by URL, not by user). Fix: personal data always Cache-Control: private, no-store; for responses differing by language set Vary: Accept-Language so CDN stores separate copies; check cache headers in automated tests for every endpoint with user data.

> Senior tip: Use versioned URLs for static assets (immutable, max-age=1y) and short TTL for dynamic API; never cache authenticated responses in shared cache.`,
    follow: [
      'How does stale-while-revalidate differ from stale-if-error and when to use both?',
      'How does cache poisoning via wrong Vary header happen?',
      'CDN purge vs versioned URL: operational trade-off.'
    ]
  }
});
