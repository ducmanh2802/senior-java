/*
 * English translation of js/data/lessons-security.js — task T463, re-synced with the Vietnamese source in T503.
 * Format: js/core/i18n.js (content overlay).
 * ids: lesson-security-004 lesson-security-005
 */
App.i18n.content({
  'lesson-security-004': {
    title: 'Server-side sessions: the sid cookie, CSRF tokens, session fixation and anonymous sessions',
    goals: [
      'Explain how a server-side session works (the sid cookie, the session store, TTL) and how Spring Session moves the storage to Redis',
      'Write {{resolve}} for every request yourself: expiry, a disabled tenant, the CSRF token, anonymous sessions — returning 401/403 in the right place and never letting an NPE become a 500',
      'Explain and implement session-fixation protection by rotating the sid after login',
      'Generate the sid and the CSRF token with enough randomness using {{SecureRandom}}, and compare tokens in constant time',
    ],
    body: `**Summary:** A server-side session means the browser keeps only a **random sid** (session id — think of it as a ticket number the server uses to look up your session) in a cookie, while the session data (who is logged in, which permissions, when it expires) lives in the server's store. On every request the server **resolves** the sid into a session and then checks: is it still valid, is the account/tenant disabled, does the CSRF token (a per-session secret that proves the request came from our own page) match, is the user logged in. After a successful login the sid must be **rotated** (to stop session fixation). The exercise has you write a {{SessionStore}} in plain Java so you can see each step.

### How a server-side session works
1. The user opens the page for the first time: the server creates a session, generates a random **sid** (session id), stores {{sid -> session data}} in the store, then sends back {{Set-Cookie: SESSION=<sid>; HttpOnly; Secure; SameSite=Lax}}.
2. On every later request the browser **automatically** sends that cookie back. The server looks the sid up in the store to know "who this is".
3. Sessions expire: an **idle timeout** (30 minutes without activity) and ideally also an **absolute timeout** (at most 8–12 hours since login, even if the user is still active).

Because the sid is the single "key", it must be **unguessable**: generated from {{SecureRandom}} with at least 128 bits of randomness. An sid like {{sid-1}}, {{sid-2}} (incrementing) lets an attacker guess someone else's session — the same way hotel room numbers 101, 102, 103 are easy to try in order.

Important cookie flags:
- {{HttpOnly}}: JavaScript cannot read the cookie → an XSS attack (injected JavaScript running inside the page) has a much harder time stealing the sid.
- {{Secure}}: the cookie is sent over HTTPS only, so it cannot be sniffed on plain HTTP.
- {{SameSite=Lax}}: the browser does not send the cookie on a POST that originates from another site → this blocks most CSRF right in the browser.

### What Spring does for you
- By default {{HttpSession}} lives in Tomcat's RAM (Tomcat is the servlet container that runs the application). With several instances behind a load balancer (the component that spreads incoming requests across instances), a request routed to another instance "loses the session". **Spring Session** ({{spring-session-data-redis}}) solves this **transparently**: a filter ({{SessionRepositoryFilter}}) wraps the request so {{HttpSession}} reads/writes Redis (an in-memory key-value store shared by all instances) instead of local RAM, while your code keeps using {{HttpSession}} exactly as before.
- Spring Security stores the {{SecurityContext}} (the object that holds "who is logged in, with which authorities") in the session through {{HttpSessionSecurityContextRepository}}. A request that is not logged in still gets an {{AnonymousAuthenticationToken}} placed by {{AnonymousAuthenticationFilter}}, so your code does not have to handle null — but code you write yourself (your own filter, your own store) must take care of it.
- **Session fixation**: by default Spring Security calls {{HttpServletRequest.changeSessionId()}} right after a successful login (the {{changeSessionId}} strategy).
- **CSRF**: enabled by default for every state-changing request (POST/PUT/PATCH/DELETE); the token lives in the session ({{HttpSessionCsrfTokenRepository}}), and since Spring Security 6 the token sent to the client is randomly "masked" ({{XorCsrfTokenRequestAttributeHandler}}) to defend against BREACH, an attack that guesses secrets from the compressed size of HTTPS responses. A pure JWT API that does not use cookies does not need CSRF.

The exercise simulates exactly that "store + resolve" part in plain Java, so you can see what the framework checks on your behalf.

### resolve: the order of checks and the status codes
{{resolve(request, nowMs)}} runs for every request, in this order:

| Step | Condition | Result |
|---|---|---|
| 1 | no sid cookie, or the sid is not in the store | 401 |
| 2 | session already expired ({{nowMs >= expiryMs}}) | remove the session, 401 |
| 3 | the tenant (the company/customer that owns the account; one deployment often serves many of them) is disabled | 401 |
| 4 | the CSRF token sent does not match the session's token | 403 |
| 5 | session not logged in ({{securityContext == null}}) | 401 with code {{ANON}} |
| 6 | everything valid | renew the session, return it |

Why separate 401 and 403? **401 Unauthorized** really means "we could not authenticate who you are" (you need to log in again); **403 Forbidden** means "we know who you are but you may not do this". A wrong CSRF token is a 403 (Spring Security also returns 403 for CSRF failures).

The most common mistake is **not checking and simply dereferencing**: for a disabled tenant {{tenantRepo.find(id)}} returns null, calling {{tenant.getPlan()}} throws a {{NullPointerException}}, and the user gets a **500**. 500 is wrong because: this is not a server failure but a valid state; clients and gateways usually **retry** on 5xx; 5xx alerts keep firing and distract the on-call team; and the default error page may leak a stack trace.

### The CSRF token: why a cookie alone is not enough
CSRF (Cross-Site Request Forgery): the victim is logged in to their bank and opens a malicious site {{evil.com}}; that page submits a form POST to {{bank.com/transfer}} by itself. The browser **automatically attaches** bank.com's cookie, so the server sees a valid sid and cannot tell that the user did not start the request. The defence (the synchronizer token pattern): each session has a random **CSRF token**, and the real page embeds it in the form or in the {{X-CSRF-TOKEN}} header. evil.com cannot read the token (it is blocked by the Same-Origin Policy, the browser rule that only lets a page read data from its own origin), so the forged request has no token → 403. The token is a secret, so compare it with {{MessageDigest.isEqual}} (constant time — the comparison takes the same time no matter where the first difference is, so the response time leaks nothing), not {{equals}}.

The exercise simplifies things: it treats every request as state-changing, so it always checks CSRF. In reality GET/HEAD/OPTIONS skip the CSRF check (and for that reason GET must never change data).

### Session fixation: rotate the sid after login
Scenario: the attacker opens the login page and receives sid {{abc}} (an anonymous session). Somehow (a link containing the sid, or a hijacked subdomain that sets the cookie) the attacker forces the victim to use sid {{abc}}. The victim logs in; if the server keeps sid {{abc}} and attaches the login information to it, the attacker — who already knows {{abc}} — now holds the victim's logged-in session.

Defence: right after a successful login, {{afterLogin(oldSid, nowMs)}} creates a **new sid** (and a new CSRF token), copies the data that must survive (tenant, user, attributes) and **removes the old sid**. The sid the attacker knows becomes useless.

### Anonymous sessions: a normal state, not an error
A session is created **before** login (for example to keep a shopping cart, or to hold the CSRF token for the login form), so a null {{securityContext}} is perfectly normal. The code must treat it as "not logged in" → return 401 with code {{ANON}} (usually together with a redirect to the login page); it must not call {{securityContext.getAuthorities()}} and blow up with an NPE.

### TTL, renewal and the injected clock
On creation: {{expiryMs = nowMs + ttlMs}} (TTL = time to live, the number of milliseconds the session may exist). On every successful resolve, **renew** (a sliding idle timeout): {{expiryMs = max(oldExpiryMs, nowMs + ttlMs)}} — taking max so that a clock running backwards neither shortens nor oddly extends the session. {{nowMs}} is passed in instead of reading {{System.currentTimeMillis()}} so tests can reproduce any point in time. Redis does this with the key's TTL ({{EXPIRE}}); Spring Session renews whenever the session is accessed.

### Production traps
- Sessions in each instance's RAM without sticky sessions (a load-balancer setting that always sends one user to the same instance) → users get kicked out at random. Use Spring Session + Redis.
- The sid or the CSRF token generated with {{Random}}, a hand-built {{UUID}} derived from the time, or an incrementing number → guessable. Use {{SecureRandom}} (≥ 128 bits).
- Not rotating the sid after login → session fixation; rotating but not deleting the old sid → the attacker can still use it.
- Logout only clearing the cookie in the browser without deleting the session in the store → anyone who captured the sid keeps using it.
- Only an idle timeout: a hijacked session can live forever if the attacker sends requests regularly; add an absolute timeout.
- Storing large or non-serializable objects in the session → Redis bloats, and deployments break when a new version changes the class.

> Senior tip: when moving from in-memory sessions to Spring Session Redis, measure the session size ({{MEMORY USAGE}} in Redis) and the number of writes per request — by default Spring Session writes the last-access time on every request, so 5,000 requests/second means 5,000 Redis writes/second. And always keep an automated test asserting "the sid after login differs from the sid before login"; fixation bugs tend to come back when someone writes their own login endpoint (an OTP login, say) and forgets to call {{changeSessionId()}}.

### Interview relevance
Interviewers often ask: "what is session fixation, and how does Spring block it?", "what is CSRF, and why does an API that puts JWT in a header not need it?", "what is the difference between 401 and 403?", "with several instances running, where is the session stored?". Once you finish the exercise below — writing a {{SessionStore}} yourself with random sids, a CSRF check and sid rotation after login — you can answer all four questions with your own code.`,
    exercises: [
      {
        title: 'Write SessionStore: resolve, CSRF, sid rotation after login and anonymous sessions',
        prompt: `Complete {{SessionStore}} — an in-memory session store that mimics how Spring Session/Spring Security handle sessions, using only JDK 17. The classes {{Session}}, {{Status}}, {{ResolveResult}} and {{Request}} are given ({{Session}} is immutable: to change it, create a new object and {{put}} it back into the map).

- {{SessionStore(ttlMs)}}: throw {{IllegalArgumentException}} when {{ttlMs < 1}}.
- {{create(tenantId, userId, nowMs)}}: create a new session with a **random** sid and csrfToken: each one is 32 bytes from {{SecureRandom}}, Base64URL-encoded without padding (43 characters). {{securityContext = null}}, {{expiryMs = nowMs + ttlMs}}; store it in the map and return {{Optional.of(session)}}.
- {{get(sid, nowMs)}}: return the session if it exists and has not expired; if it has expired, remove it from the map and return {{Optional.empty()}}. A session is **expired when {{nowMs >= expiryMs}}**.
- {{renew(sid, nowMs)}}: if the session is still valid, set {{expiryMs = max(oldExpiryMs, nowMs + ttlMs)}} and return the new session; if it is missing or expired, return {{Optional.empty()}}.
- {{resolve(request, nowMs)}} checks in exactly the order given in the lesson:
  1. request null, sid null or not in the store → {{Status(401)}};
  2. expired → remove the session, {{Status(401)}};
  3. tenant disabled ({{disableTenant}}) → {{Status(401)}};
  4. CSRF token null or different from the session's token (compare with {{MessageDigest.isEqual}}) → {{Status(403)}};
  5. {{securityContext == null}} → {{Status(401)}} with {{code = "ANON"}};
  6. valid → renew as in {{renew}} and return {{ResolveResult(Optional.of(renewed session), null, null)}}.
  Every failure returns {{session = Optional.empty()}}; never throw an exception.
- {{afterLogin(oldSid, nowMs)}}: if oldSid does not exist return {{Optional.empty()}}; otherwise create a session with a **new sid and a new csrfToken**, keep tenant/user/securityContext, copy the attributes into a new {{HashMap}}, set {{expiryMs = nowMs + ttlMs}}, and delete the old sid.
- {{setSecurityContext(sid, ctx)}}: attach the context to the session (after authentication); if the sid does not exist, do nothing.
- {{putAttribute(sid, key, value)}} / {{hasAttributes(sid, key)}}: write and check session attributes; {{hasAttributes}} is read-only, calling it any number of times does not change state.
- {{disableTenant(tenantId)}} / {{isTenantDisabled(tenantId)}}: disable a tenant and check it.

The exercise treats every request as state-changing, so {{resolve}} always checks CSRF. The clock is supplied by the test, never real time.`,
        hints: [
          'Generating the sid/token: {{byte[] b = new byte[32]; random.nextBytes(b);}} then {{Base64.getUrlEncoder().withoutPadding().encodeToString(b)}}. Do not use incrementing numbers — an attacker could guess someone else\'s session.',
          'Write {{get}} first (check expiry with {{nowMs >= expiryMs}} and remove), then let {{renew}} and {{resolve}} call {{get}} again; a single place defining "expired" means no boundary drift.',
          '{{resolve}}: check the tenant **before** you use it; compare CSRF with {{MessageDigest.isEqual}} on {{getBytes(StandardCharsets.UTF_8)}} of both strings, and remember to reject {{null}} first.',
          '{{afterLogin}}: {{sessions.remove(oldSid)}} returns the old session (or null) — you get the data and delete the old sid in one step; the new session needs both a new sid and a new csrfToken.',
          'Renew with {{Math.max(s.expiryMs, nowMs + ttlMs)}} so a clock running backwards cannot shorten the session.',
        ],
        explain: `The key points:
- **Unguessable sid**: 32 bytes of {{SecureRandom}} = 256 bits; an attacker cannot brute-force it. An sid like {{sid-1}}, {{sid-2}} only takes a few guesses to take over someone else's session. Tomcat and Spring Session both generate sids from {{SecureRandom}}.
- **Order of checks**: expiry → tenant → CSRF → login. Every failure branch returns 401/403 deliberately, never letting an exception escape as a 500.
- **Constant-time CSRF comparison**: the token is a secret, so use {{MessageDigest.isEqual}}; {{equals}} exits early at the first differing character, so the response time can hint at how much of the token an attacker guessed.
- **Session fixation**: {{afterLogin}} deletes the old sid and issues a new sid plus CSRF token. If you only create a new sid but forget to delete the old one, the attacker can still use it — the test "the old sid must stop working" catches exactly this bug.
- **A single definition of expiry**: use {{get}} as the only gate; if {{get}} uses {{>}} while {{resolve}} uses {{>=}}, the two functions disagree exactly at the expiry boundary.

Common mistakes: using incrementing numbers, {{Random}}, or {{UUID.randomUUID().toString().substring(0, 8)}} (only 32 bits left) for the sid — all guessable; renewing with {{nowMs + ttlMs}} without the max so a backwards clock shortens the session; forgetting to remove expired sessions from the map so memory keeps growing. In real Spring you do not write this class — but understanding it helps you read the {{sessionManagement()}} and {{csrf()}} configuration correctly and debug when a user "gets logged out out of nowhere".`,
      },
    ],
    check: [
      {
        q: 'The tenant of a user has just been disabled. Which status code should their next request receive, and why should it not become an HTTP 500?',
        options: [
          '500, because it is an abnormal failure that must raise an alert',
          '401 (or 403): this is a valid state that must be rejected deliberately; a 500 means a server failure, triggers retries and false alerts, and may leak a stack trace',
          '404, because Spring Security always returns 404 for a disabled tenant',
          '200 with an empty body so no information leaks',
        ],
        answer: 1,
        explain: `A disabled account/tenant is a business situation known in advance, so it must be rejected deliberately with a 4xx (Spring Security throws {{DisabledException}} when logging in to a disabled account, which results in 401). A 500 is wrong: it says "the server is broken", makes clients/gateways retry, fires false 5xx alerts, and the error page may leak a stack trace. Spring Security has no rule to return 404 here; returning an empty 200 makes clients believe the call succeeded and hides the error.`,
      },
      {
        q: 'How is a session fixation attack blocked?',
        options: [
          'Setting the HttpOnly cookie flag',
          'Issuing a new sid right after a successful login and invalidating the old one',
          'Encrypting the cookie with AES',
          'Increasing the session TTL',
        ],
        answer: 1,
        explain: `In a fixation attack the attacker **knows the sid in advance** (they forced the victim to use that sid) and waits for the victim to log in on it. Rotating the sid after login and invalidating the old one makes the sid the attacker knows useless — Spring Security does this by default with {{changeSessionId()}}. HttpOnly only stops JavaScript from reading the cookie (it defends against XSS stealing the sid); it does nothing against an attacker who already knows the sid; encrypting the cookie does not help because the attacker just replays the encrypted value as-is; and a longer TTL only makes the attack window bigger.`,
      },
      {
        q: 'A request arrives with a valid sid but the session is not logged in ({{securityContext}} is null). How should the code handle it?',
        options: [
          'Call {{securityContext.getAuthorities()}} as usual; if it throws an NPE the framework will return a 500',
          'Skip the check and let the request through',
          'Treat it as a normal anonymous state: return 401 (code ANON, usually with a redirect to the login page) and stop',
          'Create a default context with the ADMIN role to avoid the error',
        ],
        answer: 2,
        explain: `A session is created before login (a shopping cart, the CSRF token of the login form), so a null context is normal and must be handled explicitly: return 401 / redirect to login. Letting the NPE become a 500 is the wrong status and causes false alerts; letting the request through skips authentication (a Broken Access Control flaw); and assigning ADMIN yourself is the most severe privilege escalation possible. Spring Security solves this with {{AnonymousAuthenticationToken}} so code never meets null.`,
      },
    ],
  },
  'lesson-security-005': {
    title: 'Domain- and object-level RBAC: deny-by-default, a separate grant permission, IDOR protection',
    goals: [
      'Design a role × domain × action permission matrix that denies by default, with a dedicated exception for sensitive domains',
      'Explain why the grant and delete permissions must be separated from write (separation of duties, preventing privilege escalation)',
      'Distinguish functional (role) checks from object-level checks (tenant, owner) and block IDOR/BOLA bugs',
      'Write a test that **walks the whole matrix** to catch copy-pasted rules between domains',
    ],
    body: `**Summary:** Broken Access Control ranks **number 1** in the OWASP Top 10 (2021), the list of the most common web-security risks. A correct authorization check has two layers: (1) **may this role perform this action on this kind of resource** (an RBAC matrix, deny-by-default), and (2) **may this person touch this particular record** (same tenant, is the owner) — missing layer 2 is an IDOR bug. The permission to grant permissions must be separated from the permission to modify data so that nobody can escalate themselves. The matrix must be tested **one cell at a time**.

### RBAC: role, action, domain
RBAC (Role-Based Access Control) grants permissions to **roles**, then assigns roles to users — like a company that gives a job title its door keys and then gives the title to people. This lesson uses 4 roles, 4 actions and 3 domains (kinds of resource):

- Roles: {{OWNER}} (organization owner), {{ADMIN}} (administration: user management, cleanup), {{STEWARD}} (data entry/operations), {{USER}} (regular user).
- Actions: {{READ}}, {{WRITE}} (create/modify business data), {{DELETE}}, {{GRANT}} (grant/revoke a role for someone else).
- Domains: {{PROJECT}}, {{VM}}, {{BILLING}}.

The default matrix (applies to PROJECT and VM):

| Role | READ | WRITE | DELETE | GRANT |
|---|---|---|---|---|
| OWNER | ✓ | ✓ | ✓ | ✓ |
| ADMIN | ✓ | ✗ | ✓ | ✓ |
| STEWARD | ✓ | ✓ | ✗ | ✗ |
| USER | ✓ | ✗ | ✗ | ✗ |

**BILLING** is more sensitive, so it has an exception: only OWNER may WRITE (not STEWARD), and USER may not even READ. This is precisely why the matrix must be **role × domain × action**, not just role × action.

### Deny-by-default
Anything that is not explicitly allowed is denied: a null role, an unknown action, a newly added domain that has not been configured — all return false. Writing it the other way round ("block ADMIN writing billing, allow everything else") means every new domain/role is **allowed by default**, and the hole appears without anyone noticing. In Spring Security 6 the configuration should end with {{.anyRequest().denyAll()}} or {{.anyRequest().authenticated()}}, never {{permitAll()}}.

A compact implementation: one {{EnumMap<Role, EnumSet<Action>>}} (an {{EnumMap}} is a map whose keys are enum constants, and an {{EnumSet}} is a compact set of enum constants) for the default matrix plus a few exception lines for BILLING. Table-like data is easier to review than a forest of nested {{if}}s.

### Separating permissions: grant and delete do not come with write
Why may ADMIN not WRITE, and why may STEWARD not GRANT?
- If STEWARD had GRANT, they could grant themselves ADMIN or OWNER → **privilege escalation** (raising your own rights without anybody approving it).
- If one person can modify data, delete the evidence and grant permissions, nobody checks anybody else any more. The **separation of duties** principle in banking/accounting: the person who enters data is not the person who approves/deletes it.
- **Least privilege**: each role has exactly the permissions its job needs.

### Object-level checks: tenant and owner (IDOR)
The matrix only answers "may USER READ a VM" — yes. But may USER A read USER B's VM? The matrix does not know. An endpoint {{GET /vms/1042}} that checks only the role and not the owner lets anyone who changes the id in the URL read another person's VM. This bug is called **IDOR** (Insecure Direct Object Reference); in OWASP API Security it is called **BOLA** (Broken Object Level Authorization) — the most common API flaw.

So the function {{check(principal, resource, action)}} works in this order:
1. Missing information (null) → deny.
2. **Different tenant** → deny, even for OWNER/ADMIN: the OWNER of company A has no rights in company B.
3. The role × domain × action matrix does not allow it → deny.
4. The USER role may only touch resources **of their own** ({{ownerId}} equals {{userId}}).

In Spring: layer 1 is {{@PreAuthorize("hasRole('ADMIN')")}} or {{authorizeHttpRequests}}; layer 2 has to be written additionally, for example {{@PreAuthorize("@vmAuthz.canRead(authentication, #id)")}} calling a bean you write, or filtered right inside the query ({{WHERE tenant_id = :tenant AND owner_id = :user}}). Switching from incrementing ids to UUIDs does **not** fix IDOR — it only makes ids harder to guess.

### Testing the whole matrix to catch copy-paste bugs
The classic bug: write the rules for PROJECT, copy them to BILLING and forget to change one line — for example STEWARD can still WRITE BILLING. Tests like "OWNER can write" on a few cases will not catch it. The reliable way: write the **full expected table** (4 roles × 3 domains × 4 actions = 48 cells) right inside the test, walk all of it and compare cell by cell. Any cell that drifts (because of copy-paste, or a newly added role) turns the test red, and the message points at exactly the wrong cell.

~~~java
for (Role r : Role.values())
    for (Domain d : Domain.values()) {
        String actual = perms(r, d);              // for example "RW" for STEWARD + PROJECT
        assertEquals(EXPECTED.get(r + "/" + d), actual, r + " tren " + d);
    }
~~~

### Production traps
- Checking permissions only in the frontend (hiding the button) while the API does not check → calling the API directly gets through.
- Checking only the role, not tenant/owner → IDOR.
- Writing rules as "block what is wrong" instead of "allow only what is right" → new roles/domains are allowed by default.
- Caching permissions in the session/JWT without refreshing when a role is revoked → revoked users keep the old permissions until the token expires.
- Not writing an audit log on grant/revoke → you cannot trace who granted a permission to whom.

> Senior tip: in a multi-tenant system, put the tenant condition at the **query layer** (a Hibernate filter, Postgres Row-Level Security, or a repository that always takes tenantId) instead of relying on every developer remembering to check in the service. In pentests, IDOR/BOLA bugs almost always sit in the last endpoint added — where the author forgot to call the check function.

### Interview relevance
Interviewers often ask: "how does RBAC differ from ABAC?", "how do you stop user A from viewing user B's orders?", "why must the grant permission be separate?", "how do you test authorization so nothing slips through?". Once you finish the exercise below — writing an {{AccessChecker}} with a deny-by-default matrix, a BILLING exception, and tenant and owner checks — you can answer all four questions with your own code.`,
    exercises: [
      {
        title: 'Write AccessChecker: role × domain × action matrix, tenant isolation and IDOR protection',
        prompt: `Complete {{AccessChecker}} (JDK 17 only). The enums and records are given.

**1. {{allowed(role, domain, action)}}** — the permission matrix, deny-by-default:
- Default matrix (PROJECT, VM): OWNER may READ, WRITE, DELETE, GRANT; ADMIN may READ, DELETE, GRANT; STEWARD may READ, WRITE; USER may only READ.
- BILLING exception: only OWNER may WRITE; USER may do nothing (not even READ). Every other cell follows the default matrix.
- Any null parameter → false.

**2. {{check(principal, resource, action)}}** — the full check for one request:
- principal, resource or action null → false;
- {{principal.tenantId()}} null or different from {{resource.tenantId()}} → false (even for OWNER);
- {{allowed(principal.role(), resource.domain(), action)}} is false → false;
- USER role: true only when {{resource.ownerId()}} equals {{principal.userId()}} (both non-null);
- otherwise → true.`,
        hints: [
          'Use {{EnumMap<Role, EnumSet<Action>>}} for the default matrix; {{EnumSet.allOf(Action.class)}} for OWNER.',
          'Put the BILLING exception **before** looking up the matrix: USER → false; WRITE without being OWNER → false.',
          '{{check}}: null → tenant → {{allowed}} → (if USER) compare {{ownerId}} with {{userId}}. Write {{p.userId().equals(r.ownerId())}} only after {{p.userId()}} null has been rejected.',
        ],
        explain: `Three key ideas:
- **Deny-by-default**: the function returns true only when the permission is explicitly listed. If you write it as "if ADMIN and WRITE then false, otherwise true", then the day someone adds an {{AUDITOR}} role it automatically gets every permission.
- **Two layers of checks**: the matrix answers "may this role perform this action on this kind of resource"; the object layer (tenant, owner) answers "what about **this record**". Dropping layer 2 is IDOR: alice changes the id in the URL and reads bob's VM.
- **Testing the whole matrix**: the first test compares all 48 cells against a hand-written expected table. If you copy the PROJECT rules to BILLING and forget the exception, the {{STEWARD/BILLING}} cell comes out as {{RW}} instead of {{R}} and the test points at that cell.

Common mistakes: checking the tenant **after** returning true for OWNER (the OWNER of company A deletes company B's VM); comparing {{userId == ownerId}} with {{==}} on Strings (that compares references, i.e. memory addresses rather than text, so it is sometimes right and sometimes wrong); and forgetting the null guard so a {{NullPointerException}} becomes a 500. In Spring, the matrix part corresponds to {{@PreAuthorize}}/{{authorizeHttpRequests}}, and the tenant/owner part is usually a bean {{AuthorizationManager}} or a condition inside the query.`,
      },
    ],
    check: [
      {
        q: 'According to the matrix in this lesson, who may WRITE data in the BILLING domain?',
        options: ['OWNER and ADMIN', 'OWNER and STEWARD', 'Only OWNER', 'OWNER, STEWARD and ADMIN'],
        answer: 2,
        explain: `BILLING has an exception: only OWNER may WRITE. STEWARD may WRITE on PROJECT/VM but not on BILLING — so "OWNER and STEWARD" is the answer of someone who copied the default matrix and forgot the exception. ADMIN never has WRITE (administration permissions are separated from data permissions), so both options that include ADMIN are wrong.`,
      },
      {
        q: 'Why may STEWARD (who can modify data) still not GRANT permissions to other people?',
        options: [
          'Because GRANT only applies to the BILLING domain',
          'Because GRANT is a separate administrative permission; if STEWARD could grant, they could grant ADMIN/OWNER to themselves (privilege escalation)',
          'Because STEWARD already has WRITE, so GRANT would be redundant',
          'Because Spring Security forbids a role from having both WRITE and GRANT',
        ],
        answer: 1,
        explain: `The permission to grant permissions is "the key to all keys": whoever has it can raise themselves to any role. Separating GRANT from WRITE applies least privilege and separation of duties. GRANT in this lesson applies to every domain, not just BILLING; WRITE and GRANT are two different capabilities so nothing is "redundant"; and Spring Security has no such restriction — it is your own design decision.`,
      },
      {
        q: 'The endpoint {{GET /vms/1042}} checks "the caller has role USER and USER may READ VM", then returns the VM by id. What is the flaw and how do you fix it?',
        options: [
          'There is no flaw because the role was checked',
          'IDOR/BOLA: you must also verify the VM belongs to the same tenant and to the caller (or filter right inside the query)',
          'Switching from incrementing ids to UUIDs is enough',
          'The endpoint must be changed to POST',
        ],
        answer: 1,
        explain: `A role check only answers "may USER read VMs in general", not "may they read **this VM**". Changing the {{id}} in the URL reads someone else's VM — IDOR, or BOLA in the OWASP API Security Top 10. Fix it with an object-level check (tenant + owner) or a query with an {{owner_id}} condition. UUIDs only make ids harder to guess, but ids still leak through logs, shared links and so on; switching to POST changes nothing about authorization.`,
      },
    ],
  },
});
