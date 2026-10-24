# T126 — Bảo mật backend cho Senior

Status: DONE
Agent: kilo
Owns: `js/data/q-security.js`

Đọc AGENTS.md mục 4–6 và mọi `q:` có sẵn trong mọi file q-*.js (không trùng). Thêm **~8 câu** topic `security` (id tiếp nối số lớn nhất hiện có, ~2 mid / 4 senior / 2 lead, đáp án 2500–4000 ký tự, kết bằng `> Senior tip:`): Spring Security 6 SecurityFilterChain (lambda DSL), JWT vs opaque token + revocation, OAuth2 Authorization Code + PKCE, resource server, CSRF khi nào cần, lưu secret (AWS Secrets Manager, rotation), OWASP Top 10 thực tế (IDOR/BOLA, SSRF, mass assignment), hash password (bcrypt/argon2), mTLS giữa service, audit log ngân hàng. Chỉ dùng API/hành vi bạn chắc chắn đúng (Java 17/21, Spring Boot 3.x, PostgreSQL 16). Không thêm `refs` nếu không chắc link tồn tại. Chạy `node scripts/validate.js` → OK, rồi ghi `Status: DONE` + ghi chú ngắn.

## Notes

- Đã thêm 8 câu `security-015` … `security-022` vào `js/data/q-security.js` (2 mid, 4 senior, 2 lead), độ dài 3657–3999 ký tự, kết bằng `> Senior tip:`.
- Nội dung: SecurityFilterChain lambda DSL + multi-chain; mass assignment/DTO; JWT vs opaque token & revocation; resource server (audience, multi-issuer, JWKS rotation); AWS Secrets Manager rotation & HikariCP; method security/AuthorizationManager & multi-tenant; audit log ngân hàng bất biến; threat modeling STRIDE cho luồng chuyển tiền.
- Không thêm `refs`; không sửa file ngoài quyền sở hữu. `node scripts/validate.js` → `OK — không có lỗi.`
Reviewed-by: opencode (T126R)
