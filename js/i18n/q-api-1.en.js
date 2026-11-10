/*
 * English translation of js/data/q-api.js — task T1140 (api-001..004 refreshed). Format: js/core/i18n.js (content overlay).
 * ids: api-001 api-002 api-003 api-004
 */
App.i18n.content({
  'api-001': {
    q: `How do safe methods and idempotent methods differ? Give examples of PUT vs PATCH vs POST in a banking transfer API.`,
    a: `**Summary:** A safe method (e.g. GET, HEAD, OPTIONS) is a method that does not change server state — calling it any number of times produces no side effects. An idempotent method (e.g. GET, PUT, DELETE, HEAD, OPTIONS) is a method where calling it once or N times produces the **same final result on the server**. POST is neither safe nor idempotent; PUT is idempotent because it replaces the entire resource; PATCH is usually not idempotent because it applies a partial delta update. In a banking transfer API, every financial operation must be designed to be idempotent (typically POST + Idempotency-Key) to avoid transferring money twice when the client retries.

### Background: why distinguish safe and idempotent
When you call an API over the network, three things often happen unexpectedly: (1) the request reaches the server but the response is lost on the way back (timeout), (2) the user clicks the button twice, (3) a proxy/gateway retries automatically. If the method is not idempotent, each retry can create a real transaction — for example, transferring money twice. The HTTP spec defines properties of each method so clients, proxies, and caches know how to handle them safely:
- **Safe**: does not change the representation of the resource. GET /accounts/123 only reads, can be cached, prefetched, and safely called by crawlers.
- **Idempotent**: repeated calls produce the same final effect. PUT /accounts/123 {balance: 1000} called 10 times still leaves balance at 1000. DELETE removes the resource; deleting again still yields the result "gone" (204 or 404), so the final effect is the same.

### PUT vs PATCH vs POST — step by step
| Method | Safe? | Idempotent? | Meaning | Banking transfer example |
|---|---|---|---|---|
| GET | Yes | Yes | Read a resource | GET /transfers/tx-789 — view transfer details |
| POST | No | No | Create a new resource or perform an action | POST /transfers {from:A,to:B,amount:500000} — each call creates a new transfer |
| PUT | No | Yes | Replace the **entire** resource (client sends full state) | PUT /transfers/tx-789 {status:"CANCELLED",reason:"USER"} — repeated calls still result in CANCELLED |
| PATCH | No | Usually no | Update **part** of a resource (delta) | PATCH /accounts/A {balanceDelta:-500000} — calling twice deducts twice |
| DELETE | No | Yes | Delete a resource | DELETE /draft-transfers/tx-789 — deleting again still means "gone" |

Note on PATCH: JSON Merge Patch (RFC 7396) replaces values at each field, so it is often idempotent. JSON Patch (RFC 6902) has an {{add}} operation with a path ending in {{/-}} (append to end of array) — calling it twice adds two elements, so it is not idempotent. To be safe, add a {{test}} operation to check a precondition before modifying.

~~~seq
title: Money transfer with POST + Idempotency-Key
actors: Client | API | DB
Client -> API: POST /transfers (Idempotency-Key: k1)
API -> DB: Check if key k1 already exists?
DB --> API: Not found
API -> DB: Store key k1 + create transfer (atomic)
DB --> API: OK
API --> Client: 201 Created (tx-789)
note Client..API: Timeout, client does not receive response
Client -> API: POST /transfers (Idempotency-Key: k1)
API -> DB: Check if key k1 already exists?
DB --> API: Exists, return stored result
API --> Client: 201 Created (tx-789) — no second debit
~~~

### Real-world example
Assume an internal banking payment system: 2,000 QPS at peak, p99 latency 120ms, and about 0.3% of requests time out on the client side (mobile networks). About 1.7 million transfers per day. Previously the transfer API used plain POST with no deduplication. On timeout, the mobile app retried after 2 seconds → around 5,000 transfers/day were duplicated, averaging 800,000 VND per transfer, a potential loss of ~4 billion VND/day that had to be refunded manually.

How it was fixed: (1) The client generates a UUID v4 as the {{Idempotency-Key}} for each transfer action (and keeps the same key when retrying the same action). (2) The server stores {{(key, request_hash, status, response)}} in a DB table with a unique constraint on {{key}} (or Redis SETNX) with a 24h TTL. (3) A repeated request with the same key returns the stored response verbatim and does not invoke business logic. (4) The same key but a different body returns 422 Unprocessable Entity.

Result after 2 weeks: duplicate transfers dropped to 0, refund complaints fell by 98%, p99 latency increased by ~3ms (key lookup), key storage cost ~2GB/day (acceptable).

### Common production pitfalls
- **Using POST for an action without an Idempotency-Key**: the user taps "Pay" twice or the app retries → 2 orders / 2 debits. Always require the client to send a key for every financial POST.
- **Using PATCH with JSON Patch {{add /-}}** for balance add/subtract: it looks idempotent but actually appends/repeats the side effect. For money, use PUT to replace the full state or POST + Idempotency-Key.
- **Idempotency-Key scope too broad or too narrow**: the key should be unique per (user, endpoint, operation), not global; if too narrow (per request attempt), retrying with a new key still creates duplicates.
- **Caching GET incorrectly when the resource changes**: GET is safe so CDNs/proxies cache aggressively; if you forget {{Cache-Control: no-store}} for sensitive data (balance), users see stale data.

### Sample interview answer
"I distinguish the two concepts like this: a safe method such as GET does not change server state, so it can be cached or retried freely. An idempotent method is one where calling it once or many times yields the same final result on the server — PUT, DELETE, GET, HEAD, and OPTIONS are idempotent; POST is not. In a banking transfer API, POST /transfers creates a new transfer so it is not idempotent: if the client times out and retries, money could be transferred twice. The way I handle it is to require the client to send an Idempotency-Key header (a UUID) for each action; the server stores the key together with the request hash and response in the DB with a unique constraint. If a request arrives with an already-processed key, the server returns the stored response verbatim without running business logic again. With PUT, I use it when replacing the full resource state — for example, updating a transfer status to CANCELLED — because repeated calls still result in CANCELLED. I use PATCH carefully: JSON Merge Patch is usually safe, but JSON Patch has array-append operations that are not idempotent. For any financial API, my principle is to design for safe retries, because networks are never reliable."

> Senior tip: For money systems, treat every mutating POST as "dangerous until it has an Idempotency-Key". Store the key + request hash + response in a durable layer (DB with a unique constraint) rather than only Redis, so a crash in the middle does not lose proof of processing; Redis TTL is fine for caching but not as the source of truth for financial transactions.`,
    follow: [
      'How to ensure idempotency for POST /transfers when the client times out and retries?',
      'Why does PUT replace the whole resource instead of merging? What is the trade-off vs PATCH?'
    ]
  },
  'api-002': {
    q: `Choose appropriate HTTP status codes for: successful creation, accepted async processing, validation error, unauthorized vs forbidden, conflict, rate limit, gateway timeout.`,
    a: `**Summary:** 201 Created (successful creation, with Location header), 202 Accepted (async processing), 400 (malformed syntax), 422 (syntax OK but semantic error), 401 (not authenticated), 403 (authenticated but insufficient permission), 409 (state conflict), 429 (rate limit), 502/503/504 (upstream/gateway errors).

### Status code details
| Code | Name | When to use | Important headers |
|----|-----|--------------|-------------------|
| 201 | Created | POST creates a new resource | Location: /resource/{id} |
| 202 | Accepted | Request accepted, processed in background (batch, webhook) | Retry-After, or Link: status endpoint |
| 204 | No Content | Success but no body (DELETE, PUT update) | — |
| 400 | Bad Request | Malformed JSON, missing required field, type mismatch | — |
| 422 | Unprocessable Content (formerly Unprocessable Entity) | Syntax OK but business rule fails (insufficient balance, duplicate email) | Content-Type: application/problem+json (RFC 9457, replacing RFC 7807) |
| 401 | Unauthorized | Missing/invalid token, session expired | WWW-Authenticate: Bearer realm="api" |
| 403 | Forbidden | Valid token but insufficient role/permission | — |
| 404 | Not Found | Resource does not exist (also used to hide 403) | — |
| 409 | Conflict | Version conflict (optimistic lock), duplicate unique key | ETag, Retry-After |
| 429 | Too Many Requests | Exceeded quota, rate limit | Retry-After, X-RateLimit-* |
| 500 | Internal Server Error | Code bug, DB down, unhandled exception | — |
| 502 | Bad Gateway | Proxy received an invalid response from upstream | — |
| 503 | Service Unavailable | Overload, maintenance, circuit breaker open | Retry-After |
| 504 | Gateway Timeout | Upstream did not respond within the timeout | — |

### Common mistakes
- Using 400 for business logic validation → the client cannot distinguish format vs logic errors. Use **422** (RFC 7807 ProblemDetail).
- Using 401 for "insufficient permission" → the client thinks the token expired and keeps refreshing. Clearly distinguish 401 vs 403.
- Returning 500 for downstream timeout → monitoring cannot tell if it is your bug or the partner's. Use 504.

### Real-world example
A wallet payment API returned **200 with {{"success": false}}** for every error. Consequences: (1) the API gateway and client SDK treated every response as success so **retries never happened** on transient errors; (2) the 5xx error-rate dashboard was always 0 even though 3% of transfers failed; (3) partners had to parse the body to detect errors. After standardizing: 201 + {{Location}} header when creating a transfer; 202 + a status link when handing off to async processing with the bank; 400 for malformed JSON; 422 for business rule violations (amount exceeds limit); 401 for missing or invalid token; 403 when the caller is authenticated but lacks permission; 409 for duplicate {{Idempotency-Key}} with different content; 429 with {{Retry-After}}; 503/504 for upstream errors. Error bodies follow **RFC 9457 Problem Details** ({{type}}, {{title}}, {{status}}, {{detail}}, plus a system-specific {{code}}). After the change, the SDK's successful retry rate increased and 5xx alerts caught a DB incident 20 minutes earlier.

### Sample interview answer
"I choose status codes so that machines can understand the outcome without reading the body, because gateways, client SDKs, caches, and monitoring all rely on them. Successful creation is 201 with Location; accepting a request for async processing is 202 with a status-check link; delete or update with no content is 204. Client errors: 400 when the request is syntactically wrong, 422 when syntax is fine but a business rule is violated, 401 when unauthenticated or the token is invalid, 403 when authenticated but not authorized, 404, 409 for state conflicts or duplicate idempotency keys, and 429 with Retry-After when rate-limited. Server errors: 500, 502 and 504 for upstream failures or timeouts, 503 for temporary overload. I use RFC 9457 Problem Details for error bodies, with a stable error code that clients can handle programmatically."

> Senior tip: Spring Boot 3.x has **ProblemDetail** (RFC 7807) built in: {{throw new ErrorResponseException(HttpStatus.UNPROCESSABLE_ENTITY, ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, "Insufficient balance"), null)}}. Enable {{spring.mvc.problemdetails.enabled=true}} so Spring MVC default exceptions also return ProblemDetail. Clients parse {{type}}, {{title}}, {{detail}}, {{instance}} consistently.`,
    follow: [
      'When to return 202 instead of 201? How does the client poll status?',
      'How to design a unified error response for an entire microservice system?'
    ]
  },
  'api-003': {
    q: `Design REST resources for a banking account API: resource naming, nested resources, filter/sort/pagination params, and paginated response (page-based vs cursor-based).`,
    a: `**Summary:** Resources use plural nouns (/accounts, /transactions), nested for tight relationships (/accounts/{id}/transactions), query params for filter/sort/page. Page-based (page, size) is simple but unstable when data changes; cursor-based (after, limit) is stable and suitable for real-time feeds.

### Naming rules
- **Collection**: {{/accounts}}, {{/customers}}, {{/transactions}} (plural, kebab-case)
- **Single**: /accounts/{accountId}
- **Nested**: /accounts/{accountId}/transactions (only when the transaction cannot exist independently). Avoid nesting > 2 levels.
- **Action/Non-CRUD**: Use a sub-resource or a custom endpoint: {{POST /transfers}}, POST /accounts/{id}/freeze

### Standard query parameters
| Type | Param | Example |
|------|-------|---------|
| Filter | {{field=value}}, {{field[op]=value}} | {{status=ACTIVE}}, {{amount[gte]=1000}}, {{createdAt[between]=2024-01-01,2024-12-31}} |
| Sort | {{sort=field,-field}} | {{sort=-createdAt,amount}} |
| Page-based | {{page}}, {{size}} | {{page=0&size=20}} (0-indexed) |
| Cursor-based | {{after}}, {{before}}, {{limit}} | {{after=eyJpZCI6MTIzfQ==&limit=20}} (opaque cursor) |

### Paginated response
~~~json
// Page-based (Spring Data Page)
{
  "content": [...],
  "pageable": {"pageNumber":0,"pageSize":20,"sort":{"sorted":true}},
  "totalElements": 1500,
  "totalPages": 75,
  "first": true,
  "last": false
}

// Cursor-based (GitHub/Stripe style)
{
  "data": [...],
  "pagination": {"next_cursor": "eyJpZCI6MTIzfQ==", "has_more": true}
}
~~~

### Trade-off
| Criteria | Page-based | Cursor-based |
|----------|------------|--------------|
| Implementation | Simple (OFFSET/LIMIT) | Needs index + cursor encoding |
| Stable on insert/delete | No (items shift) | Yes (cursor points to record) |
| Random access | Yes (jump to page) | No (only next/prev) |
| Total count | Available | Requires COUNT(*) query |
| Best for | Admin, dashboard | Feed, mobile infinite scroll |

### Real-world example
A statement API started as {{GET /getTransactionsByAccount?accId=...&page=...}} and returned a **plain array**. Three problems: (1) you cannot add pagination metadata without breaking clients; (2) page-based pagination with continuously inserted transactions caused customers to see **duplicate or missing** transactions while scrolling; (3) deep pages were slow (OFFSET). The redesign:
~~~text
GET /accounts/{accountId}/transactions?from=2026-10-01&to=2026-10-31&type=DEBIT&sort=-bookedAt&limit=50&cursor=eyJ0Ijo...
200 OK
{ "items": [ ... ],
  "nextCursor": "eyJ0IjoiMjAyNi0xMC0xNVQwOToxMjowMFoiLCJpZCI6ODgxMn0",
  "hasMore": true }
~~~
The cursor is base64 of the last row's {{(bookedAt, id)}}, decoded by the server for a keyset query. Authorization check: the {{accountId}} in the path must belong to the authenticated user (prevents IDOR). An admin screen that needs "total count" and page jumps uses a separate page-based endpoint, limited to a time-range filter.

### Sample interview answer
"I name resources as plural nouns and let the HTTP method express the action, for example accounts and accounts/{id}/transactions, nesting only one level when ownership is clear. Filtering, sorting, and pagination go through query parameters with consistent conventions, such as a minus sign in sort for descending and a maximum cap on limit. The response is always an object containing items and pagination info, never a plain array, so it can evolve. For transaction data that is continuously inserted, I use cursor-based pagination: the cursor encodes the sort values and id of the last element, and the server uses it for a keyset query, so there are no duplicates, no gaps, and every page is fast; the trade-off is no random page jumps and no total count. Page-based is only for admin screens that need totals. And I always verify that the resource in the path belongs to the caller to prevent IDOR."

> Senior tip: Banks use **cursor-based for statement/transaction history** (millions of rows, continuous inserts). Page-based for admin user management (need total count, jump to page). Always set {{max page size ≤ 100}} to prevent DoS.`,
    follow: [
      'How to efficiently filter by date range on a 100M-row transaction table?',
      'Opaque vs transparent cursor: security pros and cons?'
    ]
  },
  'api-004': {
    q: `Describe the flow of an HTTP request in Spring MVC: DispatcherServlet, HandlerMapping, HandlerAdapter, HttpMessageConverter, ExceptionResolver. Where are the typical bottlenecks?`,
    a: `**Summary:** Request → DispatcherServlet → HandlerMapping (find controller + interceptors) → HandlerAdapter (resolve args — uses HttpMessageConverter to read the body, invoke the method, write the return value — again via HttpMessageConverter for @ResponseBody) → View (if any) → HandlerExceptionResolver (if error). HttpMessageConverter is invoked **inside** the HandlerAdapter step, not as a separate step afterward. Bottlenecks typically occur at: message converters (large JSON), synchronous DB calls, thread pool exhaustion.

### Detailed flow
~~~text
HTTP Request
    │
    ▼
DispatcherServlet (Front Controller)
    │
    ├──► HandlerMapping (RequestMappingHandlerMapping)
    │      └─ Find @RequestMapping match → HandlerExecutionChain (controller + interceptors)
    │
    ├──► HandlerAdapter (RequestMappingHandlerAdapter)
    │      ├─ Resolve @RequestParam, @PathVariable, @RequestBody, @ModelAttribute
    │      ├─ Invoke Controller method
    │      └─ Handle return value → ModelAndView / ResponseBody
    │
    ├──► HttpMessageConverter (MappingJackson2HttpMessageConverter)
    │      ├─ Request: JSON → Java object (read)
    │      └─ Response: Java object → JSON (write)
    │
    ├──► ViewResolver (if returning a view) / ResponseBodyEmitter (streaming)
    │
    └──► ExceptionResolver (HandlerExceptionResolver)
           └─ @ExceptionHandler, @ControllerAdvice, DefaultHandlerExceptionResolver
~~~

### Key components
| Component | Interface | Main implementation | Role |
|-----------|-----------|---------------------|------|
| HandlerMapping | {{HandlerMapping}} | {{RequestMappingHandlerMapping}} | Map URL → controller method |
| HandlerAdapter | {{HandlerAdapter}} | {{RequestMappingHandlerAdapter}} | Invoke controller, resolve args |
| MessageConverter | {{HttpMessageConverter}} | {{MappingJackson2HttpMessageConverter}} | Serialize/deserialize body |
| ExceptionResolver | {{HandlerExceptionResolver}} | {{ExceptionHandlerExceptionResolver}} | Map exception → response |

### Common bottlenecks & fixes
1. **Large Jackson serialization**: a 10MB+ response blocks the thread. Fix: streaming ({{ResponseBodyEmitter}}, {{SseEmitter}}), pagination, projection (DTO).
2. **Sync DB call in controller**: blocks a Tomcat thread. Fix: reactive (WebFlux), @Async + CompletableFuture, virtual threads (Java 21).
3. **Long HandlerInterceptor chain**: repeated pre-handle work. Fix: consolidate logging and MDC into 1 interceptor; avoid heavy logic.
4. **Many custom ArgumentResolvers**: each request resolves again. Fix: cache resolution, use built-in @ModelAttribute binding.

### Real-world example
A product-list API had p99 800ms even though the DB query took only 40ms. A profiler (async-profiler) showed 60% of time in the **HttpMessageConverter**: Jackson was serializing JPA entities instead of DTOs — touching lazy relations (triggering extra queries), serializing a large HTML description column, and using an {{ObjectMapper}} that was accidentally created per request in a mis-scoped {{@Bean}}. In addition, a {{HandlerInterceptor}} logged the full response body (re-reading and copying a large string). Fix: return a record DTO with only the needed fields, use the singleton ObjectMapper configured by Spring Boot, stop logging bodies (log size and status only), enable gzip compression at the gateway. p99 dropped to 90ms.

### Sample interview answer
"A request enters Tomcat, passes through the filter chain (including Spring Security), and reaches DispatcherServlet. DispatcherServlet asks the HandlerMappings to find the matching handler, usually a controller method by RequestMapping, along with HandlerInterceptors. The HandlerAdapter invokes that method: before invocation, argument resolvers and HttpMessageConverter read the JSON body into objects and run validation; after invocation, the return-value handler and message converter write the result as JSON. If an exception occurs, HandlerExceptionResolvers handle it, including ControllerAdvice. Typical bottlenecks: serializing entities instead of DTOs causing lazy loading and large payloads, heavy logic or body logging in filters/interceptors, Tomcat threads held by slow downstream calls, and expensive validation or mapping. I measure with a profiler or tracing before optimizing."

> Senior tip: Spring Boot 3.2+ on Java 21 enables **virtual threads** ({{spring.threads.virtual.enabled=true}}) — the Tomcat thread is no longer a bottleneck for blocking I/O. But JSON serialization is CPU-bound: virtual threads do not make it faster and still occupy a carrier thread while running, so projection/streaming is still needed for large payloads.`,
    follow: [
      'HandlerInterceptor vs Filter: execution order, when to use which?',
      'How to customize HttpMessageConverter for custom formats (protobuf, CBOR)?'
    ]
  }
});
