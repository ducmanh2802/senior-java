# T2679 — 3 câu hỏi Senior Java (security) vào q-security.js

Status: DONE
Agent: kilo
Owns: `js/data/q-security.js`
After: T2659

Thêm **3 câu hỏi phỏng vấn mới** (topic: security) vào `js/data/q-security.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-security.js`); đọc danh sách để **không trùng ý**.

Chủ đề: quản lý secret trong Spring Boot trên Kubernetes/AWS (Secrets Manager, xoay vòng mật khẩu DB không downtime), chống brute force OTP/login (rate limit theo user + IP, lockout), audit log không thể sửa cho hệ thống tài chính.

> Vòng 2 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

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

- File q-security.js đã chứa 3 câu hỏi topic security cần thiết (đã commit trước đó, id nối tiếp sau security-083):
  - security-084 (senior) — Quản lý secret/xoay vòng mật khẩu DB không downtime: dynamic/ephemeral credential (Vault database secrets engine, RDS IAM auth), lease TTL + revoke, tích hợp HikariCP maxLifetime < lease TTL.
  - security-085 (senior) — Chống brute force OTP/login: TOTP (RFC 6238) vs HOTP cơ chế HMAC, online guessing entropy, attempt budget + lockout không khóa oan.
  - security-086 (lead) — Audit log không thể sửa cho hệ thống tài chính: bất biến + crypto-shredding/tokenization/pseudonymization dung hòa với GDPR (có ~~~seq + ~~~sql + ~~~java).
- Góc nhìn khác các câu đã có (file đã có secret 019/025/075/079, rate-limit 014/027/080, audit 021/030/071/076): ba câu mới chọn góc CHƯA có (dynamic secret + lease/HikariCP; cơ chế TOTP/HOTP + online guessing entropy; crypto-shredding giải đầy đủ GDPR, không chỉ ở follow).
- `node --check js/data/q-security.js` → OK. `node scripts/qtool.js check js/data/q-security.js` → `check: OK for q-security.js` (0 lỗi của file này).
- `node scripts/build-light-index.js` và `node scripts/validate.js` toàn cục hiện BÁO LỖI do file KHÔNG sở hữu đang dở dang (trong phiên này: `js/data/q-aws.js` có lỗi cú pháp tại template literal, kéo theo `index-light.js: đã cũ`; trước đó lessons-concurrency.js). Khắc phục ngoài tầm task này, tuân thủ AGENTS.md luật 3 (không sửa file không sở hữu). Khi file kia hoàn tất, chỉ cần chạy `node scripts/build-light-index.js` rồi `node scripts/validate.js` là index-light.js cập nhật câu 084–086 và validate OK. Không commit.
