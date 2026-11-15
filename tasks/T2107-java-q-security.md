# T2107 — 5 câu hỏi Senior Java (security) vào q-security.js

Status: DONE
Agent: kilo
Owns: `js/data/q-security.js`
After: T2074

Thêm **5 câu hỏi phỏng vấn mới** (topic: security) vào `js/data/q-security.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-security.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: bảo mật ứng dụng Java: OWASP Top 10 áp vào Spring Boot (SQL injection, IDOR/broken access control, SSRF), lưu mật khẩu (bcrypt/argon2), quản lý secret, CORS/CSRF khi có SPA, audit log.

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
- Đã thêm 5 câu hỏi mới (tiếp nối id lớn nhất tại thời điểm hoàn tất): `security-072` (senior, CSRF cho SPA dùng cookie: SameSite/synchronizer token/double-submit/BFF), `security-073` (lead, BOLA/IDOR vs thiếu xác thực, thiết kế kiểm soát quyền theo đối tượng trong Spring Boot), `security-074` (senior, SSRF: cơ chế, bypass blacklist, phòng thủ allowlist+resolve DNS+chặn IP private/metadata/IMDSv2), `security-075` (lead, quản lý secret với AWS Secrets Manager/Vault và xoay vòng không downtime), `security-076` (senior, audit log tài chính: trường cần ghi, tamper-evident/hash chain/WORM, outbox trong Spring Boot).
- Mỗi câu có `**Tóm tắt:**`, giải thích từng bước/vì sao, code Java/YAML/SQL ngắn có comment, bảng so sánh/trade-off, pitfall production, `### Ví dụ đời thực` có số liệu, `### Trả lời mẫu khi phỏng vấn`, `> Senior tip:` và `follow` (3 câu). Không dùng backtick và không có `${` chưa escape trong template literal (đã escape `\${db.*}` trong ví dụ YAML/`@Value`).
- Đã chạy `node --check js/data/q-security.js` (OK), `node scripts/build-light-index.js` (OK), `node scripts/validate.js` → `OK — không có lỗi.` Chỉ sửa `js/data/q-security.js`, `js/data/index-light.js` (rebuild bắt buộc), và file task này. Không git commit.
- Lưu ý: trong quá trình thêm, một lần append bị lỗi cú pháp nên file được khôi phục từ HEAD (trạng thái sạch) rồi append lại 072–076; trạng thái HEAD tại thời điểm đó chỉ có tới `security-066` (git index cũng vậy). Kết quả cuối trong file hiện có 001–066,072–076 (71 mục security) và validate OK. Không thấy `security-067`–`071` trong HEAD/index/stash; không tự ý khôi phục hay sửa ngoài phạm vi sở hữu.
Reviewed-by: kilo (T2107R)
