/*
 * English translation of js/data/q-security.js — task T188. Format: js/core/i18n.js (content overlay).
 * ids: security-001 security-002 security-003 security-004 security-005 security-006 security-007
 */
App.i18n.content({
  'security-001': {
    q: `Apply OWASP Top 10 to a Java Spring Boot backend: name the 3 most common vulnerabilities and how to block them at the code/configuration level.`,
    a: `**Summary:** The three most common vulnerabilities in Java backends are **Broken Access Control** (IDOR when viewing someone else's resources), **Cryptographic Failures** (storing passwords wrongly, using weak algorithms), and **Injection** (SQL/NoSQL/LDAP injection from string concatenation). Each vulnerability has specific mitigations at the code level and in Spring configuration.

### 1. Broken Access Control (A01:2021)
- **Real-world example**: an API
~~~text
GET /api/accounts/{accountId}/transactions
~~~
returns statements. An attacker swaps {{accountId}} for another account and sees that data — **IDOR (Insecure Direct Object Reference)**.
- **How to block**:
  - **Per-object authorization check**: in the service, verify {{accountRepository.existsByIdAndUserId(accountId, currentUserId)}} before returning data.
  - Use Spring Security **{{@PreAuthorize("@accountSecurity.canAccess(#accountId)")}}** or a custom {{PermissionEvaluator}}.
  - Do not trust the {{principal}} from the token without validating ownership.

~~~java
@Service
@RequiredArgsConstructor
public class TransactionService {
    private final AccountRepository accountRepo;
    private final TransactionRepository txnRepo;

    public Page<Transaction> getTransactions(Long accountId, Pageable pageable) {
        // OWNERSHIP CHECK — blocks IDOR
        if (!accountRepo.existsByIdAndUserId(accountId, SecurityUtil.getCurrentUserId())) {
            throw new NotFoundException("ACCOUNT_NOT_FOUND", "Account does not exist");
        }
        return txnRepo.findByAccountId(accountId, pageable);
    }
}
~~~

### 2. Cryptographic Failures (A02:2021)
- **Real-world example**: storing passwords with {{SHA-256}} without a salt, or encrypting card numbers with {{AES-ECB}}. Data leaks once the DB is breached.
- **How to block**:
  - **Passwords**: use a slow hash function designed for passwords: **Argon2id** (memory-hard), **bcrypt** (cost ≥ 10, commonly 12), or PBKDF2 when FIPS compliance is required. Spring Security ships {{BCryptPasswordEncoder}} and {{Argon2PasswordEncoder}}.
  - **Sensitive data that must be decrypted** (card numbers, citizen ID): use **AES-GCM** (authenticated encryption) with a 256-bit key and a fresh random 12-byte IV every time. Manage keys with **HashiCorp Vault**, AWS KMS, or Spring Cloud Config + encryption.
  - **Do not** implement crypto yourself; use standard libraries ({{javax.crypto}}, Bouncy Castle).

~~~java
// ✅ CORRECT: hash the password
@Bean PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12); // cost 12: a few hundred ms per hash depending on CPU — benchmark on real hardware
}

// ✅ CORRECT: AES-GCM for data that must be decrypted
public String encrypt(String plain, SecretKey key) throws GeneralSecurityException {
    byte[] iv = new byte[12]; new SecureRandom().nextBytes(iv);
    Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
    c.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));
    byte[] ct = c.doFinal(plain.getBytes(StandardCharsets.UTF_8));
    return Base64.getEncoder().encodeToString(ByteBuffer.allocate(iv.length + ct.length).put(iv).put(ct).array());
}
~~~

### 3. Injection (A03:2021)
- **SQL Injection**: use {{JdbcTemplate}} with a {{?}} placeholder, **never** concatenate. JPQL/HQL is also injectable when you concat: {{entityManager.createQuery("SELECT u FROM User u WHERE u.name = '" + name + "'")}}.
- **Dynamic ORDER BY**: a placeholder cannot be used here; you must **whitelist** the allowed columns.
- **NoSQL/LDAP injection**: Spring Data MongoDB {{@Query}} with a {{?0}} placeholder; on LDAP, build filters with {{LdapQueryBuilder}} / {{EqualsFilter}} (encodes special characters for you) or {{LdapEncoder.filterEncode()}}, never by concatenating the filter string.

| Vector | Wrong (concatenation) | Right (parameterized) |
|---|---|---|
| SQL | {{jdbc.query("SELECT * FROM t WHERE c = '" + v + "'")}} | {{jdbc.query("SELECT * FROM t WHERE c = ?", v)}} |
| JPQL | {{em.createQuery("SELECT u FROM User u WHERE u.email = '" + email + "'")}} | {{em.createQuery("SELECT u FROM User u WHERE u.email = :email").setParameter("email", email)}} |
| ORDER BY | {{repo.findAll(Sort.by(userInput))}} | {{repo.findAll(Sort.by(whitelist.contains(userInput) ? userInput : "id"))}} |

> Senior tip: in banking code reviews, **any** string concatenation into a query/JPQL is a P1 finding. Use static analysis with taint analysis: SpotBugs + the **Find Security Bugs** plugin (rules {{SQL_INJECTION_JDBC}}, {{SQL_INJECTION_JPA}}), SonarQube rule {{java:S3649}} (SQL injection), or Semgrep/CodeQL, and block the merge whenever a finding appears.

### Summary table for blocking OWASP Top 10 in Spring Boot
| Order | Vulnerability | Main mitigation |
|---|---|---|
| A01 | Broken Access Control | {{@PreAuthorize}}, ownership check in the service, deny-by-default |
| A02 | Cryptographic Failures | bcrypt/Argon2 for passwords, AES-GCM for data, key rotation, Vault/KMS |
| A03 | Injection | Parameterized queries, whitelist ORDER BY, input validation |
| A04 | Insecure Design | Threat modeling, secure design patterns, rate limiting, audit logging |
| A05 | Security Misconfiguration | Spring Boot Actuator lockdown, disable debug, security headers |
| A06 | Vulnerable Components | SCA (OWASP Dependency Check), SBOM, Dependabot, patch SLA |
| A07 | Identification & Auth Failures | MFA, rate-limited logins, breached-password checks, session management |
| A08 | Software & Data Integrity Failures | Signed artifacts, CI/CD integrity, reproducible builds |
| A09 | Logging & Monitoring Failures | Structured logs (JSON), correlation ID, alerting on 4xx/5xx patterns |
| A10 | SSRF | Whitelist outbound URLs, deny localhost/private IPs, timeouts |

`,
    follow: [
      `When should AES-GCM be used instead of bcrypt, and the other way around?`,
      `How do Spring Security {{@PreAuthorize}} with SpEL and a custom {{PermissionEvaluator}} differ in performance and extensibility?`,
      `How can hidden SQL injection be detected automatically in a large codebase (over 500k LOC)?`
    ]
  },
  'security-002': {
    q: `SQL injection in Java: how is PreparedStatement safe? How is concatenated JPQL/HQL exploited? How should dynamic ORDER BY be handled?`,
    a: `**Summary:** {{PreparedStatement}} is safe because it **separates code and data** — the query is parsed, compiled and optimized **before** parameters are bound, so user input is never interpreted as SQL. Concatenated JPQL/HQL is still injectable because Hibernate parses the final string. Dynamic ORDER BY cannot use a placeholder → you must **whitelist** columns.

### Why PreparedStatement is safe
1. **Prepare phase**: the driver sends {{SELECT * FROM users WHERE email = ?}} to the DB. The DB **parses, resolves tables/columns, builds the execution plan** — it has no idea what the {{?}} values will be.
2. **Execute phase**: only the parameter values get sent (binary protocol). The DB **does not re-parse** the SQL; it just plugs the values into the existing plan.
3. Result: input {{' OR '1'='1}} is treated as **literal data** and cannot change the structure of the statement.

> Note: not every driver prepares on the server. MySQL Connector/J defaults to {{useServerPrepStmts=false}} — the driver escapes and substitutes values into the SQL text on the client side; the PostgreSQL JDBC driver sends parameters separately over the extended protocol and only uses a named server-side statement after {{prepareThreshold}} (default 5) executions. Either way the values are handled as data, so it stays safe.

~~~java
// ✅ SAFE — PreparedStatement
String sql = "SELECT * FROM users WHERE email = ? AND status = ?";
try (PreparedStatement ps = conn.prepareStatement(sql)) {
    ps.setString(1, email);      // driver escapes automatically, or binary bind
    ps.setString(2, "ACTIVE");
    ResultSet rs = ps.executeQuery();
}

// ✅ SAFE — Spring NamedParameterJdbcTemplate
namedJdbc.query("SELECT * FROM users WHERE email = :email", Map.of("email", email), mapper);
~~~

### JPQL/HQL Injection — the ORM trap
Many developers believe "the ORM makes it safe" — **WRONG**. Hibernate is only safe when you use a **named parameter** ({{:param}}) or a **positional parameter** ({{?1}}).

~~~java
// ❌ DANGEROUS — JPQL injection
String jpql = "SELECT u FROM User u WHERE u.email = '" + email + "'";
List<User> users = em.createQuery(jpql, User.class).getResultList();
// Input: x' OR '1'='1  →  ... WHERE u.email = 'x' OR '1'='1'  → returns every user

// ✅ SAFE — named parameter
List<User> users = em.createQuery("SELECT u FROM User u WHERE u.email = :email", User.class)
                     .setParameter("email", email)
                     .getResultList();

// ✅ SAFE — CriteriaBuilder (type-safe)
CriteriaBuilder cb = em.getCriteriaBuilder();
CriteriaQuery<User> cq = cb.createQuery(User.class);
Root<User> u = cq.from(User.class);
cq.select(u).where(cb.equal(u.get("email"), email));
List<User> users = em.createQuery(cq).getResultList();
~~~

**Real exploitation**: an attacker sends {{email = "admin' OR '1'='1"}} → bypasses the filter condition, or uses subqueries to exfiltrate data (blind injection). JPQL/HQL does not allow multi-statements or SQL comments, so {{'; DROP TABLE users; --}} only works with native query/JDBC concatenation when the driver allows multi-statements.

### Dynamic ORDER BY — placeholders do not apply
Placeholders can only replace **values**, not **identifiers/keywords**: column names in {{ORDER BY}}, {{ASC/DESC}} direction, table/column names. You must validate with a **whitelist** in the application. ({{LIMIT ?}}/{{OFFSET ?}} can be bound on PostgreSQL and MySQL — still parse into {{int}} and cap the max.)

~~~java
// ❌ WRONG — string concatenation
String sql = "SELECT * FROM transactions ORDER BY " + sortColumn + " " + sortDir;

// ✅ RIGHT — whitelist
private static final Set<String> ALLOWED_COLUMNS = Set.of("id", "amount", "created_at", "status");
private static final Set<String> ALLOWED_DIRS = Set.of("ASC", "DESC");

public List<Transaction> findAll(String sortColumn, String sortDir) {
    String col = ALLOWED_COLUMNS.contains(sortColumn) ? sortColumn : "created_at";
    String dir = ALLOWED_DIRS.contains(sortDir.toUpperCase()) ? sortDir.toUpperCase() : "DESC";
    return jdbc.query("SELECT * FROM transactions ORDER BY " + col + " " + dir, mapper);
}

// Spring Data JPA — safe Sort
Sort sort = Sort.by(Sort.Direction.fromString(dir), col);
return repo.findAll(sort);
~~~

### Native queries in Spring Data JPA
{{@Query(value = "SELECT * FROM t WHERE c = ?1", nativeQuery = true)}} — **safe** because it uses a positional parameter like PreparedStatement.
The annotation value must be a compile-time constant, so runtime variables cannot be concatenated into {{@Query}}; the real risk lies in custom repositories using {{em.createNativeQuery("..." + param)}} or {{JdbcTemplate}} string concatenation.

### Why is the ORM not "safe by itself"?
- The ORM generates SQL from the string you provide. If that string contains uncontrolled input, the generated SQL contains it too.
- {{entityManager.createNativeQuery("SELECT * FROM users WHERE name = '" + name + "'")}} is equivalent to plain SQL concatenation.
- {{CriteriaBuilder}} and {{Specification}} are safe because they build an AST (Abstract Syntax Tree), not a string.

### Production pitfalls
- **Logging**: log the SQL along with parameters ({{logging.level.org.hibernate.SQL=DEBUG}}, Hibernate 6: {{logging.level.org.hibernate.orm.jdbc.bind=TRACE}}) — **do not enable parameter-value logging in production** when PII/credentials are involved.
- **Batch insert**: {{JdbcTemplate.batchUpdate(sql, batchArgs)}} — each {{batchArgs[i]}} is an array of parameters, safe.
- **Stored procedure**: {{CallableStatement}} with {{?}} placeholders is safe too.

> Senior tip: never return SQL error messages or stack traces to the client (leaks the schema, enables error-based injection) — use a shared error handler. In CI, run SpotBugs + Find Security Bugs (rules {{SQL_INJECTION_JDBC}}, {{SQL_INJECTION_JPA}}) and the SonarQube rule {{java:S3649}}. Restrict the app's DB account to least privilege (no DDL) to limit the blast radius. For legacy code building queries with {{StringBuilder}}, refactor towards {{CriteriaBuilder}} or {{jOOQ}} (type-safe SQL builder).`,
    follow: [
      `Why can {{PreparedStatement}} be slower than {{Statement}} on the first call but faster on subsequent ones?`,
      `Is a native query with {{LIMIT ? OFFSET ?}} safe? Why?`,
      `How do you protect an application from second-order SQL injection (malicious data stored in the DB, later used in another query)?`
    ]
  },
  'security-003': {
    q: `JWT: 3-part structure, HS256 vs RS256 — which to use when? Which claims are mandatory to validate? How to revoke tokens and rotate refresh tokens?`,
    a: `**Summary:** a JWT is **Header.Payload.Signature**. Use **RS256** (asymmetric) for distributed systems/microservices — the public key verifies, the private key signs; **HS256** (symmetric) is only for simple monoliths. Mandatory validations: {{exp}}, {{nbf}}, {{iat}}, {{iss}}, {{aud}}, {{sub}}. Token revocation: use a **denylist (blocklist)** in Redis with TTL = {{exp - now}}, or a **token version** in the DB. Refresh token rotation: each time an old refresh token is used → revoke it and issue a new pair (access + refresh); on reuse detection → revoke the entire chain.

### JWT structure
- **Header**:
~~~json
{"alg":"RS256","typ":"JWT"}
~~~
— base64url encoded.
- **Payload (claims)**: {{sub}} (subject/userId), {{exp}} (expiry Unix timestamp), {{iat}} (issued at), {{iss}} (issuer), {{aud}} (audience), {{jti}} (JWT ID), custom claims ({{roles}}, {{permissions}}, {{token_version}}).
- **Signature**: {{base64url(header) + "." + base64url(payload)}} signed with the private key (RS256) or the secret (HS256).

### HS256 vs RS256 — which one to choose?
| Criterion | HS256 (HMAC-SHA256) | RS256 (RSA-SHA256) |
|---|---|---|
| Key | Shared secret (used both to sign & verify) | Private key signs, public key verifies |
| Key distribution | Hard: every service needs the secret | Easy: the public key is public, JWKS endpoint |
| Key rotation | Complicated (the secret must be synced) | Easy: add the new key to JWKS, {{kid}} in the header |
| Performance | Very fast (HMAC) | RSA signing is much slower; verification fairly fast |
| Use case | Monolith, single service, internal API | Microservices, B2B, OIDC provider, multi-tenant |

> **Prefer RS256** for any system that may scale into microservices. HS256 is only acceptable for a small prototype/monolith, and do not share the secret over the network.

### Mandatory claim validation (Spring Security / Nimbus JOSE)
~~~java
NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
// By default only signature + exp/nbf are checked (JwtTimestampValidator, clock skew 60s).
// iss: use createDefaultWithIssuer; aud: you must add your own validator.
OAuth2TokenValidator<Jwt> audience = jwt -> jwt.getAudience().contains("my-api")
    ? OAuth2TokenValidatorResult.success()
    : OAuth2TokenValidatorResult.failure(
          new OAuth2Error("invalid_token", "Invalid audience", null));
decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
    JwtValidators.createDefaultWithIssuer(issuer), audience));
~~~
Spring Boot 3.x: declaring {{spring.security.oauth2.resourceserver.jwt.issuer-uri}} and {{...jwt.audiences}} (Boot 3.1+) is enough to get iss/aud validators. Checking {{token_version}} (see below) is a separate validator that reads the user's version from the cache.

### Token revocation
1. **Short-lived access token** (5-15 minutes) — shrinks the attack window, no active revocation needed.
2. **Denylist (blocklist) in Redis**: store {{jti}} with TTL = {{exp - now}}. Verify signature + {{exp}} **first**, then look up the denylist by {{jti}} (do not trust {{jti}} from an unverified token).
3. **Token version in the DB**: the user table has a {{token_version}} column (int). Every password change/lost device → {{token_version++}}. The JWT carries the {{token_version}} at issuance time. Validation: compare {{jwt.token_version == user.token_version}}.
4. **Opaque token**: the access token is a random string, introspected via {{/oauth2/introspect}} — instant revocation but higher latency.

### Refresh Token Rotation (RTR) — RFC 9700 (OAuth 2.0 Security BCP) / OAuth 2.1
- Access token: 5-15 min. Refresh token: 7-30 days, **one-time use**.
- Flow: the client sends the refresh token → the server **verifies and revokes the old refresh token** → issues a **new pair** (new access + refresh).
- **Reuse detection**: if the same refresh token is used a second time → **revoke the user's entire token chain** (assume the token was stolen), force logout on all devices.
- Store the **SHA-256** of the refresh token in the DB, never the plaintext (the token is a ≥ 256-bit random string so bcrypt is unnecessary; bcrypt's random salt would make lookup by hash impossible). Keep {{device_id}}, {{ip}}, {{user_agent}} for auditing.

~~~java
@Transactional
public TokenPair refresh(RefreshRequest req) {
    RefreshToken stored = refreshRepo.findByTokenHashForUpdate(sha256(req.refreshToken()))
        .orElseThrow(() -> new InvalidTokenException("Invalid refresh token"));
    // Reuse detection: the token was already rotated yet it is being presented again
    if (stored.isRevoked()) {
        revokeAllUserTokens(stored.getUserId()); // revoke the whole chain, force logout
        throw new InvalidTokenException("Token reuse detected");
    }
    if (stored.getExpiresAt().isBefore(Instant.now())) {
        throw new InvalidTokenException("Refresh token expired");
    }
    stored.setRevoked(true); // one-time use
    refreshRepo.save(stored);
    return issueNewTokenPair(stored.getUserId(), req.deviceId());
}
~~~

> Senior tip: **always use RS256 + JWKS** (Spring Boot: {{spring.security.oauth2.resourceserver.jwt.jwk-set-uri}}). Access token 5-10 minutes, refresh token 7 days + rotation. Put {{jti}} into a Redis denylist for instant logout. NEVER skip {{exp}}/{{iss}}/{{aud}} validation, and **pin the accepted algorithm** (do not trust {{alg}} from the header). For banking: even shorter TTLs, plus step-up/MFA for sensitive transactions.`,
    follow: [
      `What is algorithm confusion (RS256 → HS256 using the public key as the secret, {{alg=none}}) and how do you prevent it?`,
      `What is the {{kid}} (Key ID) in the JWT header used for during key rotation?`,
      `Compare opaque tokens vs JWTs for the access token: real-world pros and cons?`
    ]
  },
  'security-004': {
    q: `OAuth2/OIDC: Authorization Code + PKCE, Client Credentials — which flow for SPA, mobile, service-to-service? Why has the Implicit flow been deprecated?`,
    a: `**Summary:** **Authorization Code + PKCE** is the standard for **SPA and mobile apps** (public clients). **Client Credentials** is for **service-to-service** (confidential client, no user). **Implicit flow** is deprecated because the token is returned in the URL fragment → leaked through logs, referer and history; no refresh token; prone to token injection.

### The main flows
| Flow | Client type | User involved? | Token endpoint? | Refresh token? | PKCE? |
|---|---|---|---|---|---|
| Authorization Code + PKCE | Public (SPA, mobile) | Yes | Yes | Yes | **Mandatory** |
| Client Credentials | Confidential (backend) | No | Yes | No | No |
| Device Code (RFC 8628) | IoT, TV | Yes (via another device) | Yes | Yes | N/A |
| Resource Owner Password | Legacy migration only — removed in OAuth 2.1, RFC 9700: MUST NOT | Yes | Yes | Yes | No |

> OAuth 2.1 / RFC 9700 recommends PKCE for **every** client using Authorization Code, including confidential clients (web backends), not just SPA/mobile.

### Authorization Code + PKCE (RFC 7636) — SPA & Mobile
1. The app generates {{code_verifier}} (43-128 random chars) → {{code_challenge = BASE64URL(SHA256(code_verifier))}}.
2. Redirect the user: {{/authorize?response_type=code&client_id=...&code_challenge=...&code_challenge_method=S256&redirect_uri=...&state=...}}.
3. User login/consent → the auth server redirects to {{redirect_uri?code=...&state=...}}.
4. The app calls {{/token}} with {{code}}, {{code_verifier}}, {{client_id}} (a public client does **not** send {{client_secret}}).
5. The auth server verifies {{SHA256(code_verifier) == code_challenge}} → issues the access + refresh token.

**Why PKCE?** It blocks the **authorization code interception attack**: the attacker may intercept {{code}} but without {{code_verifier}} cannot exchange it for a token.

~~~java
// Spring Security 6 (backend/BFF login): enable PKCE for confidential clients too
@Bean
SecurityFilterChain filterChain(HttpSecurity http, ClientRegistrationRepository repo) throws Exception {
    DefaultOAuth2AuthorizationRequestResolver resolver =
        new DefaultOAuth2AuthorizationRequestResolver(repo, "/oauth2/authorization");
    resolver.setAuthorizationRequestCustomizer(OAuth2AuthorizationRequestCustomizers.withPkce());
    http.oauth2Login(login -> login
        .authorizationEndpoint(ep -> ep.authorizationRequestResolver(resolver)));
    return http.build();
}
// Public client (client-authentication-method=none): Spring adds PKCE automatically
~~~
For an SPA, the currently recommended pattern is **BFF (Backend-for-Frontend)**: a Spring backend acts as the confidential client that holds the tokens, while the SPA only keeps an HttpOnly session cookie — tokens never live in the JS, so XSS cannot steal them.

### Client Credentials — Service-to-Service
- The client sends {{client_id}} + {{client_secret}} (or a {{client_assertion}} JWT) to {{/token}} with {{grant_type=client_credentials}}.
- No user context → {{sub}} is the {{client_id}}. Fits: internal APIs, batch jobs, schedulers.
- **mTLS client authentication** (RFC 8705) or **private_key_jwt** (a client assertion signed with a private key, RFC 7523) is safer than a shared secret.

~~~java
// Spring (servlet): WebClient fetches and caches client_credentials tokens itself
@Bean
WebClient webClient(OAuth2AuthorizedClientManager manager) { // manager has the clientCredentials provider
    ServletOAuth2AuthorizedClientExchangeFilterFunction oauth =
        new ServletOAuth2AuthorizedClientExchangeFilterFunction(manager);
    oauth.setDefaultClientRegistrationId("internal-api");
    return WebClient.builder().apply(oauth.oauth2Configuration()).build();
}
~~~

### Implicit flow — why deprecated (RFC 9700: SHOULD NOT, removed in OAuth 2.1)
- The access token comes back in the **URL fragment** ({{#access_token=...}}) → leaks via:
  - Browser history
  - The referer header when loading third-party resources
  - Server/proxy logs
- No refresh token → either long-lived (unsafe) tokens, or the user has to log in again constantly.
- No client authentication (public client) → prone to **token injection** (an attacker plants their token into the victim app).
- Replacement: **Authorization Code + PKCE** (has refresh tokens, the code never exposes tokens).

### OIDC (OpenID Connect) — adds {{id_token}}
- {{id_token}} is a JWT carrying user information ({{sub}}, {{name}}, {{email}}, {{preferred_username}}...).
- Flow: Authorization Code + PKCE + {{scope=openid profile email}}.
- A {{nonce}} in the request → the {{id_token}} contains {{nonce}} → **blocks replay attacks**.
- {{UserInfo}} endpoint: {{/userinfo}} (needs the access token) to fetch additional claims.

> Senior tip: an SPA **never** holds a {{client_secret}}. Use PKCE + {{client_authentication_method=none}}. Mobile: use the **AppAuth** library (iOS/Android), which handles PKCE automatically. Service-to-service: prefer **mTLS + Client Credentials** or **private_key_jwt** over shared secrets. Enforce PKCE on the auth server (Spring Authorization Server: {{ClientSettings.builder().requireProofKey(true)}}; Keycloak: set the client's PKCE method to {{S256}}), and only accept redirect_uri values that match exactly.`,
    follow: [
      `PKCE {{code_challenge_method=S256}} vs {{plain}} — why is {{plain}} unsafe?`,
      `When can Resource Owner Password Credentials Grant (ROPC) still be used? What are its risks?`,
      `How do you implement "login with Google/GitHub" (social login) in Spring Boot — which flow, which config?`
    ]
  },
  'security-005': {
    q: `Storing passwords: bcrypt vs Argon2id — which to choose when? What are cost factor/salt? Why must you NOT use SHA-256 or two-way encryption (AES) for passwords?`,
    a: `**Summary:** **Argon2id** (memory-hard; OWASP minimum m=19 MiB, t=2, p=1) or **bcrypt** (cost ≥ 10, commonly 12) are the two leading production choices; scrypt and PBKDF2 (when FIPS compliance is required) are also acceptable. **SHA-256/512 is too fast** — GPUs hash billions per second, brute-forcing is trivial. **Two-way encryption (AES) can be decrypted** — if the key leaks, every password leaks. Passwords must be **one-way hashed** + **a unique salt** per user.

### Why NOT SHA-256/512 (even with a salt)?
- It is designed for **speed** (checksum, integrity), not for **difficulty**.
- A modern GPU (e.g. an RTX 4090, per hashcat benchmarks) reaches on the order of tens of billions of SHA-256 per second → an 8-character alphanumeric keyspace (62^8 ≈ 2.2×10^14) is exhausted within hours.
- A salt only stops rainbow tables and forces the attacker to crack each user separately; it does **not** slow down each individual attempt.

### Why NOT two-way encryption (AES, RSA)?
- With the key, anyone can decrypt. Where does the key live? Config, Vault, HSM — if it gets exfiltrated, the **whole password DB is exposed**.
- A one-way hash: even with the DB, the attacker cannot reverse it (only brute-force, very slow against bcrypt/Argon2).

### Bcrypt — the de facto standard in Java/Spring
- Cost factor (log2 rounds): cost 10 = 1024 rounds, cost 12 = 4096 rounds, cost 14 = 16384 rounds.
- A 128-bit salt is embedded automatically in the hash:
~~~text
$2a$12$AbCdEfGhIjKlMnOpQrStUvWxYz...
~~~
- 72-byte input limit (UTF-8 — accented Vietnamese costs 2-3 bytes/char). The original algorithm silently skips the excess; Spring Security releases patched after CVE-2025-22228 reject inputs longer than 72 bytes instead of silently truncating.
- Spring: {{new BCryptPasswordEncoder(12)}}.

~~~java
@Bean PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12); // Spring's default is 10; measure so each hash costs a few hundred ms
}
// Verify
if (encoder.matches(rawPassword, storedHash)) { ... }
// Upgrade the cost when the user logs in successfully
if (encoder.upgradeEncoding(storedHash)) {
    user.setPassword(encoder.encode(rawPassword));
    userRepo.save(user);
}
~~~

### Argon2id — PHC 2015 winner, the recommended modern choice
- **Memory-hard**: consumes a lot of RAM → hard to optimize on GPU/ASIC (unlike bcrypt, which is only CPU-hard).
- 3 parameters: {{timeCost}} (iterations), {{memoryCost}} (KB), {{parallelism}} (lanes).
- Reference parameters: the OWASP Password Storage Cheat Sheet minimum {{m=19456}} (19 MiB), {{t=2}}, {{p=1}}; RFC 9106 (second recommended option) {{m=65536}} (64 MiB), {{t=3}}, {{p=4}}.
- Spring Security (since 5.3): {{Argon2PasswordEncoder}} (needs Bouncy Castle {{bcprov}} on the classpath). {{Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8()}} uses a 16B salt, 32B hash, p=1, m=16 MiB, t=2.
- Hash output:
~~~text
$argon2id$v=19$m=65536,t=3,p=4$c2FsdA$hash
~~~

~~~java
@Bean PasswordEncoder argon2Encoder() {
    // Parameter order: saltLength, hashLength, parallelism, memory (KiB), iterations
    return new Argon2PasswordEncoder(16, 32, 4, 65536, 3);
}
~~~

### Real-world comparison
| Criterion | Bcrypt (cost 12) | Argon2id (m=64MB,t=3,p=4) |
|---|---|---|
| Hash time | CPU-dependent — benchmark it | Parameter-dependent — benchmark it |
| RAM used | ~4KB | 64MB per hash |
| GPU/ASIC resistance | moderate (CPU-hard) | **excellent** (memory-hard) |
| Spring Security support | Built-in ({{spring-security-crypto}}) | Since 5.3 (needs Bouncy Castle) |
| Java library | {{jbcrypt}} / Spring Security | {{argon2-jvm}} / Spring Security |

### Salt — mandatory, unique, long enough
- One **separate salt per user** (16+ random bytes). Bcrypt/Argon2 generate the salt and embed it in the hash automatically.
- **Do not** use a single system-wide salt — if it leaks, the attacker brute-forces all users in parallel.

> Senior tip: **default to bcrypt cost 12** (safe enough, few dependencies, built into Spring). Move to Argon2id when you have a dedicated security team and the infra allows 64MB of RAM per hash. **Never** log the raw password. Use {{PasswordEncoder.matches()}} — it compares in constant time (timing-attack resistant). Check {{upgradeEncoding()}} on every login to raise the cost gradually. Use {{PasswordEncoderFactories.createDelegatingPasswordEncoder()}} ({{DelegatingPasswordEncoder}}): hashes are stored with an algorithm id prefix (bcrypt, argon2…) so you can switch algorithms while old hashes still verify.`,
    follow: [
      `Bcrypt limits input to 72 bytes — what happens if a user sets a 100-character passphrase? How should it be handled?`,
      `How does the {{parallelism}} parameter in Argon2id affect security and performance?`,
      `How do you migrate from bcrypt to Argon2id for a 10-million-user system without downtime?`
    ]
  },
  'security-006': {
    q: `CSRF and SameSite cookies: when does an API need CSRF protection, and when not? How to configure Spring Security CSRF for a REST API + SPA?`,
    a: `**Summary:** **CSRF** attacks when the browser automatically attaches cookies (session) to a forged request coming from another page. **SameSite=Lax/Strict** blocks most CSRF today. **CSRF tokens are needed** when: you use cookie authentication (session/{{JSESSIONID}}), SameSite=None (cross-site), or legacy browsers. **Not needed** when: stateless JWT ({{Authorization: Bearer <token>}} header), APIs using only Bearer tokens, SameSite=Strict/Lax + same-site.

### CSRF mechanics
- The victim logs in at {{bank.com}} → gets a {{JSESSIONID}} cookie.
- An attacker's page at {{evil.com}} embeds {{<form action="https://bank.com/transfer" method="POST">}} → the victim clicks → the browser sends {{JSESSIONID}} along → the transfer succeeds.
- The key ingredient: **the browser attaches the cookie** to cross-origin requests by itself.

### SameSite cookies — first line of defense (Chrome/Edge 80+ treat cookies with no declared SameSite as Lax; Firefox/Safari have not enabled this default — always set it explicitly)
| Value | Behavior | CSRF protection |
|---|---|---|
| {{Strict}} | Only same-site cookies (same eTLD+1) | **Strongest** — blocks every cross-site request |
| {{Lax}} (Chrome default) | Same-site cookies + top-level GET navigation (links) | **Good** — blocks cross-site POST/PUT/DELETE |
| {{None}} | Cookies sent on every cross-site request | **No protection** — {{Secure}} (HTTPS) is mandatory |

> **SameSite=Lax is a good layer of defense but does not replace CSRF tokens**: it does not block requests originating from same-site subdomains (e.g. a subdomain takeover), does not protect GET endpoints with side effects, and depends on the browser. Only use {{None}} when the cookie truly must cross sites (embedded widget, partner integration).

### When CSRF tokens ARE needed (Spring Security)
1. **Session-based auth** ({{JSESSIONID}} cookie) + SameSite=None or legacy browsers.
2. Traditional **form login** (Thymeleaf, JSP) — Spring enables CSRF by default.
3. **State-changing operations** through the cookie (login, logout, password change, transfer).

### When CSRF tokens are NOT needed
1. **Stateless JWT** in the {{Authorization: Bearer <token>}} header — no cookie → no CSRF.
2. **Bearer-token-only APIs** (OAuth2 resource server) — the token is not sent by the browser automatically.
(For an SPA + API on the same site sharing a cookie session, SameSite reduces the risk, but Spring still recommends keeping the CSRF token.)

### Spring Security configuration for a REST API + SPA with a session cookie (BFF, same site)
~~~java
@Bean
SecurityFilterChain apiFilterChain(HttpSecurity http) throws Exception {
    http
        .securityMatcher("/api/**")
        .csrf(csrf -> csrf
            .spa() // Spring Security 6.4+: XSRF-TOKEN cookie (HttpOnly=false) + handler that suits an SPA
            .ignoringRequestMatchers("/api/public/**"))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/public/**").permitAll()
            .anyRequest().authenticated());
    return http.build();
}
// Before 6.4: .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
//            .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
// APIs that only accept Bearer tokens (no cookies): CSRF does not apply, you may
// http.csrf(csrf -> csrf.disable()).oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
~~~

**How an SPA (React/Vue/Angular) reads the CSRF token:**
- The {{XSRF-TOKEN}} cookie (HttpOnly=false) → readable from JS → send the {{X-XSRF-TOKEN}} header (Angular, Axios do it automatically).
- Spring Security 6 defaults to {{XorCsrfTokenRequestAttributeHandler}} (the token gets masked as a BREACH defense) with deferred token loading — so switching only the repository is **not enough**: an SPA sending the raw token gets 403. Use {{csrf.spa()}} (6.4+) or configure the handler yourself as in the comment above.

### Configuration for session-based apps (traditional)
~~~java
@Bean
SecurityFilterChain webFilterChain(HttpSecurity http) throws Exception {
    http
        // Thymeleaf/JSP: keep the default HttpSessionCsrfTokenRepository, the token is inserted into forms automatically
        .csrf(Customizer.withDefaults())
        .sessionManagement(sess -> sess
            .sessionFixation().migrateSession()
            .maximumSessions(1).maxSessionsPreventsLogin(false)
        );
    return http.build();
}
~~~

> Senior tip: a Bearer token in a header has no CSRF issue, but the token sitting in JS (localStorage) is easy to steal via XSS — that is why many systems pick BFF + session cookies and keep a CSRF token. With a session cookie: set {{SameSite=Lax}} (or {{Strict}}), {{Secure}}, {{HttpOnly}}, and use {{csrf.spa()}} / {{CookieCsrfTokenRepository}} + the right handler for the SPA. **Do not** disable CSRF globally ({{csrf.disable()}}) unless you are certain the app is stateless. Test with {{curl -X POST -b cookies.txt https://api.bank.com/transfer}} — it must be rejected with 403 when the token is missing.`,
    follow: [
      `SameSite=Lax allows cross-site top-level GET navigation — can that be dangerous? Real-world example?`,
      `What is the default {{CsrfTokenRequestHandler}} in Spring Security? When should {{XorCsrfTokenRequestAttributeHandler}} be used?`,
      `How do CORS and CSRF relate to each other? Does a CORS misconfiguration cause CSRF?`
    ]
  },
  'security-007': {
    q: `XSS: how do Stored/Reflected/DOM-based differ? How do output encoding and CSP defend against it? Can a JSON API be hit by XSS?`,
    a: `**Summary:** **Stored XSS**: the payload lives in the DB and executes when the victim views the page. **Reflected XSS**: the payload is in the URL/params and is echoed right back in the response. **DOM-based**: the payload never touches the server; client-side JS renders unsafely. **Defense**: output encoding (context-aware) + **CSP** (Content-Security-Policy) as defense-in-depth. **A JSON API** cannot be XSSed directly ({{Content-Type: application/json}}), but it becomes dangerous if the frontend renders unsafely ({{innerHTML}}, {{dangerouslySetInnerHTML}}).

### The three XSS types
| Type | Where the payload lives | Execution vector | Example |
|---|---|---|---|
| **Stored** | DB, file, cache | The user views a page containing the payload | Comments, reviews, uploaded file names |
| **Reflected** | URL, query param, header | The user clicks a malicious link | Search {{q=<script>...}}, an error page echoing params |
| **DOM-based** | Client only (URL fragment, localStorage) | JS reads {{location.hash}} → {{innerHTML}} | An SPA router rendering {{location.hash}} unsafely |

### Output encoding — context-aware (OWASP Java Encoder / Thymeleaf / React)
- **HTML body**: encode {{&}} {{<}} {{>}} {{"}} {{'}} into entities ({{&amp;}}, {{&lt;}}, {{&gt;}}, {{&quot;}}, {{&#x27;}}) — Thymeleaf {{th:text}} does it automatically, JSP uses {{c:out}} or {{fn:escapeXml}}.
- **HTML attributes**: always quote the value and encode it — Thymeleaf {{th:attr}} / {{th:value}} do it automatically. Never put input into event attributes ({{onclick}}) or {{href}} (block the {{javascript:}} scheme).
- **JavaScript strings**: escape in the {{\\xHH}} / {{\\uXXXX}} form — best of all, **do not** inject data into inline scripts; use {{data-*}} attributes or Thymeleaf JavaScript inlining (escapes into a JS literal for you).
- **URL query params**: percent-encode ({{URLEncoder.encode(v, UTF_8)}}, {{UriComponentsBuilder}}, JS {{encodeURIComponent()}}).
- **CSS**: escape in the {{\\HH}} form — rare, best not to put input into CSS at all.
- Library: **OWASP Java Encoder** ({{Encode.forHtml()}}, {{Encode.forHtmlAttribute()}}, {{Encode.forJavaScript()}}).

~~~text
<!-- Thymeleaf th:text (auto-escape) — SAFE -->
<p th:text="\${userComment}"></p>

<!-- JSP JSTL — SAFE -->
<c:out value="\${userComment}" />

<!-- Straight concatenation into an inline script — DANGEROUS: XSS if the comment contains ' or </script> -->
<script>var msg = '<%= request.getParameter("c") %>';</script>

<!-- CORRECT: data attribute (escaped by Thymeleaf) then read via dataset -->
<div id="c" th:data-comment="\${userComment}"></div>
<script>const comment = document.getElementById('c').dataset.comment;</script>

<!-- Or Thymeleaf JavaScript inlining: [[...]] is escaped into a JS literal -->
<script th:inline="javascript">const msg = [[\${userComment}]];</script>
~~~

### Content-Security-Policy (CSP) — defense-in-depth
- Does **not replace** output encoding, but **limits the damage** when an encoding step is missed.
- Header:
~~~text
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{random}'; style-src 'self' 'nonce-{random}'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self';
~~~
- **Nonce/hash** for inline scripts/styles (avoid {{'unsafe-inline'}}).
- {{script-src 'strict-dynamic'}} (CSP3): scripts trusted via nonce/hash are allowed to load further scripts; host allowlists are ignored.
- {{report-to}} (new) / {{report-uri}} (old, still widely supported) to collect violations; roll out first with {{Content-Security-Policy-Report-Only}}.

~~~java
@Bean
SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.headers(headers -> headers
        .contentSecurityPolicy(csp -> csp
            .policyDirectives("default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'")
        )
    );
    return http.build();
}
// Spring Security does NOT generate a nonce for you. To use one: write a filter that generates a random nonce
// per request (SecureRandom, Base64), put it into a request attribute for the template, then set the CSP header yourself.
~~~

### Can a JSON API be XSSed?
- **Not directly**: {{Content-Type: application/json}} → the browser does not render it as HTML, no script execution.
- **Dangerous when**: the frontend uses {{innerHTML}}, {{dangerouslySetInnerHTML}} (React), {{v-html}} (Vue) to render the JSON string; or the server returns the wrong Content-Type ({{text/html}}) for a response echoing input → reflected XSS.
- **JSONP** (callback) — **forbidden outright**: the callback name gets injected as XSS, and the data is readable cross-site.
- **Mime sniffing**: set {{X-Content-Type-Options: nosniff}} so the browser does not guess the type.

> Senior tip: **output encoding is mandatory**, CSP is layer 2. Thymeleaf/React escape by default — do not turn it off. JSON API: set {{X-Content-Type-Options: nosniff}}, {{Content-Type: application/json; charset=utf-8}}. Frontend: **never** render user data with {{innerHTML}}/{{dangerouslySetInnerHTML}}. Use {{textContent}}, Vue's default interpolation (double curly braces) or React JSX expressions — all of them auto-escape. Audit CSP via {{securityheaders.com}} — target {{A+}}.`,
    follow: [
      `Why is {{innerHTML}} more dangerous than {{textContent}}? Give an encoding bypass example?`,
      `CSP {{nonce}} vs {{hash}} — when to use which? How to rotate the nonce without cache issues?`,
      `What is Mutation XSS (mXSS)? Can the browser parser "repair" a safe payload into a malicious one?`
    ]
  }
});
