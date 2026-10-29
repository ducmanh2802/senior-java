/*
 * English translation of js/data/q-security.js — task T382. Format: js/core/i18n.js (content overlay).
 * ids: security-015 security-016 security-017 security-018 security-019 security-020 security-021 security-022
 */
App.i18n.content({
  'security-015': {
    q: 'Spring Security 6: How to configure SecurityFilterChain using lambda DSL? When are multiple filter chains needed, what is their order, and common pitfalls?',
    a: `**Summary:** Since Spring Security 6, each set of endpoints is protected by a {{SecurityFilterChain}} bean configured using **lambda DSL**. When you declare this bean yourself, Spring Boot **disables** the default security configuration, so you must explicitly declare all rules. In large systems, separate multiple chains using {{securityMatcher()}} and {{@Order}}; the chain that matches **first** will process the request.

### Why use lambda DSL
- Older DSLs connected with {{and()}} were hard to read. API history: Spring Security 6.0 removed {{antMatchers()}}/{{mvcMatchers()}}/{{regexMatchers()}} entirely (replaced by {{requestMatchers()}}) and marked {{authorizeRequests()}} as deprecated; 7.0 removed {{authorizeRequests()}} and {{and()}} completely. Lambda DSL has existed since 5.2.
- The syntax {{http.csrf(c -> c.disable())}} is **type-safe**: IDE suggests the correct method for each part, no need to memorize the API returning {{HttpSecurity}}.

### Multiple chains and order
- {{securityMatcher(...)}} is placed at the **chain level**: if the request doesn't match, Spring tries the next chain. No matcher means the chain receives **all** requests.
- {{@Order}} smaller value runs first. No order specified puts the chain at the end, very easily "swallowed" by a chain above it.
- Logical chain separation: stateless API for mobile/SPA, form-login chain for internal admin pages, separate chain for actuator.

~~~java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    @Order(1)
    SecurityFilterChain apiChain(HttpSecurity http) throws Exception {
        return http
            .securityMatcher("/api/**")
            .csrf(AbstractHttpConfigurer::disable)              // API does not use cookie session
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/api/public/**").permitAll()
                .anyRequest().hasAuthority("SCOPE_read"))
            .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
            .exceptionHandling(e -> e.authenticationEntryPoint(
                new BearerTokenAuthenticationEntryPoint()))     // 401 with WWW-Authenticate
            .build();
    }

    @Bean
    @Order(2)
    SecurityFilterChain webChain(HttpSecurity http) throws Exception {
        return http
            .authorizeHttpRequests(a -> a
                .requestMatchers("/login", "/css/**").permitAll()
                .anyRequest().authenticated())
            .formLogin(Customizer.withDefaults())
            .build();
    }
}
~~~

### CORS, CSRF, and error codes
- **CORS**: if you have a {{CorsConfigurationSource}} bean, explicitly call {{http.cors(Customizer.withDefaults())}} so that the {{CorsFilter}} runs **before** the authentication filter. If CORS is only configured at the Spring MVC level ({{@CrossOrigin}}, {{WebMvcConfigurer}}) without this step, preflight {{OPTIONS}} (no token) will be blocked with 401 before reaching MVC.
- **CSRF**: chains using cookie/session must keep CSRF. Stateless APIs authenticating via the {{Authorization}} header can disable it. SPAs using cookies can use {{CookieCsrfTokenRepository.withHttpOnlyFalse()}} and send the token via a header.
- **401 vs 403**: unauthenticated → {{AuthenticationEntryPoint}} returns 401; authenticated but insufficient permissions → {{AccessDeniedHandler}} returns 403. Do not return 500 for these cases.

### Production pitfalls
- Writing {{anyRequest().permitAll()}} to "make it run first" and then forgetting it — this is the most common security configuration error.
- Chains without a {{securityMatcher}} at the front cause subsequent chains to never run.
- Forgetting to lock down actuator: only open {{/actuator/health}}, block {{env}}, {{heapdump}}, {{beans}} or put them behind admin permissions.
- {{permitAll()}} does not mean bypassing all filters; it only bypasses the **authorization** step, other filters still run.
- Method security is a separate layer: URL rules do not protect internal calls between services.

> Senior tip: write negative tests for **each chain**: no token → 401, wrong scope token → 403, correct token → 200, and check actuator. Use {{MockMvc}} + {{spring-security-test}} ({{jwt()}}, {{@WithMockUser}}). When investigating in real environments, enable {{logging.level.org.springframework.security=DEBUG}} to see which filter blocked the request; remember to disable it afterwards because logs may contain sensitive information. Design principle: **deny by default**, every new endpoint must be consciously added to rules.`,
    follow: [
      'Why can a chain without securityMatcher disable subsequent chains?',
      'When should you separate multiple SecurityFilterChain instead of using a single chain with requestMatchers?',
      'How to return a consistent JSON 401/403 error for both REST API and web pages?'
    ]
  },
  'security-016': {
    q: 'Mass assignment (over-posting) what is it? Why is binding JSON directly to entities dangerous, and how to block it using DTOs/records in Spring Boot?',
    a: `**Summary:** Mass assignment occurs when the application **binds all fields from the request to the entity** instead of only allowing permitted fields. Attackers add {{role: ADMIN}}, {{balance: 999999}}, {{ownerId: 1}} or {{enabled: true}} to the JSON and overwrite data that the business never intended. The standard way to block it is to use **DTO/record allowlist**, explicit mapping, and always obtain identity/tenant from the principal, not from the body.

### Why this is common
- Spring Boot sets Jackson to ignore unknown properties ({{FAIL_ON_UNKNOWN_PROPERTIES=false}}). This helps API evolution, but fields **that exist on the entity** are still bound normally.
- Writing {{@PostMapping public User update(@RequestBody User user)}} opens the door: every public setter of {{User}} is an attack surface.
- Form binding {{@ModelAttribute Account account}} also does this via {{WebDataBinder}}; fields not present on the form can still be added.

~~~json
// Valid request from client
{ "fullName": "Nguyen Van A", "phone": "0901234567" }

// Request by attacker with sensitive fields added
{ "fullName": "Nguyen Van A", "phone": "0901234567",
  "role": "ADMIN", "balance": 999999, "ownerId": 1, "status": "ACTIVE" }
~~~

### How to block: DTOs as allowlist
~~~java
// Only fields client is allowed to send
public record UpdateProfileRequest(
        @NotBlank @Size(max = 120) String fullName,
        @Pattern(regexp = "^0[0-9]{9}$") String phone) { }

@PutMapping("/me")
public ProfileResponse update(@Valid @RequestBody UpdateProfileRequest req,
                              @AuthenticationPrincipal Jwt jwt) {
    User user = userRepo.getReferenceById(Long.valueOf(jwt.getSubject()));
    user.setFullName(req.fullName());       // explicit mapping
    user.setPhone(req.phone());
    // role, balance, ownerId are NOT in DTO so they cannot be overwritten
    return mapper.toResponse(userRepo.save(user));
}
~~~

- DTOs should be {{record}} or classes with getters only; do not expose setters for fields that should not be allowed.
- Use MapStruct with {{@Mapping(target = "role", ignore = true)}} if mapping entities; always review generated mappings.
- For MVC forms: add {{@InitBinder("account")}} and call {{b.setAllowedFields("name", "email")}} on {{WebDataBinder}}.
- For read-only fields like {{id}}, {{createdAt}}, use {{@JsonProperty(access = Access.READ_ONLY)}} so Jackson does not deserialize them.
- Understand {{@JsonIgnore}} correctly: it applies to **the entire logical property** (getter/setter/field binding), meaning it disables deserialize for both directions, not just hiding the field in the response. To have the field returned but not bound from request, use {{@JsonProperty(access = Access.READ_ONLY)}} as above and write a test to prove it.
- {{tenantId}}, {{ownerId}} must be obtained from token/principal; if they must be received from request, cross-reference them with current permissions.

### Advanced pitfalls
- **PATCH**: if using {{Map<String,Object>}} and then reflection to set fields, you have recreated mass assignment. Whitelist keys or use DTOs with {{Optional}}/patch functionality.
- **Enum/role**: attacker sends {{role: "ADMIN"}}; if the entity has a setter accepting the enum, Jackson will convert it. Check nested fields as well.
- **JPA dirty checking**: binding to a managed JPA entity will commit changes automatically, no need to call save. This is why bugs bypass tests.
- **API3:2023 Broken Object Property Level Authorization**: OWASP calls this **property** level, distinct from BOLA/IDOR at the **object** level.
- Add {{@Version}} (optimistic locking) to prevent lost updates when two requests edit the same record.

> Senior tip: set a code review rule "controller must never receive JPA entities", grep for {{@RequestBody}} in CI catches most cases. Write a contract test sending {{"role":"ADMIN"}} and assert role **does not change**; this test is much cheaper than incident response. For public APIs, log fields ignored in staging to detect clients sending extra data, but do not log the entire body as it may contain PII.`,
    follow: [
      'Why does Spring Boot ignore JSON properties by default, and what is the trade-off with fail-fast?',
      'How does Mass assignment differ from IDOR/BOLA according to OWASP API Security Top 10?',
      'How to apply allowlisting when designing PATCH APIs that only update a subset of fields?'
    ]
  },
  'security-017': {
    q: 'JWT self-contained and opaque token: which to choose? How to implement instant token revocation at scale (logout, password change, account lock)?',
    a: `**Summary:** **JWT** contains claims so services verify offline, fast and no need to call auth server every request — but **hard to revoke** because tokens already issued remain valid until expiry. **Opaque tokens** are just random strings, each request requires introspection or store lookup, in exchange for **instant revocation** and not exposing claims. In practice, **hybrid** is often used: short-lived access JWT (5–15 min) + rotated opaque refresh tokens, plus a denylist for high-risk events.

### Comparison
| Criteria | JWT | Opaque token |
|---|---|---|
| Verify | Offline via public key/JWKS | Call introspection/store every request (can cache) |
| Size | Large (many claims, maybe few KB) | Small, fixed |
| Revocation | Hard, requires denylist/version | Instant, delete record |
| Data exposure | Claims are **base64**, anyone with token can read | No exposure except the string |
| Dependency | Auth server only at issue/key rotate time | Auth server/store is runtime bottleneck |
| Suitability | Many services, needs scale | Few services, needs tight revocation, low load |

### Revoking JWT — levels
1. **Shorten TTL**: access token 5–15 minutes. This is the cheapest measure; the risk window is the TTL.
2. **Denylist by {{jti}}** in Redis: on logout/account lock, store {{jti}} with TTL = {{expiry - now}}. All services check Redis before accepting. Cost: one extra lookup per request.
3. **Token version/session version**: store {{tokenVersion}} per user; JWT contains {{tokenVersion}} at issue time. Increment version on password change/lock → **all** old tokens die. Requires reading version from cache/DB, so it is stateful.
4. **Refresh token rotation + reuse detection**: each refresh token used once; if an old token is reused, revoke **the entire token family** (sign of theft).
5. **Key rotation**: deleting {{kid}} from JWKS invalidates tokens signed with that key, but this is a blunt measure affecting all users.

~~~java
// Check denylist after verifying signature + exp
public boolean isRevoked(Jwt jwt, RedisTemplate<String, String> redis) {
    String jti = jwt.getId();
    return jti != null && Boolean.TRUE.equals(redis.hasKey("jwt:deny:" + jti));
}

// On logout: TTL = remaining time, don't keep forever
public void revoke(Jwt jwt, RedisTemplate<String, String> redis) {
    Duration ttl = Duration.between(Instant.now(), jwt.getExpiresAt());
    if (!ttl.isNegative() && !ttl.isZero()) {
        redis.opsForValue().set("jwt:deny:" + jwt.getId(), "1", ttl);
    }
}
~~~

### Opaque token and introspection
- Per RFC 7662, resource server calls introspection endpoint, receives {{active: true/false}} plus metadata. Can cache results **shorter than or equal to** revocation SLA; do not cache error responses.
- Token store is usually Redis/DB managed by the auth server; logout deletes the key, but every request depends on the auth server/store — needs HA, timeout, circuit breaker.

### Choosing based on actual requirements
- If revocation requirement is **under 30 seconds**, pure JWT won't satisfy with long TTLs; use short TTL + denylist or opaque.
- If dozens of services read tokens at very high traffic, JWT significantly reduces introspection load.
- For high-risk operations like fund transfers, require **step-up**: new token with 2–5 min TTL + MFA.

### Pitfalls
- Putting PII, account numbers, sensitive roles in JWT — base64 is not encryption. Consider JWE if needed, but consider size.
- Denylist without TTL → Redis grows indefinitely.
- Revoking access token but forgetting refresh token.
- Checking denylist **before** verifying signature; do not query Redis with unverified data.
- Logging tokens, putting tokens in query URL (leaking in access logs/Referer), or storing tokens in {{localStorage}} when the app is still at risk of XSS (malicious scripts can read them immediately).

> Senior tip: agree on a **revocation SLA** with business before choosing architecture, as it dictates TTL and infra cost. Real-world configuration often used: 10 min access, 8-hour refresh with rotation, denylist for logout and emergency lock, version check for password changes. Measure introspection cache hit rate; set alerts when the auth server is slow, and always have a fallback path to read JWKS cache when the auth server is down.`,
    follow: [
      'How many requests/second can JWT denylist in Redis handle, and where is the bottleneck?',
      'How does Refresh token rotation detect reuse without storing all tokens?',
      'When should you use DPoP or mTLS-bound tokens instead of regular bearer tokens?'
    ]
  },
  'security-018': {
    q: 'Advanced OAuth2 Resource Server configuration: validating audience, multiple issuers, mapping scope to authority, JWKS rotation, and handling 401 errors according to standards?',
    a: `**Summary:** The resource server **only authenticates** tokens, does not issue them. Besides signature and {{exp}}, production must check **audience** (tokens issued for other APIs must not be used here), map scope/role to authorities correctly, handle **multiple issuers** if there are multiple auth servers, and tolerate **JWKS rotation** along with auth server incidents. Errors must return 401 with the correct {{WWW-Authenticate}} header.

### Mandatory validation
- By default {{NimbusJwtDecoder}} checks signature and timestamp ({{exp}}, {{nbf}} with 60s clock skew). {{iss}} is only checked when you configure {{issuer-uri}} or a validator.
- **Audience** **is not** checked if you don't declare it. This is a commonly missed vulnerability: service A's token can be used at service B if they share the same issuer and key. From Spring Boot 3.1, the cleanest way is property {{spring.security.oauth2.resourceserver.jwt.audiences=payments-api}} (Boot adds the validator automatically); when manually constructing {{JwtDecoder}} as below, you must manually add the validator.
- You should also check {{azp}}/{{client_id}} if tokens are issued to multiple clients.

~~~java
@Bean
JwtDecoder jwtDecoder(OAuth2ResourceServerProperties props) {
    NimbusJwtDecoder decoder = NimbusJwtDecoder
        .withJwkSetUri(props.getJwt().getJwkSetUri())
        .build();

    OAuth2TokenValidator<Jwt> withIssuer =
        JwtValidators.createDefaultWithIssuer("https://auth.bank.vn");
    OAuth2TokenValidator<Jwt> withAudience = new JwtClaimValidator<List<String>>(
        "aud", aud -> aud != null && aud.contains("payments-api"));

    decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(withIssuer, withAudience));
    return decoder;
}
~~~

### Mapping scope and roles
- Default scope {{read:account}} becomes authority {{SCOPE_read:account}}; use {{hasAuthority("SCOPE_read:account")}}.
- Internal tokens often have claim {{roles}} or {{groups}}. Write a {{JwtAuthenticationConverter}} to combine both, adding prefix {{ROLE_}} to roles so {{hasRole("ADMIN")}} works.
- Do not blindly map every {{groups}} value to authority if IdP allows users to create groups — whitelist them.
- Distinguish **scope** (client permission) and **role** (user role). APIs should check both when necessary.

### Multiple issuers
- Use {{JwtIssuerAuthenticationManagerResolver}} with a map of issuer → {{AuthenticationManager}}, only accept issuers in the **allowlist**. Absolutely do not extract issuer from the token and call arbitrary URLs (SSRF risk).
- For opaque tokens, configure {{introspection-uri}} + client credentials; cache results for a short duration and do not cache error responses.

### JWKS rotation and availability
- With only {{issuer-uri}}, the app must call {{/.well-known/openid-configuration}} to find JWKS. Spring Boot 3 initializes this decoder **lazily** (first request), so the app starts, but if the auth server is down, the first requests fail with 401/500. Declaring {{jwk-set-uri}} (keeping {{issuer-uri}} to still validate {{iss}}) skips discovery. If you manually call {{JwtDecoders.fromIssuerLocation()}} in a bean, discovery runs at startup and an auth server outage prevents app startup.
- Decoder caches JWKS (default ~5 minutes). When auth server rotates keys, need an **overlap** window: new public key published first, old tokens still verify using old key until TTL expires.
- Set short timeouts for JWKS loading and have retries; don't let requests hang on auth server availability.

### Proper 401s
- Return {{401}} with {{WWW-Authenticate: Bearer error="invalid_token"}}; do not return 500, do not return stack trace.
- Do not disclose expired tokens or invalid audiences to untrusted clients; log details on the server with a correlation ID.
- Dispatch ERROR also needs authorization: Boot forwards exceptions to {{/error}}, and from Spring Security 6 authorization rules apply to all dispatcher types, including ERROR — if not permitted for {{/error}} (or {{dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()}}), the original error is replaced by 401/403, hiding the investigation trace.

### Pitfalls
- Only configuring {{issuer-uri}} thinking it's sufficient — missing audience check.
- Forwarding user tokens as-is down to internal services; use token exchange (RFC 8693) or client credentials, and **do not log** the {{Authorization}} header.
- Setting {{role}} claim from client in token without IdP control.
- Sharing signing keys across all environments.

> Senior tip: write test suites for the decoder with 5 cases: valid token, expired, wrong audience, wrong issuer, signature invalid. Also test JWKS returning 500 and assert the app uses the cache. In banking, every API should have its own audience and minimal scopes; periodically review which clients have requested excessive scopes. Never enable receiving unsigned tokens (alg none) — Nimbus denies by default, do not override this.`,
    follow: [
      'Why is checking the issuer but not the audience dangerous?',
      'How does JwtIssuerAuthenticationManagerResolver handle multiple IdPs and what risks should be blocked?',
      'When the auth server is down at startup, how can the resource server still start?'
    ]
  },
  'security-019': {
    q: 'Managing production secrets with AWS Secrets Manager: Spring Boot integration, automatic rotation, and the trap of cached old credentials causing the app to stop connecting to the DB?',
    a: `**Summary:** Secrets must reside in a centralized, encrypted, authorized, and audited store — **not** in repo, images, environment variables, or config files. AWS Secrets Manager encrypts with KMS, logs every read to CloudTrail, and supports **automatic rotation** (usually via Lambda). The app must read secrets via SDK/IRSA, use TTL-based caching, and especially **handle the moment credentials rotate correctly** — otherwise, the connection pool holds old passwords and the app dies after rotation.

### Basic principles
- **Secret zero**: app gets permission to read secret via workload identity (IRSA on EKS, instance profile on EC2), do not embed static access keys.
- IAM least privilege: only {{secretsmanager:GetSecretValue}} for the correct ARN, not {{ListSecrets}} for all.
- Enable encryption with a separate CMK per environment. CloudTrail logs every {{GetSecretValue}} call (read-type management event), so trails must be enabled to log read events and alert when foreign principals read secrets.
- Avoid env vars for secrets if possible: env vars leak via {{/proc}}, crash dumps, child processes, actuator/env. Prefer reading via SDK or CSI volume.

### Spring Boot integration
Spring Cloud AWS 3.x supports direct import; JSON secret keys become properties:

~~~yaml
spring:
  config:
    import: aws-secretsmanager:prod/payments/db
  cloud:
    aws:
      region:
        static: ap-southeast-1
~~~

- Do not use {{optional:}} for mandatory secrets — the app must fail-fast if it can't read them, instead of running with empty configuration.
- For applications not using Spring Cloud AWS, call {{GetSecretValueRequest}} at startup and map manually; do not call this API per request.
- Secrets containing multiple keys (username, password, host) are usually JSON; parse once then create {{DataSource}}.

### How rotation works
1. Lambda rotation attached to secret, scheduled (e.g., 30 days), via 4 steps: {{createSecret}} (create new password, save with {{AWSPENDING}} label) → {{setSecret}} (change password in DB) → {{testSecret}} (test login) → {{finishSecret}} (move {{AWSCURRENT}} label to new version, old version becomes {{AWSPREVIOUS}}).
2. **Single user**: {{setSecret}} changes the app user's password → old password **dies immediately**. Existing connections still work, but every new connection created with the old password will fail until the app reads the new secret.
3. **Alternating users** ({{app_user}} and {{app_user_clone}}): each rotation changes the password of the user **not currently in use**, then transfers AWSCURRENT to that user. The old user still works until the next rotation cycle → the app has an entire cycle to refresh. This is the safer choice for production DBs.
4. Consumers always read {{AWSCURRENT}}; {{AWSPREVIOUS}} is just a label for rollback, it does not mean the old password still works (with single user, it died).

### Biggest pitfall: connection pool holding old credentials
- HikariCP creates connections with passwords at the time of creation; existing connections live long and continue using the opened session. When the DB changes password, **new** connections created by the pool will fail if the app hasn't read the new secret.
- Solution: periodically re-read secret (every few minutes) and set {{maxLifetime}} much lower than the rotation period (rotation 30 days, maxLifetime 20–30 mins is plenty). {{validationTimeout}} (default 5s, checks when borrowing connection) can stay default, don't extend it.
- On refresh, create a new {{HikariDataSource}} and close the old one after active connections finish; or evict pool. Just reassigning the password variable in Spring Environment (pool doesn't re-read).
- The easiest, code-light way: **AWS Secrets Manager JDBC driver** (library {{aws-secretsmanager-jdbc}}) wraps the real driver; when DB login fails due to wrong password, it self-reads the secret and retries. Combined with alternating users, there is almost no downtime.
- With RDS, consider **IAM database authentication**: short-lived tokens (15 mins) generated from role, no password rotation needed — but still need to refresh token before it expires.

### Other secrets needing rotation
- JWT signing key: rotate by {{kid}}, publish public key first, keep old key in JWKS until token TTL expires.
- Partner API keys: support **two keys in parallel** during partner transition.
- Data encryption keys: envelope encryption, rotate DEK, keep old KEK to decrypt old data.

### Operations and incidents
- Alert when secret is near rotation expiry or rotation fails; monitor {{AWSCURRENT}} version age.
- Perform rotation drills on staging first, measure app recovery time.
- Do not log secret values, even on errors; mask in exceptions and actuator.
- Scan for secrets in git using gitleaks/trufflehog, block at pre-commit and CI.
- Multi-region: use secret replication, but remember replication might lag; do not hard-code region.

> Senior tip: typical production incident is not "cannot read secret" but **"rotation succeeded but app still using old password hours later"**. Treat rotation as infra change with tests: run rotation in staging, monitor DB login error rate, and have a rollback runbook. If using RDS IAM auth it's much simpler — no password to rotate, just refresh short-lived tokens.`,
    follow: [
      'Why does HikariCP still error after Secrets Manager has successfully rotated?',
      'How does RDS IAM database authentication replace password rotation and what are its limitations?',
      'How to rotate JWT signing keys without logging out users en masse?'
    ]
  },
  'security-020': {
    q: 'Method security in Spring Security 6: @PreAuthorize, AuthorizationManager and how to block tenant escalation when services call internally?',
    a: `**Summary:** URL rules only protect requests going through HTTP; **method security** protects the service layer, where all internal calls, scheduled jobs, and message consumers pass through. Spring Security 6 uses {{@EnableMethodSecurity}} and **{{AuthorizationManager}}** instead of the old {{AccessDecisionManager}}. Crucial principle: check permissions **by object and tenant**, not just by role, and never trust {{tenantId}} parameters sent by the client.

### @EnableMethodSecurity
- {{@EnableMethodSecurity}} enables {{@PreAuthorize}}, {{@PostAuthorize}}, {{@PreFilter}}, {{@PostFilter}}; defaults to {{prePostEnabled = true}}.
- Method security is **AOP proxy**: calls from outside the bean are blocked. Calling {{this.method()}} within the same class **bypasses** the check. This is a classic bug.
- {{private}}, {{final}}, methods on {{final}} classes cannot be proxied (CGLIB); place annotations on public methods of injected beans.
- Can be placed on controllers or services; should be placed on **service** because that is the business boundary, controllers can be bypassed by internal consumers.

### SpEL: powerful but easily abused
~~~java
// Compare same type: parameter username (String) with authentication.name (String)
@PreAuthorize("hasRole('ADMIN') or #username == authentication.name")
public UserProfile getProfile(String username) { ... }
~~~
- SpEL can call beans ({{@authz.canRead(...)}}), convenient but hard to test and can cause N+1.
- Do not put complex logic in SpEL; encapsulate in clear beans with tests.
- {{@PostAuthorize}} runs **after** the method, used when permission depends on the return value. Trap: method security interceptor wraps **outside** {{@Transactional}} (transaction advisor has lower order, runs innermost), meaning when @PostAuthorize rejects, the transaction **has already committed**. Only use @PostAuthorize for read methods, do not use for write methods.
- {{@PostFilter}} still loads everything then filters — for large data filter in query.

### AuthorizationManager
- {{AuthorizationManager<T>}} receives {{Supplier<Authentication>}} and the object to protect, returns the decision ({{check(...)}} returns {{AuthorizationDecision}}; since 6.4 there's {{authorize(...)}} returning {{AuthorizationResult}} and {{check}} is deprecated). It replaces {{AccessDecisionVoter}}/{{AccessDecisionManager}}.
- Can register interceptors for specific methods or use {{RequestMatcherDelegatingAuthorizationManager}} for HTTP; advantages: type-safe, unit testable, and composes well.

~~~java
@Component("authz")
@RequiredArgsConstructor
public class AccountAuthorization {
    private final AccountRepository repo;

    public boolean canRead(Long accountId, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        String tenant = auth.getAuthorities().stream()
            .filter(a -> a.getAuthority().startsWith("TENANT_"))
            .map(a -> a.getAuthority().substring(7)).findFirst().orElse(null);
        return tenant != null && repo.existsByIdAndTenantId(accountId, tenant);
    }
}

@PreAuthorize("@authz.canRead(#accountId, authentication)")
public AccountView getAccount(Long accountId) { ... }
~~~

### Tenant isolation
- Tenant must be obtained from verified token (claim {{tenant_id}}) and put into {{SecurityContext}}; do not receive from client-provided headers/body.
- All queries must have tenant conditions, preferably in repositories or Hibernate filters; do not only check in the controller.
- For background jobs/consumers, construct {{Authentication}} with tenant before calling service; cache must have tenant in key, otherwise data leakage will be very hard to detect.

### Async and reactive
- {{@Async}} default **does not** propagate {{SecurityContext}}. Use {{DelegatingSecurityContextExecutor}} or wrap task with {{DelegatingSecurityContextRunnable}}; for WebFlux rely on Reactor's context propagation, do not use thread-local.

### Test
- Use {{@WithMockUser}}, {{@WithUserDetails}} or {{SecurityMockMvcRequestPostProcessors.jwt()}}.
- **Negative** tests are mandatory: tenant A calling tenant B's account must return 403/404; missing role must return 403; and must have cases detecting self-invocation.

> Senior tip: do not treat {{@PreAuthorize}} as a magic charm. In review, I always ask "if this annotation is removed, is the data still protected by the query?" — best defense layer is **query with tenant + ownership**, annotation is just the second layer. Return 404 instead of 403 when resource belongs to another tenant to avoid ID enumeration. And remember method security does not protect code running within the same bean if called via {{this}}.`,
    follow: [
      'Why is @PreAuthorize bypassed when calling a method internally within the same bean?',
      'How does AuthorizationManager differ from the old AccessDecisionManager?',
      'How to safely propagate SecurityContext to @Async and scheduled jobs?'
    ]
  },
  'security-021': {
    q: 'Designing audit logs for banks: ensuring completeness, immutability, tamper-resistance, and auditability for auditors. Architecture, storage, and failure points?',
    a: `**Summary:** Audit log is **legal evidence**, not application log. It must answer who did what, when, from where, on which object, what was the result — and must be **append-only, tamper-resistant, long enough to audit**. Practical architecture: record within the same transaction via **outbox**, store in Postgres partitioned by month, hash chain + anchor periodically to **WORM storage** (S3 Object Lock), separated permissions, and a job checking total integrity.

### Event content
- **Actor**: user id, subject type (user/service/admin), tenant, login session.
- **Action**: event code with version ({{TRANSFER_APPROVE_V1}}), channel (mobile, API, batch).
- **Object**: type + id, **before/after** or diff, limit raw PII.
- **Context**: UTC time, trace id, IP, device id, result (success/deny/error), reason for denial.
- **Integrity**: sequential id, hash of previous and current record, signature/anchor in batches.

### Recording audit without losing transactions
- **Outbox pattern**: within the same business transaction, record event into {{audit_outbox}} table; worker reads and pushes to audit store. Avoid dual-write (write to DB then call Kafka) because one of them can fail.
- For high-risk events (money transfer, privilege change), be **fail-closed**: failure to log audit → transaction fails. Lower risk events can be buffered but alert if backlog grows.
- Record **intent log** before sensitive actions and record result after; if crash happens in between, we still know the intent.

### Immutability and tamper-resistance
- Audit table only granted {{INSERT}} and {{SELECT}} to app; **revoke UPDATE/DELETE**. Use a separate role, do not share credentials with app DB.
- Partition by month, detach old partitions to cold storage.
- **Hash chain**: {{h_n = SHA-256(h_n-1 || canonical_json(event))}}. Modifying one record breaks the entire subsequent chain.
- **Anchor**: periodically sign root hash and push to S3 Object Lock (compliance mode) or an independent notarization service; a DB owner still cannot modify the anchored record.
- Hash chain requires **a single sequential writer** (e.g., worker reading outbox in order then writing): multiple parallel pods will read the same {{prev_hash}} and the chain will fork.
- Periodic job detects hash mismatch, missing records vs outbox; alert immediately, do not auto-"fix" data. Do not rely on {{seq}} gap: PostgreSQL sequence has gaps on rollback, so seq gap does not prove deletion — only new hash chain is proof.

~~~sql
CREATE TABLE audit_event (
    seq          BIGSERIAL PRIMARY KEY,
    event_id     UUID NOT NULL UNIQUE,
    occurred_at  TIMESTAMPTZ NOT NULL,
    actor_id     TEXT,
    tenant_id    TEXT,
    action       TEXT NOT NULL,
    object_type  TEXT NOT NULL,
    object_id    TEXT,
    outcome      TEXT NOT NULL,
    payload      JSONB NOT NULL,
    prev_hash    BYTEA NOT NULL,
    hash         BYTEA NOT NULL
);
REVOKE ALL ON audit_event FROM PUBLIC;             -- in case PUBLIC was ever granted
GRANT INSERT, SELECT ON audit_event TO app_role;   -- NO UPDATE/DELETE/TRUNCATE
-- Table owner is a separate role (only used for migration, needs approval),
-- because the owner can always update/delete regardless of GRANT
~~~
- In production, {{PARTITION BY RANGE (occurred_at)}} by month; note with partitioned tables, PK/unique must include partition column, e.g., {{PRIMARY KEY (occurred_at, seq)}} and {{event_id}} unique must also include {{occurred_at}}.

### Storage, retention, and PII
- Retention based on internal rules and central bank; define duration, legal hold, and deletion procedure. For PII, mask or encrypt account number, ID number.
- No passwords, tokens, CVVs, full PAN; audit log is also a target so must be encrypted at-rest. All access to audit must be logged (audit the auditors), use break-glass with approval.

### Auditability and operations
- Index by {{occurred_at}}, {{actor_id}}, {{object_id}}, {{trace_id}}; sync time using NTP/chrony and store in UTC, because time drift invalidates evidence.
- Dashboard must have: backlog outbox, percentage verify fail, latency to audit store; and disaster recovery drills from cold storage to verify hash chain.

### Typical failure points
- Recording audit via {{@Async}} then losing event when pod is killed — no transactional guarantee.
- Only recording "success", ignoring denials — audit needs denials to detect probing/enumeration.
- Retention shorter than required, or deleting partitions without checking for legal hold.
- Hash chain but root hash is in the same DB — DB owner can modify the anchor too.

> Senior tip: the hardest audit question is not "do you have logs" but **"prove nobody modified them"**. Hash chain + WORM + separated permissions is the minimum trio; test by attempting to modify a record in staging and see if alerts fire. Don't make audit a performance bottleneck: outbox + partition maintains throughput, while fail-closed should only be for financial transactions and privilege changes.`,
    follow: [
      'Why shouldn\'t audit logs be written directly to Kafka within the business transaction?',
      'Hash chain detects modification but how to prove a section at the end wasn\'t deleted?',
      'How do multi-year retention requirements conflict with personal data deletion?'
    ]
  },
  'security-022': {
    q: 'Threat modeling a money transfer flow with STRIDE: drawing trust boundaries, listing abuse cases, and turning them into specific security requirements/controls?',
    a: `**Summary:** Threat modeling is a **design** activity, not just documentation for audit. With money transfer flow, we draw data flow + **trust boundary**, examine each component with **STRIDE**, write abuse cases, then turn them into security requirements with tests. Value lies in finding replay, double-spend, amount tampering, privilege escalation — things scanners won't find.

### 1. Identify assets and scope
- Assets: money, limits, identity, trusted devices, signing keys, transaction data.
- Actors include customers, tellers, admins, partners, internal services, and **insiders**.

### 2. Data flow and trust boundary
~~~text
[App mobile] --TLS--> [API Gateway/WAF] --mTLS/JWT--> [Payment service]
      |                                                      |
   (1) user session                                    (2) core banking (SOAP/REST)
                                                             |
                                                     (3) PostgreSQL ledger
                                                             |
                                                     (4) Kafka + audit WORM
~~~
Boundary includes device ↔ Internet, DMZ ↔ internal, service ↔ core banking, app ↔ audit store; each boundary needs its own authentication, encryption, rate limit, and logging.

### 3. STRIDE for each component
| Threat | Example in money transfer | Typical control |
|---|---|---|
| **Spoofing** | App spoofing, session theft, internal service impersonation | MFA/step-up, device binding, mTLS, short-lived tokens |
| **Tampering** | Amount tampering, beneficiary tampering in request | Server-side intent, request signing, limit verification |
| **Repudiation** | Customer denies money transfer order | Immutable audit log, OTP evidence, timestamp |
| **Information disclosure** | Balance leakage, PII via log/error response | Encryption, masking, no stack trace in response |
| **Denial of service** | Flood requests clogging payment | Rate limit, queue, circuit breaker, timeout |
| **Elevation of privilege** | IDOR to other account, mass assignment role | Ownership check, DTO allowlist, 4-eyes |

### 4. Specific abuse cases
- **Replay**: attacker captures money transfer request and sends again. Control: idempotency key + nonce + short-lived timestamp, server stores used keys; request signed with HMAC including nonce and amount.
- **Double-spend/race**: two concurrent requests exceeding limits. Control: optimistic lock {{@Version}} or pessimistic lock on account, ledger constraint in DB, single-entry ledger, end-of-day reconciliation.
- **Client-side amount tampering**: client sends {{amount}} which has been tampered with. Control: recalculate from server-side intent; do not trust any number from client for settlement step.
- **Insider/4-eyes bypass**: one person creates and approves. Control: maker/checker separation in DB + workflow, immutable audit, limit direct DB access.

### 5. From threat to testable requirements
- Requirement: "Every money transfer order must be idempotent based on {{(customerId, idempotencyKey)}} within 24 hours." Test: send same key twice, assert only one entry.
- Requirement: "Final amount taken from server-side intent, not payload." Test: tamper with amount in request, assert transaction uses saved amount.
- Requirement: "Audit records denial including trace id, and account lock takes effect in ≤ 30 seconds." Test: force deny then measure time from lock command to token denial.

### 6. Prioritization and tracking
- Score by probability × impact (money, legal, reputation); assign owner, deadline, and residual risk acceptance. Threat model is a living document: update when adding channels, partners, or money flows; measure by number of early threats detected.

> Senior tip: don't try to list every threat — pick **the 5 most expensive abuse cases** and turn them into automated tests. In banking, a 90-minute threat model session before coding is cheaper than patching after production launch. I always require dev, BA, security, and ops to be present, because threats usually lie at the intersection of business and infra — e.g., refund workflows or reconciliation jobs that no one thought of.`,
    follow: [
      'How to ensure idempotency for money transfers without making the idempotency table a bottleneck?',
      'Does STRIDE miss any common attacks in banking (fraud, social engineering)?',
      'How to measure threat modeling effectiveness instead of just counting documents written?'
    ]
  }
});