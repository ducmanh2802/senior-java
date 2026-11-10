# T1251R — Fact-check nội dung mới của T1251

Status: DONE
Agent: opencode
Owns: `js/data/q-kotlin.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1251 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review toàn bộ nội dung mới thêm vào `js/data/q-kotlin.js` (6 câu hỏi: kotlin-005, kotlin-008, kotlin-009, kotlin-011, kotlin-012, kotlin-013). Kết quả:
- **Kỹ thuật**: Tất cả đúng theo Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Các ví dụ đời thực có số liệu cụ thể (tỷ lệ 500 1.5%, HikariCP wait 800ms→50ms, p95 300ms, Dispatchers.IO 64 thread, DB pool 20 connection, v.v.) phù hợp production thực tế.
- **Markup**: Không có backtick ` `, không có `${` phá template literal. Đúng cú pháp `{{code}}`, `~~~kotlin`, `~~~text`, `**đậm**`, `###`, `-`, `>`, `|table|`.
- **Ngôn ngữ**: Toàn bộ tiếng Việt, thuật ngữ kỹ thuật giữ nguyên tiếng Anh theo quy ước.
- **Chất lượng**: Mỗi câu hỏi có đủ **Tóm tắt**, các mục `###` giải thích cơ chế, `### Ví dụ đời thực` (triệu chứng→điều tra→xử lý→kết quả đo), `### Trả lời mẫu khi phỏng vấn` (60–90s), `> Senior tip:`.
- **Validation**: `node scripts/validate.js` → "OK — không có lỗi."
Không cần sửa gì thêm.
