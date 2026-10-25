App.i18n.content({
  'qz-security-001': {
    q: 'An auth service issues JWTs for 15 different microservices (some developed by external teams). Which signing and verification approach is most reasonable?',
    options: [
      'HS256 with a shared secret across all 15 services, as HMAC is faster than asymmetric signatures',
      'RS256 or ES256: the auth service holds the private key, and services fetch the public key via JWKS to verify; even if a service is compromised, it cannot sign tokens itself',
      'No signature needed; just base64url payload since the token is sent over HTTPS',
      'RS256, but the verifier reads the algorithm from the alg field in the token header for flexibility when changing algorithms'
    ],
    explain: `**Correct answer: Asymmetric signatures (RS256/ES256) + JWKS.**

### Why it is correct
- **HS256** is HMAC: the same secret is used to **sign** and **verify**. Anyone who can verify can also sign.
- **RS256** (RSA) / **ES256** (ECDSA): the private key stays only with the auth service; other services only need the **public key** to verify.

With 15 services, if using HS256, any service whose secret is leaked (via logs, env, repo) allows an attacker to **create admin tokens for the entire system**. With RS256, a leaked public key causes no harm.

Public keys are published at a **JWKS** endpoint (e.g., {{/.well-known/jwks.json}}), and each key has a {{kid}}. The token carries the {{kid}} in the header so the verifier picks the correct key → **key rotation** does not require redeploying services. Spring Security: {{spring.security.oauth2.resourceserver.jwt.jwk-set-uri}}.

### Why others are incorrect
- **HS256 with shared secret**: Faster indeed, but RSA/ECDSA verification overhead is in the microsecond range, negligible compared to request processing. The trade-off is a massive security risk. HS256 is only reasonable when the signer and verifier are **the same** system.
- **No signature**: base64url is not encryption; anyone can modify the payload (e.g., change {{role}} to ADMIN). HTTPS only protects the transport layer, it does not prove who issued the token.
- **Trusting the alg header field**: This is the famous **algorithm confusion** vulnerability: an attacker changes alg to {{none}}, or to HS256 and signs it using the RSA public key (which is public) as the HMAC secret. The verifier must **strictly define** the accepted algorithms on the server side.

> Senior tip: configure the resource server with an explicit list of allowed algorithms, cache JWKS, and refresh automatically when encountering an unknown {{kid}} (with rate limiting to prevent spam). When rotating keys, publish the new key to JWKS **before** signing with it, and keep the old key until the last token signed with it has expired.`
  },
  'qz-security-002': {
    q: 'Regarding storing tokens for an SPA (React/Angular), which statement is **correct**?',
    options: [
      'Storing access tokens in localStorage is safe because the same-origin policy prevents scripts from other domains from reading it',
      'HttpOnly cookies are completely immune to XSS so CSP and output encoding can be ignored',
      'HttpOnly; Secure; SameSite cookies prevent JavaScript (including XSS scripts) from reading the token, but CSRF protection is still needed, and XSS can still send requests on the user\'s behalf',
      'Implicit flow (token returned directly in URL fragment) is the recommended way for SPAs as it doesn\'t need a backend'
    ],
    explain: `**Correct answer: HttpOnly cookies prevent token theft but do not protect against everything.**

### Why it is correct
- **HttpOnly**: JavaScript cannot read the cookie via {{document.cookie}} → XSS scripts cannot *steal* the token to use elsewhere.
- **Secure**: Only sent over HTTPS. **SameSite=Lax/Strict**: reduces CSRF risk.
- However, cookies are **automatically attached** by the browser → CSRF protection is still required (SameSite + CSRF token or Origin checks for state-changing requests).
- And if the page has XSS, scripts can still call APIs **right inside the victim\'s browser** (the cookie is automatically attached). HttpOnly reduces damage (tokens aren\'t stolen/exfiltrated, and expire with the session), but doesn\'t eliminate the vulnerability.

The generally recommended architecture: **BFF (Backend for Frontend)** keeps access/refresh tokens on the server, while the browser only has an HttpOnly session cookie.

### Why others are incorrect
- **localStorage is safe**: Same-origin policy blocks *different* domains, but XSS scripts run **within your origin** (via unescaped input, compromised npm packages...) and can read localStorage and exfiltrate the token.
- **HttpOnly is immune to XSS**: As above, XSS can still act on behalf of the user, read displayed data, or simulate forms. CSP and encoding remain the primary defense layers.
- **Implicit flow**: The OAuth 2.0 Security BCP (RFC 9700) recommends **not** using implicit grant because tokens are exposed in the URL (history, logs, Referer) and cannot be sender-constrained. SPAs should use **Authorization Code + PKCE**.

> Senior tip: if you must keep tokens in JavaScript (no BFF), keep the access token **in memory** (JS variable), use a short lifespan of 5–15 minutes, and use refresh tokens with **rotation** and reuse detection. Do not let access tokens live for days in localStorage.`
  },
  'qz-security-003': {
    q: 'You are designing password storage for a new system. Which option is correct according to current recommendations (OWASP Password Storage Cheat Sheet)?',
    options: [
      'SHA-256 with a unique random salt per user',
      'AES-256-GCM encryption with a key stored in KMS so it can be decrypted when user support is needed',
      'MD5 hashed twice with a secret pepper in the configuration',
      'Argon2id (or bcrypt with a sufficiently high cost), unique salt per user, parameters tuned to make each hash slow on purpose'
    ],
    explain: `**Correct answer: Argon2id or bcrypt, unique salt, intentionally slow.**

### Why it is correct
Main threat: DB dump, attacker **brute-forces offline** using GPUs. The password hash function must be:
1. **Slow and resource-intensive, configurable**: Argon2id uses both CPU and **memory** (memory-hard), neutralizing GPU/ASIC advantages. OWASP recommends at least 19 MiB memory, 2 iterations, parallelism 1 for Argon2id; for bcrypt, a work factor of 10 or higher.
2. **Unique salt per user**: two users with the same password have different hashes, rendering rainbow tables useless. Argon2/bcrypt automatically generate salt and store it in the hash string itself.

Spring Security provides {{Argon2PasswordEncoder}}, {{BCryptPasswordEncoder}}, and {{DelegatingPasswordEncoder}} (hash strings have prefixes like {{bcrypt}} in curly braces, supporting gradual upgrades).

### Why others are incorrect
- **SHA-256 + salt**: Salt protects against rainbow tables but SHA-256 is designed to be **fast**: a GPU can compute billions of hashes per second; 8-character passwords are often broken in hours.
- **AES encryption**: Encryption is **two-way**. Key leakage (via app server, misused KMS permissions, insider) means exposing all plaintext passwords. The system never needs to know the plaintext password; "user support" should be handled via a reset flow.
- **MD5 twice + pepper**: MD5 is even faster than SHA-256; repeating it twice does not make it significantly slower. Pepper is a good addition but cannot replace a slow hash function.

> Senior tip: bcrypt only uses the first **72 bytes** of the password (long passphrases get truncated). Measure hashing time on the production machine (target a few hundred ms), and remember that the login endpoint becomes a CPU DoS target: implement rate limiting before calling the hash function. Re-hash on successful login when upgrading algorithms.`
  },
  'qz-security-004': {
    q: 'The session cookie for bank.example is set to {{SameSite=Lax}} (explicitly). Which statement is true regarding CSRF?',
    options: [
      'The cookie is not sent with POST forms from cross-site pages, but is still sent for top-level GET navigations; therefore, endpoints changing data via GET are still vulnerable to CSRF',
      'SameSite=Lax blocks cookies on all cross-site requests so CSRF protection can be disabled entirely',
      'SameSite=None should be used for the tightest control',
      'CSRF primarily threatens APIs authenticated via Authorization: Bearer headers because the browser sends these headers automatically'
    ],
    explain: `**Correct answer: Lax blocks cross-site POSTs but still sends cookies for top-level GET navigations.**

### Why it is correct
CSRF works because the browser **automatically attaches** cookies to requests to bank.example, even if the request originates from evil.example. SameSite controls this:
| Value | Cookie sent in cross-site requests |
|---|---|
| Strict | never |
| Lax | only top-level navigation with safe methods (GET via link, redirect) |
| None (must include Secure) | always |

With Lax: form auto-submit POST from evil.example → **no** cookie → blocked. But if there is an endpoint like {{GET /transfer?to=attacker&amount=1000}}, just tricking the user into clicking a link sends the cookie along. This is why GET must be **safe** (no data changes).

### Why others are incorrect
- **Disable CSRF token**: SameSite checks the **site** (registrable domain), not the origin. A compromised subdomain (e.g., {{blog.bank.example}} with XSS) is same-site and can send requests with cookies. Older browsers may not support SameSite. OWASP considers SameSite a **supplementary** layer, not a replacement for CSRF tokens.
- **SameSite=None**: On the contrary, this is the loosest level: cookies accompany all cross-site requests, only used for actual embedding scenarios (third-party iframes, SSO).
- **Bearer header**: The Authorization header is **not** automatically attached by the browser; JavaScript must add it, and scripts from evil.example cannot read the token. Therefore, pure Bearer APIs are almost immune to CSRF; cookies are the target.

> Senior tip: Chrome applies **Lax by default** for cookies without SameSite, with a "Lax+POST" exception allowing POST top-level in the first 2 minutes after the cookie is set. Do not rely on defaults: always define it explicitly, keep CSRF tokens for applications using session cookies, and check the {{Origin}} header for state-changing requests.`
  },
  'qz-security-005': {
    q: 'Pentest findings: a logged-in user calls {{GET /api/invoices/1043}}, then changes it to 1044, 1045..., and can view invoices belonging to other companies. What is the root cause fix?',
    options: [
      'Change sequential IDs to UUIDs so attackers cannot guess IDs',
      'Enable HTTPS for all endpoints and add rate limiting',
      'Check permissions at the object level for every query: invoice must belong to the current user/tenant (e.g., WHERE id = ? AND tenant_id = ?), otherwise return 404 or 403',
      'Add @PreAuthorize to check if the user has the USER role before entering the method'
    ],
    explain: `**Correct answer: Check permissions at the object level (object-level authorization).**

### Why it is correct
This is **IDOR** (Insecure Direct Object Reference), part of OWASP Top 10 2021 **A01: Broken Access Control** (#1), and **API1: Broken Object Level Authorization** in OWASP API Security Top 10 2023. Essence: the server trusts the ID the client sends without asking "**does this person have permission for *this specific* object?**".

The correct fix is to bind ownership rights right into the query:
~~~java
// tenantId from authenticated token, NOT from request
Invoice inv = invoiceRepo
    .findByIdAndTenantId(id, currentUser.tenantId())
    .orElseThrow(NotFoundException::new);   // 404: do not reveal if the ID exists
~~~
Including the condition in the query (instead of loading then comparing) helps avoid forgetting it in other paths like export, search, or bulk APIs.

### Why others are incorrect
- **UUIDs**: only makes IDs harder to guess (security through obscurity). UUIDs are still exposed via shared URLs, logs, emails, or other API responses; once the ID is exposed, the vulnerability remains. Use as a supplement, not a fix.
- **HTTPS + rate limiting**: HTTPS protects transport; the attacker here is an authorized user on an authorized HTTPS connection. Rate limiting only slows down probing, it does not prevent unauthorized access.
- **@PreAuthorize role USER**: checks **functional** permissions (can you call the endpoint?), not **data** permissions (which invoice can you view?). The attacker already has the USER role.

> Senior tip: with multi-tenant systems, don't rely on every dev remembering to add {{tenant_id}}: use Hibernate {{@TenantId}} (Hibernate 6) or filters, or PostgreSQL Row-Level Security, and write automated tests ensuring "user in tenant A calling ID of tenant B gets a 404" for every path containing an ID.`
  },
  'qz-security-006': {
    q: `Product list API allows clients to select the sort column. Current code is vulnerable to SQL injection. Which fix is correct?
~~~java
String sql = "SELECT id, name, price FROM products ORDER BY " + sort;
return jdbcTemplate.query(sql, rowMapper);
~~~`,
    options: [
      'Use PreparedStatement with ORDER BY ? then setString(1, sort)',
      'Escape single quotes in the sort parameter before concatenating',
      'Block keywords like SELECT, UNION, -- using WAF or regex',
      'Map client-provided values to a hardcoded whitelist (e.g., price maps to p.price, direction only ASC or DESC), reject other values with 400'
    ],
    explain: `**Correct answer: Map client-provided values to a whitelist of fixed column names.**

### Why it is correct
Bind parameters ({{?}}) can only replace **values**, not **identifiers** (column names, table names) or keywords (ASC/DESC). Therefore, with ORDER BY, the only safe approach is that the client sends a **logical key**, and the server looks it up in a mapping table under its control:
~~~java
private static final Map<String, String> SORT = Map.of(
    "name",  "name",
    "price", "price",
    "newest", "created_at");

String col = SORT.get(sortParam);
if (col == null) throw new BadRequestException("invalid sort parameter");
String dir = "desc".equalsIgnoreCase(dirParam) ? "DESC" : "ASC";
String sql = "SELECT id, name, price FROM products ORDER BY " + col + " " + dir + ", id";
~~~
The string concatenated into SQL is now only a constant written by the dev.

### Why others are incorrect
- **ORDER BY ?**: The parameter is bound as a **constant value** (the string 'price'), not a column name. The query sorts by a constant, meaning **no sorting at all**. Not an error, but feature broken.
- **Escape single quotes**: Payloads at the ORDER BY position don't need single quotes to be dangerous, e.g., {{(CASE WHEN (SELECT ascii(substr(password,1,1)) FROM users LIMIT 1) = 97 THEN price ELSE id END)}}. Observing changes in result order allows attackers to extract sensitive data character by character (blind injection).
- **WAF/regex blacklist**: There are always ways to bypass (case swapping, comments {{/**/}}, substitution functions, encoding). Blacklisting is a monitoring layer, not a fix.

> Senior tip: Spring Data {{Sort}} / {{Pageable}} with JPA checks properties against the entity, making them safer than string concatenation, but {{JpaSort.unsafe(...)}} and native queries are not. Always append a unique column ({{id}}) to the end of ORDER BY to ensure deterministic pagination.`
  },
  'qz-security-007': {
    q: 'Two internal services communicate over **mTLS**. Which statement is true?',
    options: [
      'During the handshake, both client and server present certificates and prove ownership of the private key; the server knows which service is calling, but still requires separate authorization for each action',
      'mTLS encrypts the payload twice (once per side), making it twice as safe as regular TLS',
      'mTLS completely replaces the need for authorization because the server knows exactly who is calling',
      'With mTLS, the client does not need to check the server\'s certificate anymore because the server has already checked the client'
    ],
    explain: `**Correct answer: mTLS performs two-way authentication, but authentication is not authorization.**

### Why it is correct
Regular TLS: only **server** presents a certificate, client verifies. mTLS (mutual TLS): server also sends a **CertificateRequest**, client presents its certificate and signs handshake data with its private key (**CertificateVerify**) to prove ownership. Result:
- Each side knows for certain who the other is (e.g., SAN containing {{spiffe://prod/ns/billing/sa/billing-api}} in SPIFFE-based service meshes).
- Credentials are not secrets sent over the wire (unlike API keys), private keys never leave the host.

However, "knowing billing-api is calling" does not answer "is billing-api allowed to **delete customer accounts**?". Authorization policies (e.g., Istio AuthorizationPolicy, OPA) or tokens carrying the end-user's permissions are still required.

### Why others are incorrect
- **Encrypts twice**: mTLS uses **a single** TLS channel with a session key pair just like regular TLS. The difference lies only in the authentication step during the handshake.
- **Replaces authorization**: Confusing authentication with authorization. If a service is compromised, an attacker inherits that service's identity; without policies, it can call all APIs.
- **Client ignores server cert**: Authentication must be **two-way**. Ignoring server cert verification opens the door to man-in-the-middle: an attacker impersonating the server receives the request already signed by the client.

> Senior tip: the hard part of mTLS is **certificate operations**: automated issuance, short lifespans (hours/days), rotation without downtime, revocation. Don't do it manually with 2-year certs; use service mesh (Istio, Linkerd) or SPIRE / AWS Private CA. RFC 8705 also allows **binding OAuth tokens to client certs**, so stolen tokens cannot be used from other machines.`
  },
  'qz-security-008': {
    q: 'A resource server receives a JWT access token from an authorization server. What must it check at a minimum?',
    options: [
      'Just decode the payload and check exp; the signature has been verified by the API gateway in all cases',
      'Signature with a hardcoded algorithm on the server side (do not trust alg in header), exp and nbf, iss matches the authorization server, aud contains this service',
      'Signature is enough; iss and aud are just informational and do not affect security',
      'Call the introspection endpoint for every request because JWTs cannot be verified locally'
    ],
    explain: `**Correct answer: verify signature (fixed algorithm) + lifespan + iss + aud.**

### Why it is correct
Each check blocks a different type of attack:
| Check | Blocks |
|---|---|
| Signature, fixed algorithm | forged tokens, payload tampering, algorithm confusion ({{alg: none}}, HS256 with public key) |
| exp, nbf (allow minor clock skew, e.g., 30–60s) | stolen old tokens being reused indefinitely |
| iss | tokens signed by a different issuer (test environment, different tenant) |
| aud | tokens issued for service A being reused for service B (token replay between services) |

Spring Security resource server checks signature, exp/nbf, and iss (if {{issuer-uri}} is configured) by default; **aud** can be declared from Spring Boot 3.x using {{spring.security.oauth2.resourceserver.jwt.audiences}}, or validated manually.

### Why others are incorrect
- **Just decode + exp**: Trusting that the gateway always blocks everything is a dangerous assumption: internal traffic, service meshes, batch jobs, or misconfigured routes can bypass the gateway. Zero trust: every service verifies itself.
- **iss/aud informational**: If multiple services trust an issuer, failing to check aud allows a malicious (or compromised) service to take a user token sent to it and call another service.
- **Introspection**: JWT signature allows **local** verification using a public key. Introspection (RFC 7662) is useful for instant revocation or opaque tokens, but is not mandatory and adds a round-trip to every request.

> Senior tip: JWTs cannot be revoked before exp, so keep access tokens short (5–15 minutes). For high-risk operations (password change, transfer), check {{jti}} against a revocation list or perform a dedicated introspection for those endpoints.`
  },
  'qz-behavioral-001': {
    q: 'Interviewer: "Tell me about a time you disagreed with a colleague on a technical decision." Which answer is best?',
    options: [
      'My old lead wanted to use MongoDB just because they liked new tech, while obviously not understanding the problem. I had to escalate to the CTO, and in the end, I was right.',
      'Our team often debates, but we always discuss openly and find the best solution for the project together.',
      'A senior colleague and I disagreed between MongoDB and PostgreSQL for the billing module, with a 1-week deadline. I proposed aligning on criteria first (transactions, reporting, operations), each doing a 2-day spike on real data, while acknowledging the flexibility of their approach. The team chose PostgreSQL with JSONB; we both agreed, shipped on time, and had zero reconciliation errors for 6 months. Lesson: align on criteria before debating solutions.',
      'If there is a disagreement, I listen, provide data, and always respect the team\'s final decision.'
    ],
    explain: `**Correct answer: The MongoDB vs. PostgreSQL story with spikes, shared criteria, and measured results.**

### Why it is correct
This follows the **STAR** structure:
- **S/T**: specific context (billing module), real pressure (1-week deadline).
- **A**: **the candidate\'s own** actions ("I proposed", "I acknowledged"), showing conflict resolution through **data and criteria**, not ego.
- **R**: specific results (on time, zero errors), mutual agreement, and an approach that combined strengths (JSONB).
- **Lesson**: shows self-reflection, exactly what interviewers look for in Senior/Lead candidates.

### Why others are incorrect
- **"Old lead... I was right"**: classic mistake: **blaming and belittling colleagues**, escalating instead of solving it yourself, and measuring success by "I won". Interviewers will think: this is how they will talk about my team.
- **"Our team... open"**: too generic, uses "we" so it's unclear what the candidate did, no specific situation, no results. This is a "non-story".
- **"If there is a disagreement, I will..."**: **hypothetical** answer to a behavioral question. "Tell me about a time..." needs an event that already occurred; hypothetical answers usually indicate the candidate has no real examples.

> Senior tip: prepare 6–8 STAR stories from real projects, each 1.5–2 minutes long, then reuse them for various questions (conflict, failure, influence without authority...). Spend about 60% of the time on the Action part.`
  },
  'qz-behavioral-002': {
    q: 'Interviewer: "Tell me about a time you missed a deadline." Which answer is best?',
    options: [
      'The project was delayed by 3 weeks because QA testing was too slow and Product kept changing requirements. My part was finished on time.',
      'We migrated from Oracle to PostgreSQL using Flyway, had to rewrite 200 stored procedures, handle sequences, collation, and NUMBER types; technically, this part was very complex.',
      'I have never missed a deadline because I am always ready to work overtime and weekends to meet the schedule.',
      'I estimated payment gateway integration would take 2 weeks, but halfway through the sprint, I discovered the partner\'s sandbox lacked refund webhooks. That same day, I informed the PM with a new estimate and two options: delay by 1 week, or go-live on time and handle refunds manually for a week. The PM chose option 2; we went live on time, and automated refunds were added 8 days later. Since then, I always run a spike on third-party integration in the first week.'
    ],
    explain: `**Correct answer: The payment gateway integration story.**

### Why it is correct
Interviewers aren't grading whether you "never miss a deadline," but **how you handle it when you do**:
- **Acknowledge** your own estimate was wrong, state objective causes without blaming.
- **Report early** ("that same day"), don't hide it until the last day.
- Provide **options with trade-offs** for the decision-maker, instead of just reporting bad news.
- Specific **results** (go-live on time, feature added 8 days later) and **process changes** to prevent recurrence.

### Why others are incorrect
- **"QA slow and Product changed requirements... my part was on time"**: blaming and separating yourself from team results. For a Senior position, interviewers want to see you taking responsibility for the **team\'s** result, and what you did when seeing QA was slow or requirements changed.
- **Oracle migration details**: getting lost in technical details, no Action related to the deadline (who did you inform, what did you negotiate), no Result. Behavioral question answered with a project description.
- **"Never missed, always worked overtime"**: dodging the question, and "overtime" is not a strategy: it shows poor estimation and burnout risk. Interviewers almost always ask follow-up questions and candidates usually get caught unprepared.

> Senior tip: the key phrase should be "I reported early with options." Many hiring managers consider this the most important signal of a senior: bad news arriving early leaves room for choices, bad news arriving late only leaves consequences.`
  },
  'qz-behavioral-003': {
    q: 'Interviewer: "Tell me about a difficult feedback you received." Which answer is best?',
    options: [
      'My manager said my design docs were too long and stakeholders wouldn\'t read them. Initially, I was slightly annoyed, but I asked for 2 specific examples and 2 sample docs rated highly. I switched to a 1-page format: problem, approach, trade-offs, decisions needed, details in appendix, and asked my manager to review the next 3 docs. Design sign-off time dropped from about 2 weeks to 4 days, and this format became the team template.',
      'I explained to my manager that long docs are necessary because the system is complex, and after that, he understood my perspective.',
      'The hardest feedback I\'ve received was that I\'m too perfectionist and work too hard.',
      'I always receive all feedback positively, because feedback helps me grow every day.'
    ],
    explain: `**Correct answer: The long design docs story.**

### Why it is correct
- **Honesty about emotions** ("initially slightly annoyed") makes the story believable and shows the candidate controls their reaction.
- **Proactive action**: ask for specific examples (clarifying feedback instead of being defensive), finding good samples, changing the way of working, and **inviting the feedback provider to review again**.
- **Measured results** (2 weeks → 4 days) and impact on the team (template). Signs of Senior/Lead-level influence.

### Why others are incorrect
- **"I explained... he understood"**: **defensive** reaction: the story is actually the candidate rejecting the feedback. Interviewers will worry the person is not coachable.
- **"Too perfectionist, too hard-working"**: "fake weakness" (humble-brag) interviewers have heard hundreds of times; considered dodging and lacking self-awareness.
- **"Always receive positively"**: generic statement, no situation, action, or result. Not a story, so it cannot be graded.

> Senior tip: choose feedback that is **genuinely valuable** and not about core skills of the position (communication, estimation, delegation), then prove you changed using numbers. Ending by mentioning how you actively **ask for** feedback now (e.g., asking after every design review) will score bonus points.`
  },
  'qz-behavioral-004': {
    q: 'Interviewer: "Tell me about a production incident you caused." Which answer is best?',
    options: [
      'The error was actually because staging was different from production, so no one could have detected it beforehand, not an individual\'s fault.',
      'I deployed a migration creating an index without CONCURRENTLY on an 80-million-row orders table, blocking writes for about 12 minutes during peak hour. I took incident ownership: halted the pipeline, worked with on-call to cancel the statement, updated the incident channel every 5 minutes, then recreated the index using CREATE INDEX CONCURRENTLY off-peak. Afterward, I wrote a blameless postmortem and added a lint rule to block non-CONCURRENTLY index creation on large tables; one year later, this error hasn\'t recurred.',
      'We had a big incident, the whole team met urgently and fixed it very quickly, then everything was working stably again.',
      'I always test very thoroughly before deploying, so I wouldn\'t let a production incident be caused by me.'
    ],
    explain: `**Correct answer: The 80-million-row table index migration story.**

### Why it is correct
- **Clear ownership**: "I deployed", "I took incident ownership". No dodging, no blaming.
- **Technical details sufficient and accurate**: {{CREATE INDEX}} usually holds a lock blocking INSERT/UPDATE/DELETE on the table for the duration of the build; {{CREATE INDEX CONCURRENTLY}} does not block writes (but builds slower and cannot run in a transaction block). Technical interviewers will believe this is a real story.
- **Methodical incident handling**: mitigation first, periodic communication, then root-cause fix.
- **Systemic prevention** (lint rule) instead of "next time I\'ll be more careful", along with long-term results.

### Why others are incorrect
- **"Because staging was different... not an individual's fault"**: the question asks for an incident *you caused*; answering by denying responsibility is a bad signal. "Blameless" in postmortem means not blaming individuals, it does not mean no one owns the problem.
- **"We... fixed very quickly"**: incident unknown, what candidate did unknown, impact unknown, what was learned unknown. Uses "we" to hide individual role.
- **"I always test... I wouldn't let it happen"**: both hypothetical and unrealistic. Every engineer who works in production long enough has caused an incident; asserting otherwise makes the interviewer doubt experience or honesty.

> Senior tip: Tell the incident story using the postmortem framework: **impact** (how many users, how long) → **detection** (alert or customer report) → **mitigation** → **root cause** → **prevention actions**. Lead-level interviewers pay special attention to "detection": if customers reported it before monitoring, you should also state what alert you added.`
  },
  'qz-behavioral-005': {
    q: 'Interviewer: "Tell me about a time you convinced Product/Stakeholders to prioritize technical debt." Which answer is best?',
    options: [
      'We had a lot of technical debt: old code written in Java 8, almost no tests, manual deployment, fragmented logging. The team mentioned this many times in retro and everyone agreed that this is an important task that needs to be solved.',
      'The PM only cares about features so I refactored secretly in feature tickets without reporting, because if I asked, it would definitely be refused.',
      'I would explain to the PM that technical debt is very dangerous, if not handled, the system will eventually crash.',
      'The checkout service had no integration tests, every release took 2 days of manual regression, and there were 3 hotfixes last quarter. Instead of asking for "refactor" generally, I aggregated data: release time, incident count, dev hours dragged into hotfixes, amounting to roughly 15% of team capacity. I proposed dedicating 20% each sprint for 2 sprints with measurable milestones. The PM agreed; after 6 weeks, release time was halved and the following quarter had zero hotfixes.'
    ],
    explain: `**Correct answer: The checkout service story with capacity metrics.**

### Why it is correct
You don't convince stakeholders by overriding their authority; you must **speak their language**:
- Convert technical debt into **business cost** (15% capacity, release days, hotfix count) instead of technical terms.
- Propose **limited** investment (20%, 2 sprints) with **measurable milestones**, reducing risk for the PM when saying "yes."
- Specific results, proving the investment was worthwhile, building trust for future proposals.

### Why others are incorrect
- **"We had a lot of technical debt…"**: long but only a **problem description**. No individual action by the candidate, no results; "everyone agreed" but nothing changed.
- **"Refactored secretly"**: breaks trust and transparency, skews feature estimation, and shows the candidate **avoids** conflict instead of resolving it. For Senior/Lead roles, this is a clear red flag.
- **"I would explain…"**: hypothetical, not real experience; and the argument "system will eventually crash" is scare-mongering without data, the least effective way to persuade.

> Senior tip: maintain a simple "debt register" (issue, estimated monthly cost, proposal, effort). When metrics accumulate, requesting budget for debt handling becomes a normal investment decision, not a debate between devs and product.`
  },
  'qz-behavioral-006': {
    q: 'Interviewer: "Tell me about a time you helped a team member struggling with performance." Which answer is best?',
    options: [
      'A junior joined 3 months ago, PRs were often rejected 4–5 times and tasks were often late. I set up a 1-1 and realized they were afraid to ask questions and didn\'t understand the payment domain. I wrote a review checklist, pair programmed 2 sessions per week for a month, and assigned small tasks with clear scope. After 2 months, the average review cycles dropped to 1–2 and they completed a small feature end-to-end alone. I learned: problems are often about context rather than ability.',
      'They worked slowly so I took over the difficult tasks and did them myself for speed, letting them do easier work; this way the team\'s sprint was always on time.',
      'I reported to the manager that they were not capable enough and suggested moving them to another team to avoid affecting progress.',
      'I love mentoring. I often share knowledge about Spring, JPA, Kafka, clean code, and design patterns with juniors, while organizing monthly tech talks so the whole team learns together.'
    ],
    explain: `**Correct answer: The 1-1, checklist, and pair programming story with the junior.**

### Why it is correct
- **Diagnose before acting**: 1-1 to find the root cause (afraid to ask, lack of domain knowledge), not defaulting to "incompetent."
- **Action is structured, appropriate to the cause**: checklist (reduces repetitive errors), pair programming (domain knowledge transfer), small tasks (early success creation).
- **Measured results** (4–5 cycles → 1–2 cycles, feature completion alone) and **lesson learned** about seeing people.

### Why others are incorrect
- **"Took over difficult tasks and did them myself"**: hero mode. Sprint is on time in the short term, but the junior doesn\'t improve, and the senior becomes a bottleneck. Lead-level interviewers see this as a lack of ability to develop others.
- **"Reported to manager to move team"**: ignores all support efforts, labels "incompetent" without finding the root cause. Shows lack of empathy and team spirit.
- **"I love mentoring… tech talks"**: sounds positive but **off-topic**: the question asks about a *specific person* struggling, the answer lists generic activities, no situation, no results.

> Senior tip: when telling stories about others, remain respectful (no names, no belittling) and emphasize **their results**, not your contribution. If the story ends with the person still not improving, tell how you transparently and fairly coordinated with the manager; that is also a good answer.`
  },
  'qz-behavioral-007': {
    q: 'Interviewer: "Tell me about a time two stakeholders requested urgent work, but you only had time for one." Which answer is best?',
    options: [
      'I accepted both and worked overtime all week to finish, because I didn\'t want to disappoint anyone.',
      'Sales needed a quote API for a big client in 5 days, at the same time Ops requested fixing a reconciliation job with mismatched numbers. I estimated both and asked each side about the impact if delayed by 1 week: quotes could lose a deal worth about $200k, reconciliation could be handled manually temporarily. I brought the comparison table to the engineering manager and both sides agreed: do the API first, Ops run the temporary script I wrote in 2 hours. Both finished in 8 days and no deal was lost.',
      'I chose to do Sales\' work because they bring revenue, while for Ops, I replied I was busy and let them figure it out themselves.',
      'I always prioritize according to the Eisenhower matrix: urgent and important work first, important but not urgent work gets scheduled, others are delegated or eliminated.'
    ],
    explain: `**Correct answer: The quote API and reconciliation job story.**

### Why it is correct
- **Decision-making based on impact**, not on who is louder: ask specifically "what is lost if delayed by 1 week".
- **Transparent and with the right decision-maker**: provided data to the engineering manager and both sides agreed, so no one feels bypassed.
- **Mitigate damage for the delayed side** (temporary script in 2 hours), showing solution-oriented mindset rather than just choosing A over B.
- **Specific results**.

### Why others are incorrect
- **"Accepted both, worked overtime"**: cannot say "no" or negotiate; not sustainable, quality easily drops, and hides capacity issues from management.
- **"Chose Sales, left Ops to figure it out"**: reason might be correct but **unilateral decision-making** and poor communication, damaging relations with Ops. No result on the impact of reconciliation mismatch.
- **"Eisenhower matrix"**: general theory, not a real situation that happened. Interviewers will ask "for a specific example" and you lose points for not being prepared.

> Senior tip: at Senior level and above, saying "I don\'t make prioritization decisions alone, but I\'m responsible for providing enough data for the decision-maker to decide quickly" is spot-on. Adding how you updated the side with the delayed schedule will score bonus points.`
  },
  'qz-behavioral-008': {
    q: 'Interviewer: "Tell me about a project you led that did not go as expected." Which answer is best?',
    options: [
      'The project failed because the company cut the budget midway, which was out of my control, so there wasn\'t much to learn.',
      'We built an event-driven system with Kafka, Debezium, and Kubernetes. The project had many technical and people challenges, but through it, we learned a lot.',
      'I led the splitting of the notification module into a microservice to reduce deployment time, but underestimated operational costs: after 3 months, a 4-person team had to handle pipeline, monitoring, and distributed errors, and deployment time only dropped by 10% instead of 50%. I presented the metrics to the manager, proposed bringing it back as a separate module in the monolith, and completed it in 2 sprints. Since then, before any architecture change, I write an ADR with measurable success criteria and exit points.',
      'Actually, all projects I lead achieve their goals, because I always plan in great detail from the beginning.'
    ],
    explain: `**Correct answer: The notification module to microservice story.**

### Why it is correct
- **Owns own mistakes** ("I underestimated...") with specific root causes, not blaming circumstances.
- **Honest measurement** (10% vs 50% target) and **courage to reverse decisions** (rollback architecture). This is a trait Lead/Architect interviewers value highly, as sunk cost fallacy is a common mistake.
- **Lesson becomes process** (ADR with success criteria and exit points), not just "I'll be careful next time."

### Why others are incorrect
- **"Budget cut... nothing to learn"**: blaming external factors and refusing to learn. Even if the cause is budget, a Lead can still learn about delivering early value in parts.
- **"We built event-driven..."**: lists tech, uses "we", doesn't say what didn't go as expected, what the candidate did, or what "learned a lot" actually means.
- **"All projects achieve goals"**: dodging the question. At Lead level, never having failed usually means never taking real risks or lacking self-awareness.

> Senior tip: the best failure story is one where the initial decision **was reasonable with the info at the time**, but you discovered it was wrong early thanks to measurement and fixed it. It shows both good judgment and the ability to self-correct.`
  }
});
