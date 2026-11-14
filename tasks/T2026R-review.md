# T2026R — Fact-check nội dung mới của T2026

Status: DONE
Agent: kilo
Owns: `js/data/lessons-security.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2026 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 2 bài học mới (lesson-security-012, lesson-security-013) trong `js/data/lessons-security.js` (diff so với HEAD).

Kết quả:
- `node scripts/validate.js` → `OK — không có lỗi.` (không có lỗi markup/schema cho 2 bài mới).
- `node scripts/test-lessons.js lesson-security-012` → 5/5 test pass.
- `node scripts/test-lessons.js lesson-security-013` → 6/6 test pass.

Kiểm tra kỹ thuật (Java 17/21, Spring Boot 3.x, Hibernate 6, JWT/HMAC, BCrypt/PBKDF2):
- Không phát hiện lỗi kiến thức (API/flag bịa, cơ chế nói ngược, số liệu vô căn cứ, thuật ngữ sai).
- `related` của 2 bài đều trỏ đến ID có thật trong `q-security.js` (security-005, security-036, security-003, security-034, security-001, security-009).
- Không có backtick `` ` `` hay `${` nào trong template literal của 2 bài mới (chỉ có backtick ở các `body`/`prompt`/`starter`/`tests`/`reference` template literal hợp lệ).
- `PasswordBox` và `JwtVerifier` reference code đều dùng JDK chuẩn, biên dịch được Java 17, pass 100% test.

Đã giữ nguyên nội dung đã có ở HEAD, chỉ thêm 2 bài học (lesson-security-012, lesson-security-013).
