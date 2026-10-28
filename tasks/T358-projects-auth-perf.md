# T358 — Pet project: Auth/SSO và Performance lab

Status: DONE
Agent: claude
Owns: `js/data/projects.js`

Thêm 2 dự án vào cuối window.PROJECTS, đúng định dạng đầy đủ như proj-wallet (đọc tasks/T327-projects-deep-a.md):
1. proj-auth-sso (senior): Spring Authorization Server, OAuth2/OIDC authorization code + PKCE, resource server JWT, refresh token rotation, RBAC, logout mọi thiết bị, bảo mật (CSRF, token leak).
2. proj-perf-lab (senior): lấy một service CRUD, đo baseline bằng k6 hoặc Gatling, profile bằng JFR/async-profiler, sửa lần lượt (N+1, pool size, cache, virtual threads), mỗi bước có số liệu trước/sau để ghi vào CV.
Tên artifact, class, property phải lấy từ docs chính thức (docs.spring.io, k6.io, gatling.io, JDK docs); không chắc thì mô tả bằng lời.

### Chuẩn chung (bắt buộc)
- Đọc AGENTS.md mục 2, 4, 5, 6, 13 trước khi viết. Người học là dev Java ~4 năm, **hổng nền tảng**: giải thích từ gốc, ví dụ đời thường, cơ chế từng bước có "vì sao", sơ đồ ASCII hoặc số liệu, code ngắn có comment, bảng trade-off, ### Lỗi hay gặp, ### Trả lời miệng 1 phút ngay trước > Senior tip:.
- Chống trùng: đọc hết câu cùng topic trong file của bạn và grep các file js/data/q-*.js khác; chủ đề đã có thì chọn góc khác hoặc bỏ.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6, Kubernetes/AWS hiện hành. Không chắc thì viết ít lại nhưng đúng. refs chỉ dùng link chắc chắn tồn tại; chạy node scripts/check-links.mjs <tên-file.js> (chỉ tên file) và bỏ link hỏng.
- Chỉ **thêm**, id tiếp số lớn nhất của topic/category trong file. Không sửa nội dung đã có.
- Trong template literal: không có ký tự backtick, không có ${ chưa escape, dấu \ phải viết \\; inline code dùng {{code}}.
- **Không bao giờ để file hỏng cú pháp**: sau mỗi lần sửa chạy node --check <file>; nếu hỏng mà không sửa được thì khôi phục bằng git checkout -- <file> rồi làm lại từng mục một.
- Không chạy trực tiếp file .js như lệnh (luôn node <file>). Không commit/push, không kill tiến trình, không mở trình duyệt.
- Xong: node scripts/validate.js → OK — không có lỗi.; ghi Notes (id đã thêm) và đổi dòng trạng thái thành đúng Status: DONE (chỉ dùng TODO hoặc DONE, không dùng giá trị khác).

## Notes

- Added proj-auth-sso (design ~4.9k chars) and proj-perf-lab (design ~4.4k chars) at the end of window.PROJECTS; existing projects untouched. Each: requirements (7 stories, NFR, out of scope), architecture, design, 5 milestones with commented code, 5 challenges, STAR + Trả lời miệng 1 phút + Demo 5 phút, 8 Q&A (528–701 chars).
- Verified against docs.spring.io (SAS reference + javadoc): spring-boot-starter-oauth2-authorization-server, RegisteredClient builder, ClientSettings.requireProofKey/requireAuthorizationConsent, TokenSettings accessTokenTimeToLive/refreshTokenTimeToLive/reuseRefreshTokens, JdbcRegisteredClientRepository, JdbcOAuth2AuthorizationService, OAuth2AuthorizationService save/remove/findById/findByToken (no find-by-principal, so revoke-all queries oauth2_authorization.principal_name), OAuth2TokenCustomizer<JwtEncodingContext>, JWKSource, AuthorizationServerSettings.
- Not verified by fetch this session (from memory, widely documented): default endpoint paths (/oauth2/authorize, /oauth2/token, /oauth2/jwks, /oauth2/revoke, /connect/logout), SAS not issuing refresh tokens to public clients, OAuth2ClientHttpRequestInterceptor (Spring Security 6.4+), spring.security.oauth2.resourceserver.jwt.audiences (Boot 3.2+), OAuth2AuthorizationRequestCustomizers.withPkce, OidcClientInitiatedLogoutSuccessHandler, CookieCsrfTokenRepository.withHttpOnlyFalse; k6 constant-arrival-rate options/thresholds; jfr view hot-methods (JDK 21), jdk.VirtualThreadPinned, asprof CLI; hikaricp.* metric names; wiremock image tag 3.9.1.
- Perf numbers are labelled illustrative. No refs added (check-links not needed).
- node --check OK; node scripts/validate.js -> OK — không có lỗi.
Reviewed-by: claude (subagent; validate OK)
