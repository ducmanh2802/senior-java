# T2074 — 6 câu hỏi Senior Java (security) vào q-security.js

Status: DONE
Agent: kilo
Owns: `js/data/q-security.js`
After: T2035

Thêm **6 câu hỏi phỏng vấn mới** (topic: security) vào `js/data/q-security.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-security.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: OAuth2/OIDC với Spring Security 6: resource server kiểm JWT (JWKS, xoay khoá), authorization code + PKCE, client credentials giữa các service, refresh token, phân quyền theo scope/role, lỗi hay gặp trên production (lệch đồng hồ, sai audience, token quá to trong header).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-security.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 6 câu mới vào `js/data/q-security.js` (id nối tiếp từ `security-060`):

- `security-061` (senior) — JWT "quá to" trong header Authorization: vì sao 400/431, giới hạn Tomcat/Nginx/ALB, chẩn đoán và giảm kích thước token (giảm claim / reference token + introspection / tăng giới hạn).
- `security-062` (senior) — Clock skew giữa authorization server và resource server: exp/nbf, JwtTimestampValidator (mặc định 60s), chẩn đoán NTP, cấu hình Duration skew.
- `security-063` (senior) — Scope vs role trong resource server Spring Security 6: map claim → SCOPE_/ROLE_, hasAuthority vs hasRole, thiết kế least privilege.
- `security-064` (lead) — Spring Authorization Server: RegisteredClient (redirect_uri, PKCE, scope, token TTL, client authentication none/secret/private_key_jwt).
- `security-065` (senior) — OIDC id_token vs access_token, vai trò nonce, vì sao không dùng id_token gọi API, mô hình BFF, validator audience.
- `security-066` (lead) — Token exchange (RFC 8693) delegation (act) vs impersonation, may_act, chống forward token/confused deputy.

Không sửa mục cũ, không sửa file khác. Đã chạy `node --check js/data/q-security.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo path.js có sẵn từ trước). Không commit.
Reviewed-by: kilo (T2074R)
