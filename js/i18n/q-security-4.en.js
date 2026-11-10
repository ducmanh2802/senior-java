/*
 * English translation of js/data/q-security.js — task T383 (re-translated T1205). Format: js/core/i18n.js (content overlay).
 * ids: security-023 security-024
 */
App.i18n.content({
  'security-023': {
    q: 'You are designing login for a banking app with both web and mobile clients. How do you choose between server-side sessions and JWT based on the "revocation window" criterion, and how do you support "log out from all devices"?',
    a: `**Summary:** The right question is not "is JWT or session better" but: **after you issue a revocation decision (lock the account, change the password, log out), how long does the business accept that an old token can still be used?** If only a few seconds are acceptable, you need server-side state (a session store or a lookup on every request). If 5–15 minutes are acceptable, a short-lived access JWT plus a rotating refresh token stored in the DB is enough and is cheaper when you have many services.

### 1. What the "revocation window" is and how to measure it
The revocation window = the time from when the system decides "this token is no longer valid" until the **last request** using that token is blocked.

~~~text
t0: admin locks the account ------------------------------> t1: last request still gets through
           |<-------------- revocation window ------------->|

Server-side session : t1 - t0 ~ 0       (next request checks the store, the session is already deleted)
Plain JWT, TTL 15'  : t1 - t0 <= 15 min (the service verifies offline and asks no one)
JWT + denylist      : t1 - t0 = denylist propagation latency (a few ms if each service checks Redis directly,
                                   a few seconds if each service caches the denylist locally)
~~~
Ask the business for a specific number. For example, a bank often requires: "once a customer reports a lost phone and we lock the account, **within 5 seconds** no transaction can go through". A news-reading site might accept 1 hour.

### 2. Three architectures and their costs

The diagram below illustrates session-cookie login (web):

~~~seq
title: Session cookie login (web)
actors: User | Browser | Web | Redis
User -> Browser: enter username/password
Browser -> Web: POST /login
Web -> Redis: store session (Session ID)
Redis --> Web: OK
Web --> Browser: SESSION cookie (HttpOnly, Secure)
Browser -> Web: request + SESSION cookie
Web -> Redis: validate session
Redis --> Web: session valid
Web --> Browser: data
~~~

**(a) Stateful sessions** (Spring Session + Redis): the browser keeps a {{SESSION}} cookie (HttpOnly, Secure, SameSite), and on every request the service reads the session from Redis.
- Revocation: delete the key in Redis, effective immediately.
- Cost: 1 Redis read per request (usually under 1 ms within the same AZ). 5,000 req/s is 5,000 ops/s, which a single Redis node can handle comfortably. The real risk is **Redis becoming a dependency**: if Redis dies, everyone is logged out or cannot log in, so you need replicas/failover and must not let eviction delete sessions (set {{maxmemory-policy noeviction}} for the session cluster).

**(b) Short-lived JWT + rotating refresh token**: access token 5–10 minutes, verified offline with a public key (tens of microseconds, no network call). The refresh token is a random string whose **hash** is stored in the DB.
- Rotation: on every refresh, the old token is marked as used and a new token is issued in the same {{family_id}}.
- **Reuse detection**: if a refresh token that was **already used** is sent again, it means two parties hold it (one is a thief), so revoke the **entire family**. This is the recommendation in the OAuth 2.0 Security BCP (RFC 9700).
- Revocation window = access token TTL. Cost: only a DB read at refresh time (every few minutes per device), not on every request.

**(c) JWT + {{jti}} denylist in Redis**: narrows the window to near 0, but every request checks Redis again, meaning you have returned to a **stateful** design while still carrying the complexity of JWT (key rotation, token size). Worth it only when you already have JWT infrastructure for many services and only a few APIs need immediate revocation.

| Criterion | Session + Redis | Short JWT + refresh rotation | JWT + denylist |
|---|---|---|---|
| Revocation window | ~0 | = access TTL (5–15') | ~0 to a few seconds |
| Lookup per request | Yes | No | Yes |
| Fit for many microservices | Poor (every service must read the store) | Good | Medium |
| Complexity | Low | Medium | High |

### 3. Log out from all devices
- **Session**: you need to find every session by user. Spring Session provides {{FindByIndexNameSessionRepository.findByPrincipalName(username)}}; with Redis you must use an **indexed** repository (Spring Boot 3: {{spring.session.redis.repository-type=indexed}}); the default type does not have this index. Fetch the list and {{deleteById}} each session.
- **JWT**: revoke all refresh token families of the user ({{UPDATE refresh_token SET revoked = true WHERE user_id = ?}}). In-flight access tokens still live until their TTL expires. If that window is not acceptable, add a {{ver}} claim (the user's token version), bump the version on "log out all", and have sensitive APIs (money transfer) compare it against the version in cache.

~~~java
// Refresh with rotation + reuse detection (abridged)
@Transactional
public Tokens refresh(String presented) {
    RefreshToken rt = repo.findByHash(sha256(presented))       // store only the hash; a DB leak does not leak tokens
        .orElseThrow(InvalidTokenException::new);
    if (rt.isRevoked() || rt.isExpired()) throw new InvalidTokenException();
    if (rt.getUsedAt() != null) {                              // an already-used token was sent again
        repo.revokeFamily(rt.getFamilyId());                   // => likely stolen, lock the whole family
        throw new InvalidTokenException();
    }
    rt.setUsedAt(Instant.now());
    String next = randomToken();                               // 32-byte SecureRandom
    repo.save(RefreshToken.child(rt, sha256(next)));           // same family_id, same user, device
    return new Tokens(jwt.issue(rt.getUserId(), Duration.ofMinutes(10)), next);
}
~~~

### 4. Production pitfalls
- **Concurrent refresh**: a mobile app opens two threads that refresh the same token; the second is treated as "reuse" and the whole family is locked, so the user is logged out for no good reason. Common handling: a grace period of a few seconds that returns the same child token just issued, or have the client serialize refreshes.
- Storing refresh tokens as plaintext in the DB: a backup leak becomes a session leak for everyone.
- Session cookie missing {{HttpOnly}}/{{Secure}}, or not rotating the session id after login (session fixation; Spring Security rotates the id by default, do not disable it).
- Setting the access TTL to 24 hours "to avoid refreshing" and then claiming "we have logout": logout only deletes the token on the client; a stolen token still works for the whole day.

> Senior tip: write the revocation window into the architecture as an NFR with a number ("account lock takes effect <= 5 seconds for money-transfer APIs, <= 10 minutes for read APIs"). Hybrid designs are very common: the web uses a session cookie via a BFF, mobile uses a 10-minute access token plus refresh rotation, and transaction APIs also check the token version. Do not make every API pay for a lookup just because a few APIs need immediate revocation.`,
    follow: [
      'What security hole does a grace period for concurrent refresh open, and how do you limit it?',
      'A Redis session failover loses a few seconds of data: how does that affect users, and do you accept it or redesign?',
      'For an SPA, why is the BFF model (tokens kept on the server, the browser only has a session cookie) now recommended?'
    ]
  },
  'security-024': {
    q: 'Your API uses auto-increment IDs in URLs, for example {{GET /orders/10482}}. A pentest reports BOLA. Does switching to UUID fix it? How do you fix it and prevent it from coming back?',
    a: `**Summary:** Switching to UUID **does not** fix BOLA, because the bug is that the server does not check "does this user have permission on this object?". A UUID only makes **guessing** the ID harder. The right fix has 3 layers: an owner check in the service layer (mandatory), a hard-to-guess ID at the API boundary (reduces enumeration and business-information leakage), and automated tests for the permission matrix so the bug does not return.

### 1. What BOLA is and why sequential IDs make it worse
BOLA (Broken Object Level Authorization) is ranked **#1** in the OWASP API Security Top 10 (API1:2023). It is IDOR applied to APIs: an endpoint takes an ID from the client and returns an object without checking ownership.

~~~text
User A (logged in) calls  GET /orders/10482  -> 200, A's order   (correct)
User A changes the number: GET /orders/10481  -> 200, B's order   (BOLA!)
Script loops 1..10482                          -> downloads all orders
~~~
With sequential IDs, the attacker **does not need to guess**: just subtract 1. Even without BOLA, sequential IDs still leak information: an order created at 9 AM gets id 10482, at 10 AM gets 10982, so you can infer the shop has about 500 orders/hour. Competitors use this to estimate revenue.

### 2. Layer 1 (mandatory): owner check in the service layer
Rule: **every query that fetches an object by ID must include the owner condition**, placed in the service/repository so every call path (REST, GraphQL, message consumer, batch) goes through it.

~~~java
public OrderDto getOrder(String publicId, UserPrincipal me) {
    // The owner condition is RIGHT IN the query: no "fetch first, then if"
    Order o = orderRepo.findByPublicIdAndCustomerId(publicId, me.customerId())
        .orElseThrow(() -> new NotFoundException("ORDER_NOT_FOUND")); // 404, not 403
    return mapper.toDto(o);
}
~~~
- Return **404** instead of 403 when the object does not belong to the user: 403 confirms "this ID exists", which still leaks information.
- Nested objects ({{/orders/:orderId/items/:itemId}}) must check that **the item belongs to the order and the order belongs to the user**, not just the order.
- Do not trust an ID in the body: {{PUT /orders/1}} with body {{customerId: 2}} is also BOLA if the service uses that value.

### 3. Layer 2: an ID translation layer at the API boundary
Keep an internal {{BIGINT}} primary key (fast joins, small index), but expose only a **public id** outside.

| Approach | Mechanism | Pros | Cons |
|---|---|---|---|
| Separate {{public_id}} UUID/ULID column | Generated randomly on insert, with a unique index | Unguessable, does not leak volume | Adds a column + index, must look up by public_id |
| UUID as the primary key | No translation needed | Simple | Random UUIDv4 fragments the B-tree index, larger key (16 bytes vs 8) |
| Hashids/Sqids | Encode the number into a short string with a "salt" | No extra column, short URL | **Not secure encryption**: leak the salt or collect enough samples and it can be reversed; only for obfuscation, not for protection |

This layer is **defense in depth**: it reduces damage when layer 1 is forgotten on a new endpoint, and it blocks inferring business metrics. But UUIDs still leak through logs, emails, and shared links, so never treat "hard to guess" as "authorized".

### 4. Layer 3: automated tests for authorization
BOLA bugs often come back when a new endpoint is added. Write **matrix** tests: for each endpoint with an ID, user A creates an object, user B tries to read/update/delete, expect 404.

~~~java
@ParameterizedTest
@MethodSource("ownedEndpoints") // e.g.: GET/PUT/DELETE /orders/{id}, GET /orders/{id}/invoice
void otherUserCannotAccess(HttpMethod method, String pathTemplate) throws Exception {
    String id = createOrderAs("alice");                       // owner
    mvc.perform(request(method, pathTemplate, id)
            .with(jwt().jwt(j -> j.subject("bob"))))           // different user
       .andExpect(status().isNotFound());
}
~~~
Add an "inventory" test: scan every handler that has a {{@PathVariable}} whose name contains "id" (via {{RequestMappingHandlerMapping}}) and fail if that endpoint is not in the matrix test list. That way, if a dev adds a new API but forgets the tests, CI blocks it.

### 5. Production pitfalls
- Checking authorization only at the API Gateway by route: the gateway does not know who owns object 10481.
- Checking authorization and then running a second query without the owner condition (a race, or a later code change drops the check).
- Export/batch endpoints ({{/orders/export?ids=1,2,3}}) forget to filter by owner for each element.
- Rate limiting does not replace authorization, but it should exist to detect enumeration: one user hitting hundreds of consecutive 404s on {{/orders/*}} is a signal that needs an alert.

> Senior tip: when you get a BOLA report, do not just patch the reported endpoint. I grep the whole repo for {{findById(}}-style methods called from controllers/services that serve end users and replace them with owner-aware variants, then turn on the inventory test in CI. This usually finds a few more endpoints with the same bug that the pentest never reached.`,
    follow: [
      'In a multi-tenant system, how do you ensure every query filters by tenant_id (Hibernate filter, PostgreSQL Row Level Security)?',
      'A customer-support agent needs to view a customer order: how do you design authorization and audit so you do not reopen BOLA?',
      'Why return 404 instead of 403, and when should you return 403?'
    ]
  }
});
