/*
 * English translation of js/data/quiz-spring.js — task T425. Format: js/core/i18n.js (content overlay).
 * ids: qz-db-020 qz-api-009 qz-api-010 qz-api-011 qz-api-012 qz-api-013 qz-api-014 qz-api-015 qz-api-016 qz-api-017 qz-api-018 qz-api-019 qz-api-020 qz-api-021 qz-api-022
 */
App.i18n.content({
  "qz-db-020": {
    "q": `The {{posts}} table has an ascending B-tree index on {{created_at}}. Does {{SELECT * FROM posts ORDER BY created_at DESC LIMIT 20}} use the index to avoid a sort?`,
    "options": [
      `Yes: a B-tree can scan backwards (Index Scan Backward) and return the 20 newest rows without sorting`,
      `No, you have to add a created_at DESC index`,
      `No, ORDER BY ... DESC always forces the DB to sort the whole table`,
      `Only if the table has fewer than 1 million rows`
    ],
    "explain": `**Correct answer: yes, a B-tree can scan backwards.**

### Why it is correct
The leaf pages of a B-tree are doubly linked, so the DB can walk from the end of the index back to the beginning. For a single column, an ASC index serves both ORDER BY ASC and DESC. PostgreSQL's EXPLAIN shows {{Index Scan Backward using idx_posts_created_at}}, reads exactly 20 entries and stops (thanks to LIMIT), with no Sort node. InnoDB (MySQL 8) can read the index backwards as well.

### Why the other options are wrong
- **You need a DESC index**: only when ORDER BY covers **multiple columns with mixed directions**, e.g. {{ORDER BY category ASC, created_at DESC}}; a backward scan of (category, created_at) would produce category DESC, which does not match, so only then do you need {{(category, created_at DESC)}}.
- **DESC always sorts**: wrong, as explained above.
- **1 million row limit**: there is no such limit; the opposite is true — the bigger the table, the bigger the win from avoiding the sort.

> Senior tip: when the query also filters, e.g. {{WHERE author_id = ? ORDER BY created_at DESC LIMIT 20}}, the right index is {{(author_id, created_at)}}: the equality column first, the sort column second. Without author_id, the planner may scan the whole created_at index backwards and filter as it goes, which is very slow for authors with few posts.`
  },
  "qz-api-009": {
    "q": `{{POST /users}} receives a syntactically valid JSON body with the right Content-Type, but the {{email}} field is invalid and {{age}} is negative. According to RFC 9110, which status code describes this situation most accurately?`,
    "options": [
      `415 Unsupported Media Type`,
      `422 Unprocessable Content`,
      `409 Conflict`,
      `500 Internal Server Error`
    ],
    "explain": `**Correct answer: 422 Unprocessable Content.**

### Why it is correct
RFC 9110 (section 15.5.21) defines 422: the server understands the content type and the syntax is correct, but it **cannot process the contained instructions** — exactly what a content validation error is. (The code came from WebDAV as "Unprocessable Entity"; RFC 9110 brought it into the core spec and renamed it.)

In practice, 400 Bad Request is also widely used for validation errors; Spring returns 400 by default when {{@Valid}} fails ({{MethodArgumentNotValidException}}). What matters is being consistent across the whole API and including a per-field error list.

### Why the other options are wrong
- **415**: reserved for a Content-Type the server does not support; here the Content-Type is correct.
- **409**: for a conflict with the **current state** of the resource (e.g. email already exists, stale version), not for malformed input.
- **500**: a client error should never return 5xx; it corrupts alerting and makes clients retry pointlessly.

> Senior tip: return errors per RFC 9457 (Problem Details) with an {{errors}} extension (an array of field and message) so the frontend can attach errors to the right input. And keep 4xx/5xx cleanly separated, because SLOs, alerts, client retry policies and gateways all depend on that.`
  },
  "qz-api-010": {
    "q": `According to RFC 9110, which methods are **idempotent**? (Choose 2)`,
    "options": [
      `POST`,
      `PUT`,
      `PATCH`,
      `DELETE`
    ],
    "explain": `**Correct answer: PUT and DELETE.**

### Why it is correct
Idempotent means that sending a request **multiple times** has the same **intended effect on the server** as sending it once (the response itself may differ). RFC 9110 lists the idempotent methods: GET, HEAD, OPTIONS, TRACE (because they are safe) and **PUT, DELETE**.
- PUT replaces the entire state of the resource with the content sent: send it 3 times and the result is still that state.
- DELETE: the first call deletes, later calls leave the resource in the "deleted" state (the status code may differ, e.g. 404, but the effect does not change).

### Why the other options are wrong
- **POST**: not idempotent; each call can create a new resource (duplicate orders). Safe retries require an Idempotency-Key.
- **PATCH**: not guaranteed to be idempotent (RFC 5789). A patch like "increment the counter by 1" or a JSON Patch "add" to an array produces a different result each time. Some specific patches may happen to be idempotent, but the method makes no such guarantee.

> Senior tip: idempotency determines **who may retry automatically**. HTTP clients, service meshes and load balancers usually retry only idempotent methods. If your PUT has a non-idempotent side effect (sending an email on every call), you are breaking a contract the infrastructure relies on.`
  },
  "qz-api-011": {
    "q": `A public API allows 100 requests per minute per API key. A client exceeds the limit. Which response is the most standards-compliant and most useful to the client?`,
    "options": [
      `403 Forbidden with the message "quota exceeded"`,
      `503 Service Unavailable so the client knows the server is overloaded`,
      `429 Too Many Requests with a Retry-After header telling it when to try again`,
      `400 Bad Request because the client sent too many`
    ],
    "explain": `**Correct answer: 429 Too Many Requests with Retry-After.**

### Why it is correct
429 (RFC 6585) is defined exactly for "the client sent too many requests in a given amount of time". The {{Retry-After}} header (RFC 9110, either seconds or an HTTP-date) tells the client when to retry, letting it back off sensibly instead of hammering the server.
~~~text
HTTP/1.1 429 Too Many Requests
Retry-After: 30
RateLimit-Policy / RateLimit: (IETF draft, many APIs use X-RateLimit-Remaining)
~~~

### Why the other options are wrong
- **403**: means "no permission"; retrying is pointless. The client never learns that waiting would fix it.
- **503**: signals a **server-side** failure, triggers alerts, and blames the wrong party: the server is healthy, this one client just exceeded its quota. (503 + Retry-After makes sense when the server itself is overloaded or under maintenance.)
- **400**: the request is perfectly valid in syntax and content.

> Senior tip: return the remaining request count even when the client is not blocked yet, so it can self-throttle. On the client side, combine Retry-After with exponential backoff + jitter; otherwise thousands of clients retrying at exactly second 30 create a brand-new spike.`
  },
  "qz-api-012": {
    "q": `The feed {{GET /notifications?page=3&size=20}} is sorted newest first. While the user scrolls, new notifications keep being inserted at the top of the list. The user sees notifications repeated across pages. Which design fixes this at the root?`,
    "options": [
      `Increase size to 100 to reduce the number of calls`,
      `Cache the whole list on the client up front`,
      `Start pages at 0 instead of 1`,
      `Cursor (keyset) pagination: the response returns a nextCursor encoding the position of the last item (created_at, id); the next page fetches the items "older" than that cursor`
    ],
    "explain": `**Correct answer: cursor (keyset) pagination.**

### Why it is correct
Offset pagination defines a page by **position**: page 3 is items 41–60. When 5 new notifications are inserted at the top, every item shifts down by 5 positions, so the last 5 items of page 2 reappear at the top of page 3 (and conversely, when items are deleted some are **skipped**). A cursor defines a page by **value**: "items older than (created_at, id) of the last item seen", unaffected by inserts in front of it.
~~~text
GET /notifications?limit=20
-> { items: [...], nextCursor: "eyJ0IjoiMjAyNi0xMC0yOVQwODo..." }
GET /notifications?limit=20&cursor=eyJ0IjoiMjAyNi0xMC0yOVQwODo...
~~~
Include the id in the cursor to break ties when several items share the same created_at.

### Why the other options are wrong
- **Bigger size**: only reduces the frequency; it does not stop positions from shifting.
- **Cache everything on the client**: not feasible for a long feed and misses new data.
- **Pages starting at 0**: only changes the numbering; the problem remains.

> Senior tip: the cursor should be **opaque** (base64 of JSON, optionally HMAC-signed) so you can change the sort later without breaking clients. The trade-off: you cannot jump to "page 57", but with a feed/infinite scroll nobody needs that. In the DB, a cursor maps to the condition {{(created_at, id) < (?, ?)}} on a composite index.`
  },
  "qz-api-013": {
    "q": `The {{/v1/orders}} API is used by many older mobile app versions. Which changes are **breaking** and need a new version or a transition period? (Choose 2)`,
    "options": [
      `Rename the response field totalPrice to total`,
      `Add a new discount field (nullable) to the response`,
      `Make the optional query param "currency" required`,
      `Add a new endpoint GET /v1/orders/{id}/invoice`,
      `Add an optional query param "status" for filtering`
    ],
    "explain": `**Correct answer: renaming a response field; making an optional parameter required.**

### Why it is correct
A breaking change is one that makes a **currently correct client** incorrect:
- **Renaming a response field**: the old app still reads {{totalPrice}}, no longer finds it, and shows blank or crashes.
- **Optional → required**: the old app does not send {{currency}} and now gets a 400.

An easy rule to remember (Postel): **requests may only be loosened, responses may only be extended**.

### Why the other options are wrong
- **Adding a response field**: clients that follow the "tolerant reader" principle ignore unknown fields. (Make sure your client does not deserialize strictly, e.g. Jackson {{FAIL_ON_UNKNOWN_PROPERTIES}}; Spring Boot disables that flag by default.)
- **Adding a new endpoint**: no impact on existing endpoints.
- **Adding an optional param**: clients that do not send it keep the previous behaviour.

### How to rename safely (expand/contract)
1. Return **both** the totalPrice and total fields.
2. Mark totalPrice deprecated (docs, {{Deprecation}}/{{Sunset}} headers).
3. Track how many clients still use it, and only remove it in v2.

> Senior tip: with mobile apps, old versions can live for years. Run **contract tests** (Spring Cloud Contract, Pact) in CI to catch breaking changes before merge instead of waiting for crash reports.`
  },
  "qz-api-014": {
    "q": `{{POST /orders}} creates an order successfully and the server generates id {{981}}. Which response best matches HTTP semantics?`,
    "options": [
      `201 Created, Location: /orders/981, with a body containing the representation of the created order (optional)`,
      `200 OK with body {"success": true}`,
      `202 Accepted with Location: /orders/981`,
      `204 No Content with the id in an X-Order-Id header`
    ],
    "explain": `**Correct answer: 201 Created with Location.**

### Why it is correct
RFC 9110: 201 means the request was completed and **one or more new resources were created**; the primary resource is identified by the {{Location}} header (or the request URI when there is no Location). The client (and gateways, generated SDKs) immediately knows the address of the new resource to GET later. Including a body with the created order saves the client an extra call.
~~~java
URI uri = ServletUriComponentsBuilder.fromCurrentRequest()
        .path("/{id}").buildAndExpand(order.getId()).toUri();
return ResponseEntity.created(uri).body(OrderDto.from(order));
~~~

### Why the other options are wrong
- **200 + success: true**: the client still works, but loses the "was newly created" information and the resource location; the success field just repeats what the status code already says.
- **202 Accepted**: for work that is **not** finished yet (asynchronous); here the order is fully created.
- **204 + custom header**: 204 means no content; using a bespoke header to carry the id reinvents what Location already standardises.

> Senior tip: if the order is created but the follow-up processing (payment, inventory) runs asynchronously, still return 201 for the "order" resource with {{status: PENDING}}, and let the client track the status. Do not confuse "resource created" with "business process finished".`
  },
  "qz-api-015": {
    "q": `The endpoint {{GET /me/profile}} returns personal data. You want: the browser may keep a copy but **must ask the server again on every use** (and may get a 304 if nothing changed), and shared CDNs/proxies must not store it. Which header is the most appropriate?`,
    "options": [
      `Cache-Control: no-store`,
      `Cache-Control: private, no-cache (with ETag)`,
      `Cache-Control: public, max-age=0`,
      `Pragma: no-cache`
    ],
    "explain": `**Correct answer: Cache-Control: private, no-cache with ETag.**

### Why it is correct
- {{no-cache}} does **not** mean "do not cache". It allows storing but forces **revalidation** with the server before every use. Combined with an ETag, the client sends {{If-None-Match}} and the server replies 304 (no body) if nothing changed, saving bandwidth while staying fresh.
- {{private}}: only the user's private cache (the browser) may store it; shared caches (CDN, proxy) must not, which prevents one user's data from leaking to another.

### Why the other options are wrong
- **no-store**: forbids storing anywhere, so every request downloads the full body and you cannot benefit from 304. Suitable for extremely sensitive data (card numbers), but not what is asked here.
- **public, max-age=0**: {{public}} lets the CDN store personal data, violating the requirement and risking a leak.
- **Pragma: no-cache**: an HTTP/1.0 header that only has meaning in requests and is marked deprecated by RFC 9111; it cannot replace Cache-Control.

> Senior tip: the classic incident is a CDN caching a personal response by mistake (missing private, or path-based cache rules) and serving user A's page to user B. For endpoints with Authorization, set Cache-Control explicitly instead of trusting CDN defaults. Spring Security adds {{Cache-Control: no-cache, no-store, max-age=0, must-revalidate}} to responses by default, so enabling 304s requires configuring it back yourself.`
  },
  "qz-api-016": {
    "q": `The endpoint {{POST /api/v1/payments}} moves permanently to {{/api/v2/payments}}. You want old clients to be redirected automatically while **keeping the POST method and body**. Which code do you use?`,
    "options": [
      `301 Moved Permanently`,
      `302 Found`,
      `308 Permanent Redirect`,
      `303 See Other`
    ],
    "explain": `**Correct answer: 308 Permanent Redirect.**

### Why it is correct
308 (RFC 9110) is a permanent redirect that **forbids** the client from changing the method: a POST stays a POST and the body is resent. Its counterpart for temporary redirects is 307.

| Code | Permanent? | Keeps method? |
|---|---|---|
| 301 | yes | not guaranteed (POST often becomes GET) |
| 302 | no | not guaranteed |
| 303 | no | always becomes GET |
| 307 | no | yes |
| 308 | yes | yes |

### Why the other options are wrong
- **301**: for historical reasons browsers and many clients turn POST into GET when following a 301, so the payment body is lost. RFC 9110 permits that behaviour.
- **302**: temporary, and it has the same POST→GET problem as 301.
- **303**: designed to **deliberately** switch to GET (the Post/Redirect/Get pattern), the exact opposite of what you need.

> Senior tip: with payment APIs, do not rely on redirects: many HTTP clients do not follow redirects for POST (for safety), and some drop the Authorization header when they do. A redirect is only a safety net; announce the deprecation, use the {{Sunset}} header, and monitor traffic to the old endpoint.`
  },
  "qz-api-017": {
    "q": `The team agrees to return errors per RFC 9457 (Problem Details for HTTP APIs). Which statement is correct?`,
    "options": [
      `The fields type, title, status, detail, instance are all required`,
      `No fields other than the 5 standard ones may be added`,
      `Content-Type must be application/json like every other response`,
      `type is a URI identifying the kind of error (defaults to "about:blank") and is what clients should branch on; extension members such as errors, balance are allowed; the Content-Type is application/problem+json`
    ],
    "explain": `**Correct answer: type is the primary identifier (default about:blank), extensions are allowed, and the media type is application/problem+json.**

### Why it is correct
RFC 9457 (which replaces RFC 7807):
- {{type}}: a URI identifying the **kind** of error; clients should branch on type, not parse {{title}}/{{detail}} (those are meant for humans and may be localised). Without a type it is treated as {{"about:blank"}}.
- Every field is **optional**; extension members are allowed to carry extra machine-readable data.
~~~json
{
  "type": "https://api.shop.vn/problems/insufficient-funds",
  "title": "Insufficient funds",
  "status": 422,
  "detail": "Balance 30,000 is less than the amount 50,000",
  "instance": "/payments/abc123",
  "balance": 30000
}
~~~

### Why the other options are wrong
- **All 5 fields required**: wrong, they are all optional.
- **No extra fields**: wrong, extension members are an official feature; clients must ignore extensions they do not understand.
- **application/json**: the RFC registers its own media type {{application/problem+json}} (and {{application/problem+xml}}).

> Senior tip: Spring 6 has {{ProblemDetail}} and {{ErrorResponse}}; set {{spring.mvc.problemdetails.enabled=true}} so Spring MVC's default errors use this format too. Never put stack traces or SQL into {{detail}}; log them with a trace id and return the trace id to the client.`
  },
  "qz-api-018": {
    "q": `You are designing communication between two internal services (both Java): about 20,000 calls/second, low latency required, a strongly typed contract, and one flow where the server keeps pushing price updates. The public API for partners and the web frontend stays REST. Which choice makes the most sense for the internal part?`,
    "options": [
      `gRPC over HTTP/2 with Protocol Buffers: compact binary, code generated from .proto files, server streaming support`,
      `SOAP because WSDL defines a strict contract`,
      `REST/JSON over HTTP/1.1 with one-second polling for the price stream`,
      `GraphQL because clients can select the fields they need`
    ],
    "explain": `**Correct answer: gRPC (HTTP/2 + Protobuf).**

### Why it is correct
- **Performance**: Protobuf is binary — smaller and faster to parse than JSON; HTTP/2 multiplexes many calls over a single connection, cutting connection overhead at 20,000 rps.
- **Strong contract**: the {{.proto}} file is the single source of truth and generates stubs for both client and server; the evolution rules are explicit (never reuse a field number).
- **Streaming**: gRPC supports server streaming, client streaming and bidirectional streaming, so the price push is a built-in feature.

### Why the other options are wrong
- **SOAP**: strict contract, but XML is heavy and slow, the ecosystem is dated, and it has no natural streaming.
- **REST + polling**: one-second polling is both late and wasteful, and JSON/HTTP 1.1 is more expensive at high throughput. REST remains a good choice for the public API.
- **GraphQL**: great when many clients need different shapes of data (a BFF for the frontend), but it adds parse/resolve cost and does not target high-throughput internal RPC.

> Senior tip: gRPC has an operational price: L4 load balancers cannot balance it well because HTTP/2 connections are long-lived (you need L7 such as Envoy, or client-side LB), curl debugging is awkward (use grpcurl), and browsers cannot call it directly (you need gRPC-Web). Always set a deadline on every call.`
  },
  "qz-api-019": {
    "q": `You provide a webhook that sends payment events to a partner's server. The partner must verify that the request really came from you, that it was not modified, and that it is not replayed by an attacker. Which design is correct?`,
    "options": [
      `HTTPS alone satisfies all three requirements`,
      `Sign timestamp + raw body with HMAC-SHA256 using a per-partner secret and send the signature in a header; the receiver recomputes it, compares in constant time, and rejects the request if the timestamp deviates by more than a few minutes`,
      `Whitelist your source IPs on the partner side`,
      `Put a fixed API key in the webhook URL's query string`
    ],
    "explain": `**Correct answer: an HMAC signature over timestamp + raw body, constant-time comparison, timestamp check.**

### Why it is correct
- **Authenticity and integrity**: only you and the partner know the secret; changing a single byte of the body invalidates the signature.
- **Replay protection**: the timestamp is inside the signed payload, so the receiver rejects anything outside a window (e.g. 5 minutes), combined with storing processed event ids to stop duplicates within that window.
- **Computed over the raw body**: parsing JSON and re-serialising it can change key order or whitespace and break the signature.
~~~java
Mac mac = Mac.getInstance("HmacSHA256");
mac.init(new SecretKeySpec(secret, "HmacSHA256"));
byte[] expected = mac.doFinal((timestamp + "." + rawBody).getBytes(UTF_8));
boolean ok = MessageDigest.isEqual(expected, HexFormat.of().parseHex(sigHeader)); // constant-time
~~~

### Why the other options are wrong
- **HTTPS only**: encrypts the transport, but anyone who knows the webhook URL can send a fake request, and it does nothing against replay.
- **IP whitelisting**: useful as an extra layer, but cloud IPs change, may be shared, and it protects neither integrity nor replay.
- **API key in the query string**: leaks into proxy/server logs, does not protect the body, and does not stop replay.

> Senior tip: support **multiple secrets at once** so you can rotate without downtime, signing and sending the secret's id along with the request. The sender needs retries with backoff and an event id so the receiver can process idempotently, because webhooks are at-least-once by nature.`
  },
  "qz-api-020": {
    "q": `The system uses self-contained (stateless) JWT access tokens with a 24-hour TTL. An employee quits; the admin disables the account, but that person can keep calling the API for many more hours. What is the most sensible redesign?`,
    "options": [
      `Switch the signing algorithm from HS256 to RS256`,
      `Delete the token from that person's browser localStorage from the server side`,
      `Short-lived access tokens (5–15 minutes) + server-side refresh tokens that can be revoked (rotation); for sensitive operations, also check a revocation list (denylist by jti/user)`,
      `Encrypt the JWT payload with JWE`
    ],
    "explain": `**Correct answer: short-lived access tokens + revocable refresh tokens, plus a denylist for sensitive operations.**

### Why it is correct
A self-contained JWT is verified by the server using only the signature and {{exp}}, **without asking the DB**; that is both the advantage (scale) and the drawback: there is no way to "revoke" a token that has already been issued. The common balance:
- Keep access tokens short-lived, so after an account is disabled the "leak window" is at most a few minutes.
- Keep the refresh token server-side (or stateful) and revoke it immediately when the account is disabled; rotation (every refresh issues a new token and detects reuse of an old one) protects against theft.
- For sensitive actions (transfers, permission changes), also check a denylist in Redis keyed by {{jti}}, or "reject any token issued to this user before time X".

### Why the other options are wrong
- **HS256 → RS256**: only changes how signing/verification works (symmetric vs asymmetric keys); it does not solve revocation.
- **Deleting localStorage from the server**: the server cannot control the client's storage; whoever holds the token may already have copied it.
- **JWE**: encrypts the contents to hide the claims; the token is still valid until it expires.

> Senior tip: this is the "statelessness has a price" question. A good answer states the trade-off: a denylist adds a lookup to every request, so apply it only to sensitive endpoints — or use opaque tokens + introspection (with a short cache) when instant revocation is mandatory.`
  },
  "qz-api-021": {
    "q": `The endpoint {{POST /orders}} only accepts JSON. A client sends an XML body with the header {{Content-Type: application/xml}}. According to RFC 9110, which code should the server return?`,
    "options": [
      `406 Not Acceptable`,
      `400 Bad Request`,
      `501 Not Implemented`,
      `415 Unsupported Media Type`
    ],
    "explain": `**Correct answer: 415 Unsupported Media Type.**

### Why it is correct
415 means the server refuses because **the format of the content the client sent** (Content-Type, or Content-Encoding) is not supported for this resource. RFC 9110 recommends also sending an {{Accept}} header (in the response) to tell the client which formats are accepted, or {{Accept-Encoding}} if encoding is the issue. Spring MVC returns 415 automatically ({{HttpMediaTypeNotSupportedException}}) when no message converter can read that Content-Type for {{@RequestBody}}.

### Why the other options are wrong
- **406 Not Acceptable**: concerns the **response**: the client asks via {{Accept}} for a format the server cannot produce (e.g. Accept: application/xml when the server only has JSON). Easy to confuse with 415.
- **400**: too generic; use the more precise code when one exists.
- **501**: for when the server does not support that **method** for any resource; a server-side failure.

> Senior tip: a memory trick: **415 is about what the client sends (Content-Type), 406 is about what the client wants to receive (Accept)**. Test both in your contract tests, because gateways or WAFs sometimes overwrite error codes, leaving clients with a generic 400 that is hard to debug.`
  },
  "qz-api-022": {
    "q": `You pick a rate limiting algorithm for an API gateway: on average 10 requests/second per client, but still allowing short **bursts** of up to 50 requests (e.g. an app opening a screen and calling many APIs at once). Which algorithm satisfies this most naturally?`,
    "options": [
      `Token bucket: capacity 50 tokens, refilled at 10 tokens/second; each request consumes 1 token, and with no tokens left the gateway returns 429`,
      `Fixed window counter: at most 10 requests in each clock second`,
      `Leaky bucket as a queue draining a steady 10 requests/second`,
      `Limit concurrent connections to at most 10`
    ],
    "explain": `**Correct answer: token bucket.**

### Why it is correct
Token bucket separates two parameters: **refill rate** (long-term average = 10/s) and **capacity** (maximum burst = 50). A client that stays silent for 5 seconds accumulates 50 tokens and can spend them all at once; afterwards it is limited to exactly 10/s. The implementation only stores (token count, last refill time), which is easy to make atomic on Redis with a Lua script. Many gateways (AWS API Gateway, Bucket4j, Envoy local rate limit) use this algorithm.

### Why the other options are wrong
- **Fixed window 10/s**: no 50-request burst allowed; it also has the window-boundary bug: 10 requests at the end of one second plus 10 at the start of the next produce 20 requests in a very short interval.
- **Leaky bucket as a queue**: makes the output **uniform**; bursts get queued and delayed instead of served immediately. Good for protecting a sensitive downstream, not for this requirement.
- **Limiting concurrent connections**: controls concurrency, not rate; fast requests can far exceed 10/s, while slow ones get blocked unfairly.

> Senior tip: in a multi-instance system, a local per-pod rate limit multiplies the global limit by the number of pods; you need a shared store (Redis) or to divide the limit by the instance count. When Redis fails, decide up front whether to fail-open (let traffic through) or fail-closed (block), depending on how critical the API is.`
  }
});
