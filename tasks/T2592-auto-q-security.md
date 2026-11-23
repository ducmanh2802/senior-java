# T2592 — 3 câu hỏi Senior Java (security) vào q-security.js

Status: DONE
Agent: kilo
Owns: `js/data/q-security.js`
After: T2538

Thêm **3 câu hỏi phỏng vấn mới** (topic: security) vào `js/data/q-security.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-security.js`); đọc danh sách để **không trùng ý**.

Chủ đề: quản lý secret trong Spring Boot trên Kubernetes/AWS (Secrets Manager, xoay vòng mật khẩu DB không downtime), chống brute force OTP/login (rate limit theo user + IP, lockout), audit log không thể sửa cho hệ thống tài chính.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment hoặc ~~~seq cho luồng nhiều bên → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/q-security.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 3 câu (id nối tiếp, cao nhất trước là 083):
- **security-084** (senior) — Dynamic/ephemeral DB credentials (Vault database secrets engine / RDS IAM auth): lease TTL + revoke, tích hợp HikariCP maxLifetime < lease TTL để xoay vòng không downtime.
- **security-085** (senior) — OTP 6 chữ số: TOTP (RFC 6238) vs HOTP cơ chế HMAC, online guessing entropy, attempt budget + lockout không khóa oan.
- **security-086** (lead) — Audit bất biến vs GDPR quyền được xóa: crypto-shredding / tokenization / pseudonymization (có ~~~seq + ~~~sql + ~~~java).

Góc nhìn khác các câu đã có: file đã có nhiều câu về secret (019/025/075/079), rate-limit/brute-force (014/027/080) và audit log (021/030/071/076). Ba câu mới chọn góc CHƯA có: (1) dynamic secret + lease/HikariCP (không lặp static + rotation), (2) cơ chế TOTP/HOTP + online guessing entropy (không lặp thiết kế rate-limit nhiều lớp), (3) crypto-shredding dung hòa audit bất biến với GDPR (câu 030 chỉ nêu GDPR ở follow, chưa có lời giải đầy đủ).

Nghiệm thu của file:
- `node --check js/data/q-security.js` → OK.
- `node scripts/qtool.js check js/data/q-security.js` → `check: OK for q-security.js` (0 lỗi/cảnh báo của file này).
- `node scripts/qtool.js list` xác nhận đủ 3 mục 084/085/086, mỗi câu follow=3, có Ví dụ đời thực + Trả lời mẫu + Senior tip.

LƯU Ý cho integrator (blocker NGOÀI task, KHÔNG phải file của tôi): `node scripts/build-light-index.js` và `node scripts/validate.js` toàn cục hiện BÁO LỖI vì file người khác đang dở dang — `js/data/lessons-concurrency.js` có backtick chưa cân (lỗi cú pháp, đang được agent khác sửa; số dòng lỗi thay đổi 6956 → 7226 giữa các lần chạy), kéo theo `projects.js`/`path.js` báo "lesson-concurrency-00x không tồn tại" và `index-light.js: đã cũ`. Tôi KHÔNG sửa file không sở hữu (AGENTS.md luật 3). Khi file lessons-concurrency.js hoàn tất, chỉ cần chạy `node scripts/build-light-index.js` rồi `node scripts/validate.js` là index-light.js sẽ cập nhật câu 084–086 và validate OK. Không commit.
Reviewed-by: kilo (T2592R)
