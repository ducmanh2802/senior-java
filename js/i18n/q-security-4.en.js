/*
 * English translation of js/data/q-security.js — task T383. Format: js/core/i18n.js (content overlay).
 * ids: security-023 security-024
 */
App.i18n.content({
  'security-023': {
    q: 'You are designing the login for a bank application with web and mobile clients. How do you choose between server-side sessions and JWT based on the \'revocation window\' criterion, and how do you support \'log out from all devices\'?',
    a: `**Summary:** The right question isn't "whether JWT or session is better" but: **after issuing a revocation command (locking an account, changing a password, logging out), how long does the business accept that old tokens remain usable?** If only a few seconds, you need server-side state (session or per-request store lookup). If 5–15 minutes is acceptable, a short-lived access JWT + rotation refresh token stored in the DB is sufficient, and it's cheaper for multiple services.

### 1. What is a "revocation window" and how to measure it
The revocation window = the time from when the system decides "this token is no longer valid" to the moment the **last request** using that token is blocked.

~~~text
t0: admin locks account ------------------------------> t1: last request slips through
          |<-------------- revocation window ---------->|

Session server-side : t1 - t0 ~ 0       (next request checks store, session is gone)
JWT native, TTL 15' : t1 - t0 <= 15 min (service verifies offline, asks no one)
JWT + denylist      : t1 - t0 = denylist propagation latency (few ms if Redis, 
                                 few seconds if each service caches denylist locally)
~~~
Ask the business for a specific number. For example, banking often requires: "once locked, transactions must be blocked within **5 seconds**". A news site might accept 1 hour.

### 2. Three architectures and costs
**(a) Stateful session** (Spring Session + Redis): browser keeps {{SESSION}} cookie (HttpOnly, Secure, SameSite), each request service reads session from Redis.
- Revocation: delete Redis key, immediate effect.
- Cost: 1 Redis read per request (usually < 1 ms in the same AZ). 5,000 req/s is 5,000 ops/s, which one Redis node handles easily. The real risk is **Redis becoming a single point of failure**: if Redis dies, everyone is logged out or cannot login, so replication/failover is needed, and don't let eviction remove sessions (set {{maxmemory-policy noeviction}} for the session cluster).

**(b) Short-lived JWT + rotation refresh token**: access token 5–10 mins, verify offline with public key (dozens of microseconds, no network call). Refresh token is a random string with **hash** stored in DB.
- Rotation: on every refresh, the old token is marked used, issuing a new one with the same {{family_id}}.
- **Reuse detection**: if a refresh token **already used** is sent again, it means two parties have it (one is an attacker), so revoke the **entire family**. This is recommended in OAuth 2.0 Security BCP (RFC 9700).
- Revocation window = access token TTL. Cost: DB read only on refresh (every few minutes/device), not every request.

**(c) JWT + {{jti}} denylist in Redis**: narrows the window to near 0, but each request now checks Redis, meaning you've returned to **stateful** while still bearing the complexity of JWT (key rotation, token size). Only worth it if you already have JWT infra for many services and only some APIs need immediate revocation.

| Criterion | Session + Redis | JWT short + refresh rotation | JWT + denylist |
|---|---|---|---|
| Revocation window | ~0 | = access TTL (5–15') | ~0 to few seconds |
| Lookup per request | Yes | No | Yes |
| Good for microservices | Poor (every service needs to read store) | Good | Medium |
| Complexity | Low | Medium | High |

### 3. Log out from all devices
- **Session**: need to find all sessions by user. Spring Session provides {{FindByIndexNameSessionRepository.findByPrincipalName(username)}}; with Redis, use an **indexed** repository (Spring Boot 3: {{spring.session.redis.repository-type=indexed}}), the default type lacks this index. Get the list then {{deleteById}} each session.
- **JWT**: revoke all refresh token families for the user ({{UPDATE refresh_token SET revoked = true WHERE user_id = ?}}). Outstanding access tokens live until TTL ends. If that window is unacceptable, add a {{ver}} claim (user's token version), increment version when "log out all", and sensitive APIs (transfer) compare against the cached version.

~~~java
// Refresh with rotation + reuse detection (abbreviated)
@Transactional
public Tokens refresh(String presented) {
    RefreshToken rt = repo.findByHash(sha256(presented))       // store hash only, DB exposure != token exposure
        .orElseThrow(InvalidTokenException::new);
    if (rt.isRevoked() || rt.isExpired()) throw new InvalidTokenException();
    if (rt.getUsedAt() != null) {                              // token used and sent again
        repo.revokeFamily(rt.getFamilyId());                   // => likely stolen, lock entire family
        throw new InvalidTokenException();
    }
    rt.setUsedAt(Instant.now());
    String next = randomToken();                               // 32 byte SecureRandom
    repo.save(RefreshToken.child(rt, sha256(next)));           // same family_id, same user, device
    return new Tokens(jwt.issue(rt.getUserId(), Duration.ofMinutes(10)), next);
}
~~~

### 4. Production pitfalls
- **Concurrent refresh**: mobile app opens two threads refreshing the same token, the second one is treated as "reuse" and the entire family is locked, logging out the user unnecessarily. Common handling: grace period of a few seconds returning the same child token issued, or client-side refresh serialization.
- Storing refresh tokens as plaintext in DB: backup exposure = session exposure for everyone.
- Session cookie missing {{HttpOnly}}/{{Secure}}, or not changing session id after login (session fixation; Spring Security fixes this by default, don't disable it).
- Setting access TTL to 24 hours "to save refreshing" then claiming "we have logout": logout only deletes the token on the client, stolen tokens still work for the whole day.

> Senior tip: explicitly record the revocation window in architecture docs as an NFR with a number ("revocation takes ≤ 5 seconds for money transfer APIs, ≤ 10 minutes for read-only APIs"). Hybrid designs are very common: web uses session cookies via BFF, mobile uses 10-minute access + refresh rotation, and sensitive transaction APIs check an additional token version. Don't make all APIs pay the lookup cost just because a few need immediate revocation.`,
    follow: [
      'What security vulnerability does grace period for concurrent refresh open up, and how to limit it?',
      'Redis session failover causes data loss for a few seconds: how does it affect users, do you accept it or redesign?',
      'For SPA, why is the BFF model (tokens stored on server, browser has session cookie) currently recommended?'
    ]
  },
  'security-024': {
    q: 'Your API uses sequential IDs on URLs, e.g., {{GET /orders/10482}}. Pentest reports BOLA. Does switching to UUID solve it? How do you fix it and prevent recurrence?',
    a: `**Summary:** Switching to UUID **does not** solve BOLA, because the error lies in the server not checking "does this user have permission for this object?". UUID only makes **guessing** the ID harder. The correct fix involves 3 layers: ownership check at the service layer (mandatory), public ID at the API boundary (to reduce enumeration and business information exposure), and automated tests for the permission matrix so the bug doesn't return.

### 1. What is BOLA and why are sequential IDs worse?
BOLA (Broken Object Level Authorization) is ranked **#1** in the OWASP API Security Top 10 (API1:2023). It is IDOR applied to APIs: an endpoint receives an ID from the client and returns an object without checking ownership.

~~~text
User A (logged in) calls GET /orders/10482  -> 200, A's order   (correct)
User A changes number:      GET /orders/10481  -> 200, B's order   (BOLA!)
Script loops 1..10482                         -> downloads all orders
~~~
With sequential IDs, the attacker **doesn't need to guess**: just subtract 1. Even without BOLA, sequential IDs still leak information: orders created at 9 AM have id 10482, at 10 AM have 10982, implying the shop has ~500 orders/hour. Competitors use this to estimate revenue.

### 2. Layer 1 (mandatory): ownership check at the service layer
Rule: **every query fetching an object by ID must be accompanied by owner criteria**, placed in service/repository so all calling paths (REST, GraphQL, message consumer, batch) go through it.

~~~java
public OrderDto getOrder(String publicId, UserPrincipal me) {
    // Ownership criteria is RIGHT IN the query: no "fetch then if" style
    Order o = orderRepo.findByPublicIdAndCustomerId(publicId, me.customerId())
        .orElseThrow(() -> new NotFoundException("ORDER_NOT_FOUND")); // 404, not 403
    return mapper.toDto(o);
}
~~~
- Return **404** instead of 403 when the object doesn't belong to the user: 403 confirms "this ID exists", which is still information leakage.
- Nested objects ({{/orders/:orderId/items/:itemId}}) must check **item belongs to order and order belongs to user**, not just checking the order.
- Do not trust ID in the body: {{PUT /orders/1}} with body {{customerId: 2}} is also BOLA if the service uses that value.

### 3. Layer 2: ID mapping layer at API boundary
Keep {{BIGINT}} primary key internally (fast joins, small index), but only use **public ID** externally.

| Approach | Mechanism | Pros | Cons |
|---|---|---|---|
| Column {{public_id}} UUID/ULID separate | Generated randomly on insert, has unique index | Unguessable, doesn't leak volume | Adds column + index, must fetch by public_id |
| UUID as primary key | No mapping needed | Simple | Random UUIDv4 fragments B-tree index, larger key (16 bytes vs 8) |
| Hashids/Sqids | Encode number to short string using "salt" | No extra column, short URLs | **Not secure encryption**: leaks salt or multiple samples allow reverse engineering; only to obscure, not protect |

This layer is **defense-in-depth**: it reduces damage when Layer 1 is forgotten in a new endpoint, and blocks inferring business metrics. But UUIDs still leak through logs, emails, shared links, so never consider "hard to guess" as "authorized".

### 4. Layer 3: Automated tests for authorization
Write **matrix** tests: for every endpoint with an ID, user A creates an object, user B tries to read/edit/delete, expect 404.

~~~java
@ParameterizedTest
@MethodSource("ownedEndpoints") // e.g.: GET/PUT/DELETE /orders/{id}, GET /orders/{id}/invoice
void otherUserCannotAccess(HttpMethod method, String pathTemplate) throws Exception {
    String id = createOrderAs("alice");                       // owner
    mvc.perform(request(method, pathTemplate, id)
            .with(jwt().jwt(j -> j.subject("bob"))))           // other user
       .andExpect(status().isNotFound());
}
~~~
Add an "inventory" test: scan all handlers with {{@PathVariable}} named "id" (via {{RequestMappingHandlerMapping}}) and fail if that endpoint isn't in the matrix test list. This way, if a dev adds a new API but forgets tests, CI will block them.

### 5. Production pitfalls
- Checking authorization only at the API Gateway by route: gateway doesn't know object 10481 belongs to whom.
- Checking authorization then performing a query without owner criteria (race condition, or code changes later remove the check).
- Export/batch endpoints ({{/orders/export?ids=1,2,3}}) forget to filter owner for each element.
- Rate limit doesn't replace authorization, but should exist to detect enumeration: one user encountering hundreds of 404s consecutively on {{/orders/*}} is a sign needing alert.

> Senior tip: when receiving a BOLA report, don't just fix the reported endpoint. I grep the entire repository for methods like {{findById(}} called from controllers/services serving end users and replace them with owner-aware variants, then enable the inventory test in CI. This approach usually finds several more endpoints with the same bug that the pentest hadn't reached.`,
    follow: [
      'For multi-tenant systems, how do you ensure all queries filter by tenant_id (Hibernate filter, PostgreSQL Row Level Security)?',
      'Customer support staff need to view customer orders: how to design authorization and audit so you don\'t re-open BOLA?',
      'Why return 404 instead of 403, and are there cases where you should return 403?'
    ]
  }
});

