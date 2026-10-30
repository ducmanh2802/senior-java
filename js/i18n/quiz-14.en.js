/*
 * English translation of js/data/quiz.js — task T411. Format: js/core/i18n.js (content overlay).
 * ids: qz-security-001 qz-security-002 qz-security-003 qz-security-004 qz-security-005 qz-security-006 qz-security-007 qz-security-008 qz-behavioral-001 qz-behavioral-002 qz-behavioral-003 qz-behavioral-004 qz-behavioral-005 qz-behavioral-006 qz-behavioral-007 qz-behavioral-008
 */
App.i18n.content({
  'qz-security-001': {
    q: 'An auth service issues JWTs for 15 different microservices (some written by external teams). Which token signing and verification approach is the most appropriate?',
    options: [
      'HS256 with the same secret shared across all 15 services, because HMAC is faster than asymmetric signatures',
      'RS256 or ES256: the auth service keeps the private key, and the services retrieve public keys through JWKS for verification; even a compromised service cannot sign tokens itself',
      'No signature is needed; base64url-encoding the payload is sufficient because the token travels over HTTPS',
      'RS256, but the verifier reads the algorithm from the alg field in the token header so that algorithms can be changed flexibly'
    ],
    explain: `**Correct answer: asymmetric signatures (RS256/ES256) + JWKS.**

### Why this is correct
- **HS256** uses HMAC: the same secret is used to **sign** and **verify**. Anyone who can verify can also sign.
- **RS256** (RSA) / **ES256** (ECDSA): the private key resides only in the auth service; the other services need only the **public key** to verify tokens.

With 15 services, if HS256 is used, a secret leaked from any service (through logs, environment variables, or a repository) allows an attacker to **mint admin tokens for the entire system**. With RS256, exposing the public key causes no harm.

Public keys are published at a **JWKS** endpoint (for example, {{/.well-known/jwks.json}}), and each key has a {{kid}}. The token carries a {{kid}} in its header so the verifier can select the correct key → **key rotation** does not require services to be redeployed. Spring Security: {{spring.security.oauth2.resourceserver.jwt.jwk-set-uri}}.

### Why the other options are wrong
- **HS256 with a shared secret**: it really is faster, but RSA/ECDSA verification costs only microseconds to tens of microseconds, which is negligible compared with a request. In return, it creates a major security risk. HS256 is appropriate only when the signing and verifying parties are the **same** system.
- **No signature**: base64url is not encryption, so anyone can modify the payload (change {{role}} to ADMIN). HTTPS protects only the transport channel; it does not prove who issued the token.
- **Trusting the alg field in the header**: this is the well-known **algorithm confusion** vulnerability. An attacker can change alg to {{none}}, or to HS256 and then sign using the RSA public key (which is public) as the HMAC secret. The verifier must **pin** the accepted algorithms on the server.

> Senior tip: configure the resource server with an explicit allowlist of algorithms, cache JWKS, and automatically refresh it when an unknown {{kid}} is encountered (with rate limiting to prevent spam). When rotating keys, publish the new key in JWKS **before** signing with it, and retain the old key until the last token signed with it expires.`
  },
  'qz-security-002': {
    q: 'Which statement about storing tokens for a SPA (React/Angular) is **correct**?',
    options: [
      'Storing an access token in localStorage is safe because the same-origin policy prevents scripts from another domain from reading it',
      'HttpOnly cookies are completely immune to XSS, so CSP and output encoding can be omitted',
      'HttpOnly; Secure; SameSite cookies prevent JavaScript (including XSS scripts) from reading the token, but CSRF protection is still required, and XSS can still send requests on behalf of the user',
      'The implicit flow (returning the token directly in the URL fragment) is recommended for SPAs because it does not require a backend'
    ],
    explain: `**Correct answer: HttpOnly cookies prevent token theft, but they do not prevent everything.**

### Why this is correct
- **HttpOnly**: JavaScript cannot read the cookie through {{document.cookie}} → an XSS script cannot *steal* the token and use it elsewhere.
- **Secure**: the cookie is sent only over HTTPS. **SameSite=Lax/Strict**: reduces CSRF risk.
- However, the browser **automatically attaches** cookies → CSRF protection is required (SameSite plus a CSRF token, or Origin checks for data-modifying requests).
- And if the page has an XSS vulnerability, the script can still call APIs **from within the victim's browser** (the cookie is attached automatically). HttpOnly limits the damage (the token cannot be taken away, and access ends when the session ends); it does not eliminate the vulnerability.

A commonly recommended architecture is **BFF (Backend for Frontend)**: the server holds the access/refresh tokens, while the browser has only an HttpOnly session cookie.

### Why the other options are wrong
- **localStorage is safe**: the same-origin policy blocks *other* domains, but an XSS script runs **within your origin** (through unescaped input, a compromised npm dependency, and so on), so it can read localStorage and exfiltrate the token.
- **HttpOnly is immune to XSS**: as explained above, XSS can still act on the user's behalf, read data displayed on the page, and simulate form submissions. CSP and encoding remain the primary layers of defense.
- **Implicit flow**: the OAuth 2.0 Security BCP (RFC 9700) recommends **against** using the implicit grant because tokens are exposed in URLs (history, logs, Referer) and cannot be sender-constrained. SPAs should use **Authorization Code + PKCE**.

> Senior tip: if tokens must be accessible to JavaScript (without a BFF), keep the access token **in memory** (a JS variable), with a short lifetime of 5–15 minutes, and use refresh token **rotation** with reuse detection. Do not leave an access token in localStorage for days.`
  },
  'qz-security-003': {
    q: 'You are designing password storage for a new system. Which choice follows current recommendations (OWASP Password Storage Cheat Sheet)?',
    options: [
      'SHA-256 with a separate random salt for each user',
      'AES-256-GCM encryption with the key stored in a KMS so passwords can be decrypted when user support is needed',
      'MD5 applied twice, plus a secret pepper in the configuration',
      'Argon2id (or bcrypt with a sufficiently high cost), a separate salt for each user, and parameters tuned to make each hash deliberately slow'
    ],
    explain: `**Correct answer: Argon2id or bcrypt, with a separate salt and deliberate slowness.**

### Why this is correct
The main threat is a database dump followed by **offline brute-force** attacks using GPUs. A password hashing function must:
1. **Be slow and have adjustable resource costs**: Argon2id consumes both CPU and **memory** (memory-hard), reducing the advantage of GPUs/ASICs. OWASP suggests a minimum Argon2id configuration of 19 MiB of memory, 2 iterations, and parallelism 1; for bcrypt, use a work factor of at least 10.
2. **Use a random salt for each user**: two people with the same password have different hashes, which defeats rainbow tables. Argon2/bcrypt generate the salt automatically and store it directly in the hash string.

Spring Security provides {{Argon2PasswordEncoder}}, {{BCryptPasswordEncoder}}, and {{DelegatingPasswordEncoder}} (the hash string has a prefix such as {{bcrypt}} in curly braces to identify the algorithm and support gradual upgrades).

### Why the other options are wrong
- **SHA-256 + salt**: salt defeats rainbow tables, but SHA-256 is designed to be **fast**: a single GPU can compute billions of hashes per second, and an 8-character password can often be cracked within hours.
- **AES encryption**: encryption is **two-way**. If the key is exposed (through the app server, abused KMS permissions, or an insider), every original password is exposed. The system never needs to know the original password; "user support" should use a reset flow.
- **MD5 twice + pepper**: MD5 is even faster than SHA-256; applying it twice does not slow it down meaningfully. A pepper is a useful additional layer but cannot replace a slow hash function.

> Senior tip: bcrypt uses only the first **72 bytes** of a password (longer passphrases are truncated). Measure hashing time on the actual production machine (aim for roughly a few hundred ms), and remember that the login endpoint becomes a CPU DoS target: apply rate limiting before invoking the hash function. When changing algorithms, re-hash gradually when each user logs in successfully.`
  },
  'qz-security-004': {
    q: 'The session cookie for bank.example is explicitly set to {{SameSite=Lax}}. Which statement about CSRF is correct?',
    options: [
      'The cookie is not sent with a cross-site form POST, but it is still sent when the user performs a top-level GET navigation; therefore, an endpoint that modifies data through GET is still vulnerable to CSRF',
      'SameSite=Lax blocks cookies on every cross-site request, so CSRF tokens can be disabled entirely',
      'SameSite=None should be used because it provides the strictest cookie control',
      'CSRF primarily threatens APIs authenticated with an Authorization: Bearer header, because the browser sends this header automatically'
    ],
    explain: `**Correct answer: Lax blocks cross-site POST requests but still sends the cookie for top-level GET navigation.**

### Why this is correct
CSRF works because the browser **automatically attaches cookies** to requests to bank.example, even when the request originates from evil.example. SameSite controls this behavior:
| Value | Cookie sent on a cross-site request |
|---|---|
| Strict | Never |
| Lax | Only for top-level navigation with a safe method (GET through a link or redirect) |
| None (Secure is required) | Always sent |

With Lax: an auto-submitted POST form from evil.example → **no** cookie → the request is blocked. But if there is an endpoint such as {{GET /transfer?to=attacker&amount=1000}}, simply tricking the user into clicking a link is enough for the cookie to be attached. This is why GET must be **safe** (must not modify data).

### Why the other options are wrong
- **Disabling CSRF tokens**: SameSite considers only the **site** (registrable domain), not the origin. A compromised subdomain (for example, {{blog.bank.example}} with XSS) is still same-site and can send requests with cookies. Older browsers may also lack support. OWASP considers SameSite an **additional** layer, not a replacement for CSRF tokens.
- **SameSite=None**: this is the opposite—the loosest setting. The cookie is attached to every cross-site request; use it only for genuine embedding scenarios (third-party iframes, SSO).
- **Bearer header**: the browser does **not** automatically attach the Authorization header; JavaScript must add it explicitly, and a script on evil.example cannot read the token. Therefore, a pure Bearer API is largely immune to CSRF; cookies are the concern.

> Senior tip: Chrome applies **Lax by default** to cookies without a declared SameSite attribute, with a "Lax+POST" exception allowing top-level POST requests during the first 2 minutes after the cookie is set. Do not rely on defaults: always declare the attribute explicitly, retain Spring Security's CSRF token for applications using session cookies, and check the {{Origin}} header for data-modifying requests.`
  },
  'qz-security-005': {
    q: 'A pentest finds that a logged-in user can call {{GET /api/invoices/1043}}, change the id to 1044, 1045…, and view invoices belonging to other companies. What is the root-cause fix?',
    options: [
      'Replace sequential ids with UUIDs so attackers cannot guess ids',
      'Enable HTTPS for every endpoint and add rate limiting',
      'Check object-level authorization on every query: the invoice must belong to the current user/tenant (for example, WHERE id = ? AND tenant_id = ?); otherwise, return 404 or 403',
      'Add @PreAuthorize to check that the user has the USER role before entering the method'
    ],
    explain: `**Correct answer: enforce object-level authorization.**

### Why this is correct
This is **IDOR** (Insecure Direct Object Reference), part of **A01: Broken Access Control** in the OWASP Top 10 2021 (ranked first), and **API1: Broken Object Level Authorization** in the OWASP API Security Top 10 2023. The essence is that the server trusts the id supplied by the client without asking, "**Does this person have permission for this specific object?**"

The correct fix is to enforce ownership directly in the query:
~~~java
// tenantId comes from the authenticated token, NOT from the request
Invoice inv = invoiceRepo
    .findByIdAndTenantId(id, currentUser.tenantId())
    .orElseThrow(NotFoundException::new);   // 404: does not reveal whether the id exists
~~~
Putting the condition in the query (rather than loading first and comparing afterward) helps prevent omissions in other paths such as export, search, and bulk APIs.

### Why the other options are wrong
- **UUID**: this only makes ids harder to guess (security through obscurity). UUIDs can still leak through shared URLs, logs, emails, and responses from other APIs; once an id is known, the vulnerability remains. Use them as an additional layer, not as the fix.
- **HTTPS + rate limiting**: HTTPS protects the transport channel; here, the attacker is a valid user on a valid HTTPS connection. Rate limiting only slows down enumeration; it does not prevent unauthorized access.
- **@PreAuthorize with role USER**: this checks **functional** permission (whether the endpoint can be called), not **data** permission (which invoices can be viewed). The attacker already has the USER role.

> Senior tip: in a multi-tenant system, do not rely on every developer remembering to add {{tenant_id}}: use Hibernate {{@TenantId}} (Hibernate 6) or a filter, or PostgreSQL Row-Level Security, and write an automated test—"a user in tenant A requesting an id from tenant B must receive 404"—for every endpoint with an id in its path.`
  },
  'qz-security-006': {
    q: `A product-list API lets the client choose the sort column. The current code is vulnerable to SQL injection. Which fix is correct?
~~~java
String sql = "SELECT id, name, price FROM products ORDER BY " + sort;
return jdbcTemplate.query(sql, rowMapper);
~~~`,
    options: [
      'Use a PreparedStatement with ORDER BY ? and then call setString(1, sort)',
      'Escape single quotes in the sort parameter before concatenating it',
      'Use a WAF or a regex to block keywords such as SELECT, UNION, and --',
      'Map the client-supplied value through a fixed whitelist (for example, price maps to p.price, and direction is only ASC or DESC); return 400 for any other value'
    ],
    explain: `**Correct answer: map the client value through a whitelist to fixed column names.**

### Why this is correct
A bind parameter ({{?}}) can substitute only a **value**, not an **identifier** (column or table name) or a keyword (ASC/DESC). Therefore, for ORDER BY, the only safe approach is for the client to send a **logical key** and for the server to look it up in a mapping table it controls:
~~~java
private static final Map<String, String> SORT = Map.of(
    "name",  "name",
    "price", "price",
    "newest", "created_at");

String col = SORT.get(sortParam);
if (col == null) throw new BadRequestException("invalid sort field");
String dir = "desc".equalsIgnoreCase(dirParam) ? "DESC" : "ASC";
String sql = "SELECT id, name, price FROM products ORDER BY " + col + " " + dir + ", id";
~~~
The strings concatenated into SQL can now only be constants written by the developer.

### Why the other options are wrong
- **ORDER BY ?**: the parameter is bound as a constant **value** (the string 'price'), not a column name. The statement sorts by a constant, which means it **does not sort at all**. It does not fail, but the feature is broken.
- **Escaping single quotes**: a payload in the ORDER BY position needs no quotes, for example {{(CASE WHEN (SELECT ascii(substr(password,1,1)) FROM users LIMIT 1) = 97 THEN price ELSE id END)}}. By observing changes in the result order, an attacker can infer sensitive data one character at a time (blind injection).
- **WAF/regex blacklist**: there is always a way around it (changing case, comments such as {{/**/}}, alternative functions, encoding). A blacklist is a monitoring layer, not a fix.

> Senior tip: Spring Data {{Sort}} / {{Pageable}} with JPA validates properties against the entity, so it is safer than string concatenation, but {{JpaSort.unsafe(...)}} and native queries are not. Always append a unique column ({{id}}) to ORDER BY for stable pagination.`
  },
  'qz-security-007': {
    q: 'Two internal services communicate over **mTLS**. Which statement is correct?',
    options: [
      'During the handshake, both client and server present certificates and prove possession of their private keys; the server can identify which service is calling, but separate authorization is still required for each action',
      'mTLS encrypts the payload twice (once on each side), so it is twice as secure as regular TLS',
      'mTLS completely eliminates the need for authorization because the server knows exactly who is calling',
      'With mTLS, the client no longer needs to validate the server certificate because the server has already validated the client'
    ],
    explain: `**Correct answer: mTLS provides mutual authentication, but authentication is not authorization.**

### Why this is correct
With regular TLS, only the **server** presents a certificate, which the client verifies. With mTLS (mutual TLS), the server also sends a **CertificateRequest**; the client presents its certificate and signs handshake data with its private key (**CertificateVerify**) to prove possession. The result is:
- Each party can be certain of the other party's identity (for example, a SAN containing {{spiffe://prod/ns/billing/sa/billing-api}} in a service mesh using SPIFFE).
- Credentials are not secrets sent over the network (unlike an API key), and the private key never leaves the machine.

However, "I know billing-api is calling" does not answer "Is billing-api allowed to **delete customer accounts**?" A policy (for example, Istio AuthorizationPolicy or OPA) or a token carrying the end user's permissions is still required.

### Why the other options are wrong
- **Double encryption**: mTLS uses **one** TLS channel with one set of session keys, just like regular TLS. The difference lies only in the authentication step during the handshake.
- **Replacing authorization**: this confuses authentication with authorization. If a service is compromised, the attacker inherits its identity; without a policy, it can call every API.
- **Client skips server validation**: authentication must be **mutual**. Skipping server certificate verification opens the door to a man-in-the-middle: a fake server receives the request signed by the client.

> Senior tip: the difficult part of mTLS is **certificate operations**: automated issuance, short lifetimes (hours/days), rotation without downtime, and revocation. Do not manage two-year certificates manually; use a service mesh (Istio, Linkerd) or SPIRE / AWS Private CA. RFC 8705 also supports **binding OAuth tokens to client certificates**, so a stolen token cannot be used from another machine.`
  },
  'qz-security-008': {
    q: 'A resource server receives a JWT access token from an authorization server. At a minimum, what must it validate?',
    options: [
      'It only needs to decode the payload and check exp; the API gateway has already validated the signature in every case',
      'The signature using a server-pinned algorithm (without trusting alg in the header), exp and nbf, iss matching the authorization server, and aud containing this service',
      'The signature is sufficient; iss and aud are informational only and do not affect security',
      'Call the introspection endpoint on every request because a JWT cannot be verified locally'
    ],
    explain: `**Correct answer: verify the signature (with a pinned algorithm) + validity period + iss + aud.**

### Why this is correct
Each check blocks a different type of attack:
| Check | What it blocks |
|---|---|
| Signature, pinned algorithm | Forged tokens, modified payloads, algorithm confusion ({{alg: none}}, HS256 with a public key) |
| exp, nbf (allowing a small clock skew, for example 30–60 seconds) | An old stolen token being used indefinitely |
| iss | A token signed by another issuer (a test environment or another tenant) |
| aud | A token issued for service A being used at service B (token replay between services) |

A Spring Security resource server validates the signature, exp/nbf, and iss by default (when {{issuer-uri}} is configured); in Spring Boot 3.x, **aud** can be declared using {{spring.security.oauth2.resourceserver.jwt.audiences}}, or you can add a custom validator.

### Why the other options are wrong
- **Decode + exp only**: assuming the gateway always blocks bad tokens first is dangerous: internal traffic, a service mesh, batch jobs, or a misconfigured route can bypass the gateway. Zero trust means each service verifies tokens itself.
- **iss/aud are informational only**: if multiple services trust the same issuer, omitting the aud check allows a malicious (or compromised) service to take a token sent to it by a user and call another service with it.
- **Mandatory introspection**: a signed JWT is specifically designed for **local** verification with a public key. Introspection (RFC 7662) is useful when immediate revocation is required or opaque tokens are used, but it is not mandatory and adds a round-trip to every request.

> Senior tip: a JWT cannot be revoked before exp, so keep access tokens short-lived (5–15 minutes). For high-risk operations (password changes, money transfers), you can additionally check a revocation list by {{jti}} or use introspection specifically for those endpoints.`
  },
  'qz-behavioral-001': {
    q: 'Interviewer: "Tell me about a time you disagreed with a colleague about a technical decision." Which answer is best?',
    options: [
      "My former lead wanted to use MongoDB just because he liked new technology, even though he clearly didn't understand the problem. I had to escalate to the CTO, and in the end I was right.",
      'Our team often disagreed, but we always discussed things openly and worked together to find the best solution for the project.',
      'Another senior engineer and I disagreed over MongoDB versus PostgreSQL for the billing module, and we had to decide within one week. I proposed agreeing on the criteria first (transactions, reporting, operations), with each of us doing a two-day spike on real data, and I acknowledged the other option\'s strength in schema flexibility. The team chose PostgreSQL with JSONB columns, we both agreed, the module reached production on schedule, and there were no reconciliation errors for six months. The lesson was to agree on criteria before debating solutions.',
      'If there is a disagreement, I will listen, present data, and always respect the team\'s final decision.'
    ],
    explain: `**Correct answer: the MongoDB and PostgreSQL answer, with spikes, shared criteria, and measurable results.**

### Why this is correct
This answer has the full **STAR** structure:
- **S/T**: a specific context (the billing module) and real pressure (a decision within one week).
- **A**: actions taken by **the candidate** ("I proposed", "I acknowledged"), showing that they resolved the disagreement using **data and criteria**, not ego.
- **R**: quantified results (on schedule, no errors for six months), agreement from both sides, and a final option combining the strengths of both (JSONB).
- **Lesson**: demonstrates the ability to reflect and learn, which interviewers strongly value at the Senior/Lead level.

### Why the other options are wrong
- **"My former lead… I was right"**: a classic mistake—**blaming and belittling a colleague**, escalating instead of resolving the issue directly, and measuring success by "I won." The interviewer will think this person will talk about their team the same way.
- **"Our team… openly"**: generic; using "we" makes it unclear what the candidate did, with no specific situation or result. This is an answer that "tells no story."
- **"If there is a disagreement, I will…"**: a **hypothetical** answer to a behavioral question. "Tell me about a time" requires an actual event; answering "I will" usually suggests the candidate has no real example.

> Senior tip: prepare 6–8 STAR stories from real projects, each 1.5–2 minutes long, then reuse them for different questions (conflict, failure, influencing without authority, and so on). About 60% of the time should be devoted to the Action section.`
  },
  'qz-behavioral-002': {
    q: 'Interviewer: "Tell me about a time you missed a deadline." Which answer is best?',
    options: [
      'The project was three weeks late because the QA team tested too slowly and product kept changing requirements. My part was completed on time.',
      'We migrated from Oracle to PostgreSQL using Flyway and had to rewrite 200 stored procedures, handle sequences, collation, and the NUMBER type; this part was technically very complex.',
      'I have never missed a deadline because I am always willing to work evenings and weekends to stay on schedule.',
      'I estimated that integrating the payment gateway would take two weeks, but midway through the sprint I discovered that the partner\'s sandbox lacked refund webhooks. That same day, I gave the PM a revised estimate with two options: delay by one week, or go live on schedule and handle refunds manually temporarily. The PM chose the second option; we went live on the planned date and added automated refunds eight days later. Since then, I have always done a third-party integration spike in the first week.'
    ],
    explain: `**Correct answer: the payment gateway integration story.**

### Why this is correct
The interviewer is not assessing whether you have "never been late"; they are assessing **how you handle being late**:
- **Acknowledge** that your own estimate was wrong, state the external cause without assigning blame.
- **Communicate early** ("that same day") rather than hiding the problem until the final day.
- Present **options with trade-offs** so the decision-maker can choose, instead of merely delivering bad news.
- Provide a concrete **result** (go-live on the planned date, full functionality eight days later) and a **process change** to prevent recurrence.

### Why the other options are wrong
- **"Because QA was slow and product changed requirements… my part was on time"**: this assigns blame and distances the candidate from the shared outcome. For a Senior role, the interviewer wants to see ownership of the **team's** result and what you did when QA was slow or requirements changed.
- **Oracle migration details**: this gets lost in technical detail, with no Action related to the deadline (whom you informed, what you negotiated) and no Result. The question is behavioral, but the answer is a project description.
- **"Never missed one, always work extra hours"**: this dodges the question, and "working overtime" is not a strategy: it suggests poor estimation and burnout risk. The interviewer will almost always probe further, revealing that the candidate is unprepared.

> Senior tip: the key sentence in this answer should be "I communicated early and brought options." Many hiring managers consider this the most important signal of seniority: early bad news leaves options; late bad news leaves only consequences.`
  },
  'qz-behavioral-003': {
    q: 'Interviewer: "Tell me about a piece of difficult feedback you received." Which answer is best?',
    options: [
      'My manager said my design documents were too long, so stakeholders did not read them. I was initially a little annoyed, but I asked for two specific examples and two well-regarded sample documents. I switched to a one-page format: problem, options, trade-offs, decision needed, with details in an appendix, and asked my manager to review my next three documents. The time to finalize a design fell from about two weeks to four days, and this format became the team template.',
      'I explained to my manager that long documents were necessary because the system was complex, and after that discussion he understood my point of view.',
      'The hardest feedback I have ever received was that I was too much of a perfectionist and worked too hard.',
      'I always welcome every piece of feedback positively because feedback helps me improve every day.'
    ],
    explain: `**Correct answer: the story about overly long design documents.**

### Why this is correct
- **Being honest about emotions** ("initially a little annoyed") makes the story credible while showing that the candidate can control their reaction.
- **Proactive actions**: asking for specific examples (clarifying feedback instead of becoming defensive), finding good examples, changing the approach, and **inviting the feedback giver to review the changes**.
- **Measurable results** (two weeks → four days) and an impact that spread across the team (the template). This signals Senior/Lead-level influence.

### Why the other options are wrong
- **"I explained… he understood"**: a **defensive** reaction—the story is really about the candidate rejecting the feedback. The interviewer will worry that this person is difficult to coach.
- **"Too much of a perfectionist, worked too hard"**: a "fake weakness" (humble-brag) that interviewers have heard hundreds of times; it comes across as evasive and lacking self-awareness.
- **"Always welcome feedback positively"**: a generic claim with no situation, action, or result. It is not a story, so there is nothing to assess.

> Senior tip: choose feedback that was **genuinely valuable** and concerns a skill that is not absolutely core to the role (communication, estimation, delegation), then prove the change with numbers. Ending with how you now proactively **ask for** feedback (for example, after every design review) earns additional credit.`
  },
  'qz-behavioral-004': {
    q: 'Interviewer: "Tell me about a production incident you caused." Which answer is best?',
    options: [
      'The issue was actually caused by staging differing from production, so no one could have detected it beforehand; it was not any individual\'s fault.',
      'I deployed a migration that created an index without CONCURRENTLY on an 80-million-row orders table, blocking writes for about 12 minutes during peak hours. I took ownership of the incident: stopped the pipeline, worked with on-call to cancel the statement, updated the incident channel every five minutes, and then recreated the index using CREATE INDEX CONCURRENTLY outside peak hours. Afterward, I wrote a blameless postmortem and added a lint rule blocking non-CONCURRENTLY index creation on large tables; the issue has not recurred in a year.',
      'We had a major incident, the whole team held an emergency meeting and fixed it very quickly, and then everything became stable again.',
      'I always test very thoroughly before deploying, so I would not allow a production incident caused by me to happen.'
    ],
    explain: `**Correct answer: the story about the index migration on the 80-million-row table.**

### Why this is correct
- **Clear ownership**: "I deployed", "I took responsibility." No evasion or blame.
- **Just enough accurate technical detail**: regular {{CREATE INDEX}} holds a lock that blocks INSERT/UPDATE/DELETE on the table throughout the build; {{CREATE INDEX CONCURRENTLY}} does not block writes (in return, the build is slower and cannot run inside a transaction block). A technical interviewer will find the story credible.
- **A disciplined incident response**: mitigate the impact first, communicate at regular intervals, and only then fix the root cause.
- **Systemic prevention** (a lint rule) instead of "I will be more careful next time," with a result measured over time.

### Why the other options are wrong
- **"Because staging differed from production… it was no one's fault"**: the question asks for an incident *you caused*; denying responsibility is a bad signal. "Blameless" in a postmortem means not assigning personal blame, not that no one owns the problem.
- **"We… fixed it very quickly"**: it is unclear what the incident was, what the candidate did, how great the impact was, or what was learned. "We" is used to hide the individual's role.
- **"I always test thoroughly… would not let it happen"**: both hypothetical and unrealistic. Every engineer who works with production long enough has caused an incident; claiming otherwise makes the interviewer doubt the candidate's experience or honesty.

> Senior tip: tell the incident story using a postmortem structure: **impact** (how many users, for how long) → **detection** (an alert or a customer report) → **mitigation** → **root cause** → **preventive actions**. Lead interviewers pay particular attention to "detection": if customers reported the issue before monitoring did, you should also explain which alerts you added.`
  },
  'qz-behavioral-005': {
    q: 'Interviewer: "Tell me about a time you persuaded product/stakeholders to prioritize technical debt." Which answer is best?',
    options: [
      'We had a great deal of technical debt: legacy code written in Java 8, almost no tests, manual deployments, and fragmented logs. The team raised these issues in retrospectives many times, and everyone agreed that this important work needed to be addressed.',
      'The PM cared only about features, so I quietly refactored code within feature tickets without telling them, because asking would certainly have led to rejection.',
      'I would explain to the PM that technical debt is very dangerous and that the system will collapse sooner or later if we do not address it.',
      'The checkout service had no integration tests, every release required two days of manual regression testing, and there had been three hotfixes in the previous quarter. Instead of asking for a vague "refactor," I gathered data: release time, incident count, and developer hours pulled into hotfixes, amounting to about 15% of the team\'s capacity. I proposed allocating 20% of each sprint for two sprints, with measurable milestones. The PM agreed; after six weeks, releases took half a day, and there were no hotfixes the following quarter.'
    ],
    explain: `**Correct answer: the checkout service story with capacity data.**

### Why this is correct
Persuading a stakeholder does not give you the authority to decide on their behalf, so the candidate must **speak their language**:
- Translate technical debt into **business costs** (15% capacity, release days, hotfix count) instead of technical jargon.
- Make a **bounded** proposal (20%, two sprints) with **measurable milestones**, reducing the PM's risk in saying "yes."
- Provide concrete results, proving that the investment was worthwhile and building trust for the next proposal.

### Why the other options are wrong
- **"We had a great deal of technical debt…"**: lengthy but only a **description of the problem**. There is no individual persuasion action or result; "everyone agreed," yet nothing changed.
- **"Quietly refactoring"**: this breaks trust and transparency, distorts feature estimates, and shows that the candidate **avoids** conflict instead of addressing it. For a Senior/Lead role, this is a clear red flag.
- **"I would explain…"**: hypothetical rather than real experience; and arguing that "the system will collapse" is fearmongering without data—the least effective kind of persuasion.

> Senior tip: maintain a simple "debt register" (problem, estimated monthly cost, proposal, effort). With accumulated data, requesting a budget to address debt becomes an ordinary investment decision rather than an argument between development and product.`
  },
  'qz-behavioral-006': {
    q: 'Interviewer: "Tell me about a time you helped a team member who was struggling with performance." Which answer is best?',
    options: [
      'A junior engineer had been with us for three months; their PRs often went through 4–5 rounds of changes, and they were frequently late on tasks. I scheduled a one-on-one and realized they were reluctant to ask questions and did not yet understand the payments domain. I wrote a review checklist, paired with them twice a week for a month, and first assigned small tasks with clear scope. After two months, the average number of review rounds was down to 1–2, and they completed a small feature end-to-end independently. My takeaway was that the issue is often context rather than ability.',
      'They were working slowly, so I took back the difficult tasks and did them myself to get them done quickly, leaving them with easier work; as a result, the team\'s sprints were always on schedule.',
      'I told the manager that they were not capable enough and proposed moving them to another team so they would not affect our schedule.',
      'I really enjoy mentoring. I often share knowledge about Spring, JPA, Kafka, clean code, and design patterns with junior engineers, and I also organize monthly tech talks so the whole team can learn together.'
    ],
    explain: `**Correct answer: the story about one-on-ones, a checklist, and pair programming with the junior engineer.**

### Why this is correct
- **Diagnose before acting**: use a one-on-one to find the cause (reluctance to ask questions, missing domain knowledge) rather than assuming "low ability."
- **Structured actions suited to the cause**: a checklist (reduces repeated mistakes), pair programming (transfers domain knowledge), and small tasks (creates early wins).
- **Measurable results** (4–5 rounds → 1–2 rounds, independently delivering a feature) and a **lesson** about how to view people.

### Why the other options are wrong
- **"Took back the difficult tasks and did them myself"**: hero mode. The sprint stays on schedule in the short term, but the junior engineer does not improve, and the senior engineer becomes a bottleneck. A Lead interviewer sees this as an inability to develop others.
- **"Told the manager to move them to another team"**: skips every attempt to help and labels them "not capable enough" before investigating the cause. It shows a lack of empathy and team spirit.
- **"I really enjoy mentoring… tech talks"**: sounds positive but is **off-topic**: the question concerns one specific person who was struggling, while the answer lists general activities with no situation or result.

> Senior tip: when telling a story about someone else, remain respectful (do not name or disparage them) and emphasize **their results**, not your own contribution. If the story ends with the person still not improving, explain how you worked with the manager transparently and fairly; that can also be a good answer.`
  },
  'qz-behavioral-007': {
    q: 'Interviewer: "Tell me about a time two stakeholders each requested urgent work, but you had time to complete only one." Which answer is best?',
    options: [
      'I accepted both and worked overtime all week to complete them because I did not want to disappoint anyone.',
      'Sales needed a quotation API for a major customer within five days, while Ops asked me to fix a reconciliation job that was producing discrepancies. I estimated both and asked each side about the impact of a one-week delay: the quotation could lose a contract worth about USD 200,000, while reconciliation could be handled manually temporarily. I presented a comparison table to the engineering manager, and both sides agreed: build the API first, with Ops running a temporary script I wrote in two hours. Both tasks were completed within eight days, and no contract was lost.',
      'I chose the Sales work because they generate revenue; I told Ops I was busy and left them to figure it out themselves.',
      'I always prioritize using the Eisenhower matrix: do urgent and important work first, schedule important but non-urgent work, and delegate or eliminate the rest.'
    ],
    explain: `**Correct answer: the story about the quotation API and reconciliation job.**

### Why this is correct
- **Make the decision based on impact**, not on who speaks loudest: ask specifically, "What do we lose if this is one week late?"
- **Transparency and the right decision-maker**: presenting the data to the engineering manager and reaching agreement with both sides prevents either side from feeling dismissed.
- **Limit the damage for the deprioritized side** (a temporary script written in two hours), demonstrating solution-oriented thinking rather than simply choosing A and abandoning B.
- **A concrete result**.

### Why the other options are wrong
- **"Accepted both, worked overtime"**: an inability to say "no" or negotiate; unsustainable, likely to reduce quality, and hides the capacity problem from management.
- **"Chose Sales, left Ops to figure it out"**: the reasoning may be sound, but the **unilateral decision** and poor communication damage the relationship with Ops. There is no result addressing the impact of the reconciliation discrepancies.
- **"Eisenhower matrix"**: general theory, not an actual situation. The interviewer will ask for "a specific example," and you will lose points for being unprepared.

> Senior tip: at the Senior level and above, saying "I did not decide the priority alone, but I took responsibility for providing enough data for the authorized person to decide quickly" demonstrates the right scope. Explaining how you followed up with the side whose work was delayed earns additional credit.`
  },
  'qz-behavioral-008': {
    q: 'Interviewer: "Tell me about a project you led where the outcome did not meet expectations." Which answer is best?',
    options: [
      'The project failed because the company cut the budget midway, which was beyond my control, so there was really not much to learn from it.',
      'We built an event-driven system with Kafka, Debezium, and Kubernetes. The project presented many technical and people challenges, but we learned a great deal from it.',
      'I led the extraction of the notification module into a microservice to reduce deployment time, but underestimated the operational cost: after three months, our four-person team had to manage an additional pipeline, monitoring, and distributed failures, while deployment time fell by only 10% instead of 50%. I presented the data to my manager, proposed moving it back into a separate module within the monolith, and completed that in two sprints. Since then, before every architectural change, I have written an ADR with measurable success criteria and a stopping point.',
      'Actually, every project I have led has met its goals because I always create a very detailed plan from the outset.'
    ],
    explain: `**Correct answer: the story about extracting the notification module into a microservice.**

### Why this is correct
- **Acknowledge your own mistake** ("I underestimated…") with a specific cause, rather than blaming circumstances.
- **Measure honestly** (10% versus the 50% target) and have the **courage to reverse the decision** (an architectural rollback). Lead/Architect interviewers value this highly because sunk cost fallacy is common.
- **Turn the lesson into a process** (an ADR with success criteria and a stopping point), rather than merely saying "be more careful next time."

### Why the other options are wrong
- **"The company cut the budget… there was nothing to learn"**: blames an external factor and refuses to learn. Even when the cause is budget-related, a Lead can still draw lessons about delivering valuable increments early.
- **"We built an event-driven system…"**: lists technologies, uses "we," and does not explain which outcome fell short, what the candidate did, or what "learned a great deal" actually means.
- **"Every project met its goals"**: dodges the question. At the Lead level, never having failed often means never having taken real risks or lacking self-awareness.

> Senior tip: the best failure story is one where the original decision was **reasonable given the information available at the time**, but you detected the mistake early through measurement and corrected it in time. It demonstrates both judgment and the ability to adjust course.`
  }
});
