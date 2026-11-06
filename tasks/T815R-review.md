# T815R — Fact-check nội dung mới của T815

Status: DONE
Agent: opencode
Owns: `js/data/lessons-security.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T815 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review nội dung mới từ `git diff HEAD -- js/data/lessons-security.js`: `lesson-security-008`, `lesson-security-009` (body + exercises/check). Kiểm tra markup (không backtick, không `${`), `node --check`, không thêm/xoá mục.
- `lesson-security-008` (body): sửa lỗi chính tả/tiếng lẫn "separatately" → "placeholder) tách biệt". Sửa bullet gây hiểu sai/bịa setting: bỏ nhắc `hibernate.jdbc.statement_cache_size` (thuộc Hibernate, không phải Spring Boot config mặc định) và diễn giải quá cụ thể về PgJDBC; thay bằng mô tả đúng thực tế (tái dùng plan/statement phụ thuộc driver/DB/kết nối/cấu hình, ví dụ `prepareThreshold` của JDBC driver PostgreSQL) và nhấn mạnh ghép chuỗi động không bao giờ là lý do bỏ tham số.
- `lesson-security-009`: rà soát kỹ thuật (SSRF, CIDR ranges 0/8,10/8,100.64/10,127/8,169.254/16,172.16/12,192.0.0/24,192.0.2/24,192.168/16,198.18/15,>=224, IMDSv2/hop limit, DNS rebinding/TOCTOU, redirect follow, `java.net.http.HttpClient` default `Redirect.NEVER`/không pin DNS dễ, `HttpURLConnection` follow redirect trong cùng protocol mặc định), bài tập/đáp án/reference/test — không thấy lỗi kỹ thuật/markup/cú pháp cần sửa. `UrlGuard` reference phù hợp spec bài (IPv4 focus theo đề); check/answer đúng.
- Kiểm tra: `node --check js/data/lessons-security.js` OK. `node scripts/test-lessons.js lesson-security-008` → 10/10 PASS, OK. `node scripts/test-lessons.js lesson-security-009` → 10/10 PASS, OK. `node scripts/build-light-index.js` đã chạy (index-light cập nhật).
- `node scripts/validate.js` **chưa OK do lỗi ngoài file sở hữu** (không được sửa theo AGENTS luật 3): `lessons-banking.js: lesson-banking-008.exercises[0].hints[0]` — inline code `{{synchronized (b) { ... …}}` có `{ }` lồng nhau (validator báo lỗi). File `js/data/lessons-security.js` không còn lỗi/ảnh hưởng; cần integrator/owner `lessons-banking.js` sửa lỗi này để toàn bộ validate OK.
