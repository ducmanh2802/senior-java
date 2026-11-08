/*
 * English translation of js/data/q-security.js — task T964. Format: js/core/i18n.js (content overlay).
 * ids: security-033 security-034 security-035 security-036
 */
App.i18n.content({
  'security-033': {
    q: 'Explain Spring Security internals: which components does a request pass through from the Servlet container to the controller? How do DelegatingFilterProxy, FilterChainProxy, SecurityFilterChain and the filter order work? How do you configure multiple SecurityFilterChains by path?',
    a: `**Summary:** Spring Security works as a chain of **Servlet Filters** (filters that run before the controller). Main flow: the Servlet container calls {{DelegatingFilterProxy}} (registered with the container) -> it looks up the {{FilterChainProxy}} bean in the Spring context -> {{FilterChainProxy}} selects the right {{SecurityFilterChain}} by path -> runs the security filters in sequence (authentication, authorization, CSRF...). Multiple chains let you apply different rules to {{/api/**}} (stateless JWT) and {{/admin/**}} (form login + session).

### 1. Background terms (from scratch)
- **Servlet Filter**: a "checkpoint" of standard Java web (Servlet API). Every HTTP request entering the server passes through filters **before** reaching the controller, and responses pass through them on the way out. A filter can allow, block, or modify the request/response. Real-life analogy: like a security gate in a building — anyone entering must have their badge checked before going up to the office.
- **Spring bean**: an object created and managed by the Spring container. Problem: the Servlet container (Tomcat) starts filters **before** the Spring context is ready, so a plain filter cannot use Spring beans. {{DelegatingFilterProxy}} bridges this gap.
- **SecurityContext**: where Spring Security stores "who is logged in" ({{Authentication}}) for the current request, usually attached to a {{ThreadLocal}}.

### 2. Step-by-step flow
~~~text
HTTP Request
  │
  ▼
[1] Servlet Container (Tomcat) - container filter chain
  │  (in registration order in web.xml / FilterRegistrationBean)
  ▼
[2] DelegatingFilterProxy (default bean name: "springSecurityFilterChain")
  │  - a real Servlet Filter that the container knows
  │  - on each request: look up the Spring ApplicationContext
  │  - find the bean named "springSecurityFilterChain"
  │  - delegate handling to that bean
  ▼
[3] FilterChainProxy (Spring bean, implements Filter)
  │  - holds the list of SecurityFilterChains
  │  - iterates in ORDER: picks the FIRST chain whose RequestMatcher matches
  │  - only one chain runs per request
  ▼
[4] Selected SecurityFilterChain (e.g. chain for /api/**)
  │  - contains the ordered list of security filters
  │  - runs in sequence: filter1 -> filter2 -> ... -> filterN
  ▼
[5] Remaining container filters -> DispatcherServlet -> Controller
~~~

~~~java
// Spring Boot registers DelegatingFilterProxy via SecurityFilterAutoConfiguration.
// You do not write it by hand, but understanding it helps debug "why doesn't my filter run?".
// DelegatingFilterProxy (simplified concept):
public class DelegatingFilterProxy extends GenericFilterBean {
    private volatile Filter delegate; // will point to FilterChainProxy

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        // First time: get the "springSecurityFilterChain" bean from the Spring context
        Filter target = getDelegate(); // lazy init, thread-safe
        // Delegate everything to FilterChainProxy
        target.doFilter(req, res, chain);
    }
}
~~~

### 3. Filter order inside a SecurityFilterChain (why order matters)
Spring Security orders filters by a fixed order (the {{SecurityFilters}} enum defines positions). Wrong order, e.g. checking authorization **before** authentication, means {{Authentication}} is not yet present and every request is rejected.

| Order (typical) | Filter | Role |
|---|---|---|
| ~100 | {{DisableEncodeUrlFilter}} | Prevent session id leakage into URLs |
| ~400 | {{CsrfFilter}} | Check CSRF token (form session) |
| ~1500 | {{BearerTokenAuthenticationFilter}} | Read {{Authorization: Bearer}} -> authenticate JWT/opaque token |
| ~1600 | {{UsernamePasswordAuthenticationFilter}} | Handle POST login form |
| ~2000 | {{ExceptionTranslationFilter}} | Catch {{AuthenticationException/AccessDeniedException}} -> return 401/403 |
| ~2100 | {{AuthorizationFilter}} | Check endpoint access ({{authorizeHttpRequests}}) |

- **Authentication** must run before **authorization**: you must know "who you are" before deciding "what you may do".
- {{ExceptionTranslationFilter}} sits before {{AuthorizationFilter}} in the chain so it can **catch** the exception that {{AuthorizationFilter}} throws and turn it into a proper 401/403 (instead of a 500).
- Use {{http.addFilterBefore/After(myFilter, TargetFilter.class)}} to insert a custom filter at the right position. Wrong position is a common security bug.

### 4. Multiple SecurityFilterChains by path
Real case: {{/api/**}} is a stateless REST API using JWT; {{/admin/**}} uses form login + session + CSRF. They need different security config. {{FilterChainProxy}} picks the first matching chain, so the **more specific chain must be declared first** (use {{@Order}}).

~~~java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // Chain 1: stateless API - higher priority (runs first)
    @Bean @Order(1)
    public SecurityFilterChain apiChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/api/**")              // applies only to /api/**
            .csrf(csrf -> csrf.disable())            // stateless API usually uses tokens, no CSRF cookie
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .anyRequest().authenticated())
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));
        return http.build();
    }

    // Chain 2: web admin - default for the rest
    @Bean @Order(2)
    public SecurityFilterChain webChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .anyRequest().permitAll())
            .formLogin(Customizer.withDefaults());   // enables session + CSRF by default
        return http.build();
    }
}
~~~

### 5. In production
- **Symptom "filter not running"**: usually a missing {{securityMatcher}} or wrong chain order — a general chain (matching {{/**}}) placed first "swallows" every request and later chains are never selected. Turn on debug: {{logging.level.org.springframework.security=DEBUG}} or {{TRACE}} to see which chain {{FilterChainProxy}} selects and which filters run.
- **Unexpected 401/403**: check {{ExceptionTranslationFilter}} — if the authentication entry point is not configured correctly for the API (returns an HTML login page instead of JSON 401), the client gets a hard-to-handle response.
- **Measurement**: enable Spring Security debug logging **only in dev/staging** (very noisy, may leak info). In production use Micrometer metrics and access logs at the gateway; do not leave security {{TRACE}} in prod.
- **Common misconfiguration**: {{csrf.disable()}} should only be used for stateless APIs using Bearer tokens; disabling CSRF on a cookie-session app opens a CSRF hole (see security-006).

| Situation | Suitable chain | Note |
|---|---|---|
| REST API for mobile/SPA using JWT | {{STATELESS}}, disable CSRF, {{oauth2ResourceServer}} | Do not create {{HttpSession}} |
| Server-rendered web admin | {{formLogin}}, enable CSRF, session | CSRF token required for POST/PUT/DELETE |
| Public endpoints (health, docs) | {{permitAll()}}, separate chain with high {{@Order}} | Keep {{securityMatcher}} narrow to avoid unintended exposure |

> Senior tip: When debugging Spring Security, do not guess — read the {{FilterChainProxy}} log. It prints the actual filter chain for a request (e.g. "Securing GET /api/orders" plus a list of 12 filters). If an endpoint you think is open still returns 401, 90% of the time it is a chain/matcher mismatch or {{AuthorizationFilter}} blocking; the remaining 10% is {{CsrfFilter}} silently rejecting (missing token). Always write integration tests with {{@SpringBootTest}} + {{MockMvc}} for each authorization rule: test "right role -> 200, wrong role -> 403, not logged in -> 401" — this is the safety net when refactoring config.`,
    follow: [
      'How do ExceptionTranslationFilter handle AuthenticationException and AccessDeniedException differently? When is 401 returned vs 403?',
      'If you add a custom filter that verifies request signatures, would you insert it before or after BearerTokenAuthenticationFilter? Why?',
      'SecurityContextHolder uses ThreadLocal by default — what problem does this cause with @Async or virtual threads, and how does Spring solve it?'
    ],
  },
  'security-034': {
    q: 'How does JWT work at the mechanism level? Compare RS256 and HS256 (who holds the key, when to use). Explain alg=none and algorithm confusion attacks. How are kid and JWKS rotation used? How do you revoke a JWT when it is inherently stateless?',
    a: `**Summary:** JWT (JSON Web Token) is a self-contained string of claims **digitally signed** so the receiver can check integrity without asking the issuing server — like a seal on paper: anyone can read the content, but only the holder of the real seal can stamp it. **HS256** uses one shared secret (fast, simple) while **RS256** uses a key pair (service only needs the public key to verify). Two classic vulnerabilities are **alg=none** (accepting unsigned tokens) and **algorithm confusion** (forcing the server to use the public key as an HMAC key). Revoking a stateless JWT cannot "delete" an old token, so use **short-lived access tokens + rotating refresh tokens stored in DB + reuse detection**.

### 1. JWT structure and how the signature works
A JWT has 3 parts joined by dots: {{header.payload.signature}}, each part Base64URL-encoded (readable, **not** secret encryption).

~~~text
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS0yMDI2In0   <- header (JSON)
.
eyJzdWIiOiJ1c2VyLTkxIiwiZXhwIjoxNzYyNDYwMDAwLCJzY29wZSI6Im9yZGVyOnJlYWQifQ  <- payload (claims)
.
<signature bytes base64url>   <- signature

Decoded header:  {"alg":"RS256","typ":"JWT","kid":"key-2026"}
Decoded payload: {"sub":"user-91","exp":1762460000,"scope":"order:read"}
~~~
- **Signature** = function(header + "." + payload, key). The verifier recomputes the signature with the key and compares: a match means the content was **not modified** after signing, and (with RS256) only the private-key holder could have signed.
- **exp** (expiration, Unix seconds), **iat** (issued at), **iss** (issuer), **aud** (audience) are standard claims — the library must validate them, do not skip.
- The payload is **readable by anyone** (just Base64). Do not put passwords, card numbers, or secrets in a JWT. To hide content use JWE (encryption), which is rarer and more complex.

### 2. RS256 vs HS256 — difference in key custody
| Criterion | HS256 (HMAC + SHA-256) | RS256 (RSA + SHA-256) |
|---|---|---|
| Key type | **Symmetric**: one shared secret | **Asymmetric**: private key (sign) + public key (verify) pair |
| Who signs | Whoever holds the secret | Only the issuer holds the private key |
| Who verifies | Must have the **same secret** -> whoever verifies can also forge | Only needs the public key (public) -> can verify but cannot forge |
| Key leak | One service leaks the secret -> attacker can sign tokens for the whole system | Public key leak is harmless; only private key leak is dangerous |
| Performance | Faster (HMAC is cheap) | Slower (RSA verify costs more, still acceptable) |
| When to use | Monolith or one issuer verifying itself, trusted internal environment | Many microservices verify tokens, third-party IdP (Keycloak/Auth0) issues them |

~~~java
// Example verifying a JWT with jjwt (Java). ALWAYS specify the expected algorithm,
// do NOT trust the "alg" field sent by the client.
import io.jsonwebtoken.Jwts;
import java.security.interfaces.RSAPublicKey;

public Claims verify(String token, RSAPublicKey publicKey) {
    return Jwts.parser()
        .verifyWith(publicKey)          // only accepts the matching key/algorithm
        .requireIssuer("https://auth.mybank.vn")
        .requireAudience("payment-api")
        .build()
        .parseSignedClaims(token)       // rejects if signature wrong or exp expired
        .getPayload();
}
~~~

### 3. Two classic attacks on the {{alg}} field
- **alg=none**: attacker changes the header to {{"alg":"none"}} and drops the signature. Older/loose libraries see "no signature needed" and accept the token -> attacker fabricates a payload (e.g. {{"sub":"admin"}}). **Defense**: use a modern library, call the parse API **with verification** ({{parseSignedClaims}} not {{parse}}), and configure rejection of {{none}}. JJWT >= 0.12 and modern Nimbus JOSE are safer by default, but do not rely on defaults — test.
- **Algorithm confusion (HS256/RS256 mix-up)**: server expects RS256 and holds the public key (usually public). Attacker takes that public key, changes the header to {{HS256}}, then **signs the token with HMAC using the public key as the secret**. If the server picks the algorithm from the header and passes the "key" into a generic verify function, it verifies the HMAC with the public key -> match! **Defense**: **never** read {{alg}} from the token to choose how to verify; hard-code the expected algorithm on the server ({{verifyWith}} for RSA, {{verifyWith(secretKey)}} for HMAC, do not mix).

~~~text
Algorithm confusion (summary):
  Server: verify(token, key=PUBLIC_KEY) but trusts alg from header
  Attacker: header.alg = HS256, signature = HMAC(PUBLIC_KEY, header.payload)
  Result: HMAC verified with PUBLIC_KEY -> MATCH -> forged token accepted
~~~

### 4. kid and JWKS rotation (key rotation without downtime)
- **kid** (Key ID): the header contains {{"kid":"key-2026-05"}} so the verifier knows which public key to use, because the issuer may have several keys at once (old not-yet-expired key + new key).
- **JWKS** (JSON Web Key Set): the issuer's public endpoint (e.g. {{https://auth.mybank.vn/.well-known/jwks.json}}) returns the list of public keys. The resource server fetches JWKS, caches it, and selects the key by {{kid}}.
- **Safe rotation**: (1) issuer generates a new key pair (new kid), starts signing new tokens with the new key; (2) JWKS **still publishes both old and new keys** until every token signed with the old key has expired; (3) only then remove the old key from JWKS. Removing the old key too early rejects still-valid tokens (mass 401 errors).
- **In code**: use {{NimbusJwtDecoder.withJwkSetUri(jwksUrl).build()}} (Spring Security) — it fetches/caches JWKS and handles {{kid}}. Do not parse JWTs by hand.

### 5. Revoking JWTs (stateless but still needs revocation)
A JWT is self-contained so the service verifies **offline** — this is the advantage (no DB call per request) and also the drawback (no place to "delete" a live token). See security-023 on the revocation window. Practical approaches:
- **Short access-token TTL** (5-15 minutes): naturally shrinks the risk window. A leaked token is usable for only a few minutes.
- **Rotating refresh tokens stored in DB**: refresh token lives longer (days/weeks) but is **stateful** (store its hash in DB with {{family_id}}, {{user_id}}, {{revoked}}). Each time a refresh is used to mint a new access token: issue a new refresh token and mark the old one used. **Reuse detection**: if an old refresh token is used again -> someone is replaying a stolen token -> revoke the **whole family** (force re-login). (Detailed mechanism in security-003.)
- **Immediate revocation (when required)**: keep a denylist/allowlist by {{jti}} (JWT ID) in Redis with TTL = remaining token lifetime. Each request checks Redis — trade-off: you lose "fully stateless" but the revocation window is a few hundred ms. Use only for sensitive actions (account lock, lost device).
- **Do not bloat JWT with state**: large JWTs bloat every request header; and changing claims (role change) are not reflected until the token expires.

### 6. In production
- **Mass 401 after rotation**: JWKS cache not refreshed yet or old key removed too early. Configure JWKS cache TTL (e.g. 5 minutes) and always overlap old+new keys. Track verify-failure rate by {{kid}}.
- **Safe logging**: log {{iss}}, {{sub}}, {{kid}}, {{exp}} when debugging; **never** log the raw JWT string (it is a bearer credential — whoever has the string can use it).
- **Dangerous misconfiguration**: disabling {{exp}}/{{aud}}/{{iss}} checks "to avoid errors" -> accepts expired tokens or tokens issued for another system. Always enable all claim checks.

> Senior tip: Quick check whether your system is vulnerable to algorithm confusion: take a valid RS256 token, re-sign its payload with HS256 using the issuer's public key, and send it. If the server accepts it, you have a serious vulnerability. Write automated tests for {{alg=none}}, {{alg=HS256}} against an endpoint that expects RS256, expired {{exp}}, wrong {{aud}} — this is a cheap and effective security regression test.`,
    follow: [
      'Why should access tokens be short-lived and refresh tokens long-lived? What is the risk if reversed?',
      'How should a resource server handle a slow or 5xx JWKS endpoint so it does not cascade-fail but stays safe?',
      'How does JWE (JSON Web Encryption) differ from JWS (signed JWT), and when do you actually need JWE instead of just signing?'
    ],
  },
  'security-035': {
    q: 'Explain OAuth2 Authorization Code + PKCE step by step: what data flows where, what attacks do {{state}} and {{code_verifier}} prevent? Why was implicit flow dropped? When service A needs to call service B on behalf of a user, how does token exchange (RFC 8693) solve it?',
    a: `**Summary:** **Authorization Code + PKCE** is the standard OAuth2 flow for web/mobile: the app redirects the user to the Authorization Server's (AS) login page, the AS returns a one-time **code**, and the app exchanges the code for a token over the back-channel (server-to-server). **PKCE** ({{code_verifier}}/{{code_challenge}}) proves "the one exchanging the code is the one who requested it", preventing code theft on mobile/SPA. **Implicit flow** was dropped because it returns tokens straight to the front-channel (URL/fragment), which leak easily and cannot verify the client. **Token exchange** (RFC 8693) lets a service trade a user's token for a narrower-scoped token to call another service, avoiding passing the original token through many layers.

### 1. What problem OAuth2 solves (everyday context)
You want a ride-hailing app to read your Google Contacts **without giving the app your Google password**. OAuth2 lets you log in directly with Google (AS); Google issues the app a "ticket" (access token) with only contacts-read permission. The app never sees your password.
- **Resource Owner**: the user (you). **Client**: the ride app. **Authorization Server (AS)**: Google Accounts. **Resource Server**: Google Contacts API.
- **Access token**: ticket to the API (usually a JWT, short-lived). **Scope**: permission on the ticket (e.g. {{contacts.read}}).

### 2. Authorization Code + PKCE step by step
~~~seq
title: Authorization Code + PKCE
actors: User | App | AS | API
App -> App: generate code_verifier (random) + code_challenge = SHA256(verifier)
User -> App: click "Log in"
App -> AS: redirect /authorize?response_type=code, client_id, redirect_uri, scope, state, code_challenge(S256)
User -> AS: enter password + consent to scope
AS -> App: redirect to redirect_uri?code=abc&state=xyz (front-channel)
App -> App: verify state matches the saved value
App -> AS: POST /token (code=abc, code_verifier, redirect_uri) (back-channel)
AS -> AS: verify SHA256(code_verifier) == stored code_challenge
AS --> App: access_token + (refresh_token) + id_token
App -> API: GET /contacts (Authorization: Bearer access_token)
~~~

- **Front-channel** (via browser/redirect URL): data can leak (history, referrer, another app registering the scheme on mobile). Therefore the front-channel carries **only** the {{code}} — useless without the {{code_verifier}}.
- **Back-channel** (direct POST from app/server to AS): a direct HTTPS channel, safer, used to exchange the code for tokens.
- **{{state}}**: a random string the app generates, stores temporarily, sends to the AS, and the AS returns unchanged. The app checks {{state}} matches -> prevents **CSRF login** (attacker tricks the victim's browser into completing the flow with the attacker's code). Missing {{state}} = vulnerability.
- **PKCE ({{code_verifier}} / {{code_challenge}})**: {{code_verifier}} is a secret random string the app keeps; {{code_challenge = BASE64URL(SHA256(verifier))}} is sent when requesting the code. When exchanging the code, the app sends the {{verifier}}; the AS hashes it and compares to the challenge. An attacker who steals the {{code}} on the front-channel **has no verifier**, so the token exchange fails. PKCE started for mobile (public clients) and is now **mandatory for SPAs too** (OAuth 2.1 / best current practice).
- **redirect_uri**: the AS only redirects to a pre-registered URI (exact match). Blocks open redirects that send the code elsewhere.

### 3. Why implicit flow was dropped
Implicit flow ({{response_type=token}}) returns the **access token directly in the URL fragment** on the front-channel, skipping the code exchange.
- Token appears in browser history, proxy logs, referrer; other apps can read it (especially mobile custom schemes).
- **No way for the client to prove identity** when receiving the token: anyone intercepting the redirect gets the token.
- No safe refresh token for public clients.
- Current standards (OAuth 2.0 Security BCP, OAuth 2.1) **do not use implicit**. Replaced by Authorization Code + PKCE.

### 4. Token exchange between services (RFC 8693) — calling on behalf of a user
Problem: user calls Service A (holding the user's access token), and A needs to call Service B. If A forwards the **original token** to B, that token may have overly broad scope — violating **least privilege**, and if B is compromised the token can be abused against other systems.
**Token exchange**: A sends the original token (subject token) to the AS and requests a new token meant only for B, with only the scope B needs.

~~~text
Service A -> AS: POST /token
  grant_type=urn:ietf:params:oauth:grant-type:token-exchange
  subject_token=<user_access_token>
  subject_token_type=urn:ietf:params:oauth:token-type:access_token
  audience=service-b
  scope=orders:read

AS checks: is the original token still valid? Is A allowed to exchange? Is requested scope <= original scope?
AS -> Service A: new_access_token (aud=service-b, scope=orders:read, short expiry)

Service A -> Service B: Authorization: Bearer <new_access_token>
~~~
- The new token is **narrow in scope, audience-specific, short-lived**. Even if B is compromised, that token cannot be used to call C.
- Unlike **client credentials** (service calls service under its own identity, no user). Token exchange preserves the user identity ({{sub}}) across the call chain — needed for audit "which user ordered this".

### 5. In production
- **"redirect_uri_mismatch"**: the sent URI does not match the registered one **character by character** (different scheme, port, trailing slash). Register exact match, no wildcards.
- **Storing state/PKCE verifier on SPA**: use {{sessionStorage}} or memory; verify and delete immediately after use (one-time).
- **Refresh tokens on SPA**: consider Backend-for-Frontend (BFF) keeping tokens server-side and issuing a session cookie to the SPA, or refresh-token rotation + reuse detection.
- **Token exchange** requires AS support (Keycloak supports it; configure policy tightly). Log {{sub}}, {{aud}}, {{scope}} of issued tokens for tracing.
- **Do not write your own OAuth2 flow**: use standard libraries (Spring Security OAuth2 Client, AppAuth). Small mistakes in {{state}}/PKCE/redirect are real vulnerabilities.

| Flow / mechanism | When to use | Key point |
|---|---|---|
| Authorization Code + PKCE | Web, SPA, mobile (most apps with a user) | Code + PKCE, with {{state}}, replaces implicit |
| Client Credentials | Service-to-service, no user | Machine identity |
| Device Code | Devices without browser/keyboard (TV) | User confirms on another device |
| Token Exchange (RFC 8693) | Calling a service on behalf of a user, narrowing scope | Keeps {{sub}}, changes {{aud}}/{{scope}} |

> Senior tip: OAuth2 review checklist: (1) random {{state}} and verification, (2) PKCE (S256), (3) {{redirect_uri}} exact match, (4) short-lived access tokens, (5) no implicit flow. If you see a token in a URL fragment, that smells like old implicit flow. And remember: OAuth2 is **authorization**, while user authentication is **OpenID Connect** (OIDC) adding an {{id_token}} — do not use an access token as proof of login unless you verify the right audience/issuer.`,
    follow: [
      'Distinguish OAuth2 and OpenID Connect: how do {{access_token}} and {{id_token}} differ, and what is the common mistake of using an access token to identify the user?',
      'If an attacker steals the authorization code but has no {{code_verifier}}, at which step does the attack fail? What if the AS does not require PKCE?',
      'What does token exchange contribute to the audit log in an A -> B -> C call chain compared with passing the user\'s original token?'
    ],
  },
  'security-036': {
    q: 'Storing passwords safely: how do bcrypt and Argon2id work internally (hash structure, cost factor, memory/time/parallelism parameters)? How does pepper differ from salt? How does DelegatingPasswordEncoder in Spring Security use prefixes and support gradual hash upgrades (rehash on login)?',
    a: `**Summary:** Passwords are **never encrypted** to be reversed; they must be **hashed with a slow, dedicated function** (password hashing). **bcrypt** uses the Blowfish algorithm with a **cost factor** (slowing by powers of 2) and embeds the salt into the hash string; **Argon2id** (recommended today) also consumes **memory** (memory-hard) so GPUs/ASICs are much harder to use. **Salt** is a random value per password (defeats rainbow tables), stored publicly alongside the hash; **pepper** is a shared secret stored separately from the DB (e.g. in KMS). **DelegatingPasswordEncoder** prepends a prefix (such as the {{bcrypt}} prefix in the stored value) to identify the algorithm and supports **gradual upgrades**: when a user logs in successfully with an old hash, the system re-hashes with the new algorithm and updates.

### 1. Background terms
- **Hash (hash function)**: a one-way function turning input into a fixed string; cannot be reversed to the input. SHA-256 is a **fast** hash — computers try billions of passwords/sec -> unsuitable for storing passwords.
- **Brute-force / dictionary attack**: attacker with a leaked hash DB tries passwords one by one, re-hashing and matching. The slower the hash, the costlier the attack.
- **Rainbow table**: a precomputed "password -> hash" table for fast, unsalted hashes. Random salt makes it useless.
- **GPU/ASIC**: hardware built for massive parallelism. A CPU-only hash (bcrypt) is still sped up by GPUs; a RAM-heavy hash (Argon2) forces GPUs to have large RAM -> much more expensive.

### 2. bcrypt internals
bcrypt (based on Blowfish) takes password + salt + cost and loops to slow down.
- **Cost factor** (work factor), often written as rounds: bcrypt performs {{2^cost}} rounds (Blowfish key schedule). Cost 12 -> 4096 rounds; cost 13 -> 8192 rounds (double the time). Each +1 cost doubles the time.
- **128-bit salt** generated randomly for **each** password. The result is a self-contained string with everything needed to verify.

~~~text
bcrypt string structure (60 chars):
$2b$12$R9h/cIPz0gi.URNNX3kh2OePQS7f/4p3aQJm1c6x2ZyHk9YwS3m1a
 │  │  │                        │
 │  │  └─ salt (22 Base64 chars, 128-bit)  └─ hash (31 chars)
 │  └─ cost = 12  (2^12 rounds)
 └─ version (2b is the modern standard)

Verify: take cost + salt from the stored string -> re-hash the user's entered password with the same cost+salt -> constant-time compare.
~~~

~~~java
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

PasswordEncoder encoder = new BCryptPasswordEncoder(12); // cost 12
String stored = encoder.encode(rawPassword);   // random salt + hash
// Store 'stored' in DB (VARCHAR(60) or wider)

boolean ok = encoder.matches(rawPassword, stored); // verify: splits cost+salt itself
~~~

- **bcrypt limit**: input is effectively truncated at 72 bytes (not 72 Unicode characters) — very long passwords lose their tail. Some systems pre-hash with SHA-256 before bcrypt to avoid this (must be done carefully, using standard libraries).

### 3. Argon2id internals (OWASP recommendation today)
Argon2 won the Password Hashing Competition (2015) and has 3 variants: Argon2d (anti-GPU, side-channel prone), Argon2i (anti-side-channel), **Argon2id** (hybrid, the default to use).
- **Three parameters** control cost:
  - {{memory}} (m): RAM used (KiB). Example 65536 = 64 MiB. This is the strength against GPU/ASIC.
  - {{iterations/time}} (t): number of passes over memory.
  - {{parallelism}} (p): number of lanes/threads. Raising p does not reduce security if m is large enough, but must fit the server CPU.
- The hash string also embeds parameters + salt: {{$argon2id$v=19$m=65536,t=3,p=1$<salt>$<hash>}}.

~~~java
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;

// (saltLength, hashLength, parallelism, memoryKiB, iterations)
PasswordEncoder encoder = new Argon2PasswordEncoder(16, 32, 1, 65536, 3);
String stored = encoder.encode(rawPassword);
~~~

| Criterion | bcrypt | Argon2id |
|---|---|---|
| Anti-GPU/ASIC | Medium (CPU cost only) | Strong (memory-hard, large RAM) |
| Parameters | cost factor (one number) | memory, time, parallelism (flexible) |
| Input limit | 72 bytes effective | No practical limit |
| Availability | Very wide (all languages/libs) | Wide, needs native lib (BouncyCastle/JNA) |
| Recommendation | Acceptable if cost high enough | **Preferred** (OWASP Password Storage Cheat Sheet) |

### 4. Salt vs Pepper
- **Salt**: random, **different for each password**, stored **alongside** the hash in the DB (not secret). Purpose: two users with password "123456" get different hashes; defeats rainbow tables. bcrypt/Argon2 generate salt themselves — do not invent your own.
- **Pepper**: a **shared secret**, stored **separate from the DB** (env var loaded from KMS/Vault, HSM). Purpose: if attacker only leaks the DB (SQL injection, leaked backup) but not the pepper, hashes are harder to crack. Pepper **does not replace** slow hashing or salt.
- Safe pepper usage: {{hash(pepper + password)}} or HMAC before feeding bcrypt/Argon2; rotating pepper needs a wrapping mechanism (encrypt hash with a KMS key) or accept gradual rehash.

### 5. DelegatingPasswordEncoder and gradual hash upgrades
A long-lived system: yesterday used bcrypt cost 10, today wants Argon2id. You cannot re-hash millions of passwords because you **do not know the plaintext**. Solution: store the algorithm prefix, and **re-hash when the user logs in** (when you have the plaintext in hand).
- Stored format: a {{bcrypt}} prefix followed by {{\$2b\$12\$...}} or an {{argon2id}} prefix followed by {{\$argon2id\$v=19\$...}}. {{DelegatingPasswordEncoder}} reads the prefix to pick the verifying encoder.

~~~java
@Bean
public PasswordEncoder passwordEncoder() {
    String idForEncode = "argon2id"; // NEW hashes use Argon2id
    Map<String, PasswordEncoder> encoders = Map.of(
        "argon2id", new Argon2PasswordEncoder(16, 32, 1, 65536, 3),
        "bcrypt", new BCryptPasswordEncoder(12)
    );
    return new DelegatingPasswordEncoder(idForEncode, encoders);
}

// Gradual upgrade on successful login:
public void login(String username, String rawPassword) {
    User u = userRepo.findByUsername(username);
    if (!passwordEncoder.matches(rawPassword, u.getPasswordHash())) throw new BadCredentials();
    // matches() true -> check whether upgrade is needed (old hash, low cost)?
    if (passwordEncoder.upgradeEncoding(u.getPasswordHash())) {
        u.setPasswordHash(passwordEncoder.encode(rawPassword)); // rehash with argon2id
        userRepo.save(u);
    }
}
~~~

### 6. In production
- **Choosing parameters**: target ~**250-500 ms** per verify on real server hardware (slow enough for attackers, fast enough for users). Measure on production-like hardware, not the dev laptop. As CPUs get faster over the years, raise cost/iterations.
- **Symptom slow login / CPU spike**: cost too high or Argon2 memory too large causes RAM contention under concurrent logins. Limit concurrency (rate limit the login endpoint), balance parameters (e.g. lower parallelism, moderate memory).
- **Migration**: set {{idForEncode}} to the new algorithm; keep old encoders in the map to verify old hashes. Track the share of users still on old hashes (count prefixes) — users who rarely log in stay on old hashes; you may force a password change after a cutoff.
- **DB column**: use {{VARCHAR(255)}} (Argon2 strings are longer than bcrypt's 60 chars). Do not truncate the hash.
- **Do not invent your own**: do not hand-write "SHA-256(password + salt)" — it lacks slowness and is easy to get wrong (non-constant-time compare -> timing attack). Use Spring Security's {{PasswordEncoder}}.

> Senior tip: Do not pick parameters by feel. Write a small benchmark running on a production-like container: try Argon2id (m=64MiB,t=3,p=1) and increase until {{matches()}} takes ~300 ms, then lock that in. Store the parameters in config and schedule a review every **6-12 months** (hardware changes, threat model changes). And always enable rate limiting + temporary lockout after N failed attempts on the login endpoint — slow hashing protects a leaked DB, while rate limiting protects the live endpoint.`,
    follow: [
      'Why do two users with the same password end up with different hash strings in the DB when using bcrypt? What happens if you use a single fixed salt?',
      'If the pepper leaks (attacker has both DB and pepper), how do you respond, and why does "encrypt the hash with a KMS key" make pepper rotation easier?',
      'Compare constant-time comparison with ordinary string comparison when verifying hashes/tokens: what difference does a timing attack exploit?'
    ],
  },
});
