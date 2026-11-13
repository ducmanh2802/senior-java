# T1548R — Fact-check nội dung mới của T1548

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1548 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `architecture-053`: sửa cụm từ lẫn ngoại ngữ/typo "Conflict-free gibi" → "Thiết kế tránh xung đột (Conflict-free by design):".
- `architecture-054`: sửa typo trong follow-up "khôngDowntime" → "không downtime".
- `architecture-056`: sửa "shared Across gateway instances" → "shared across gateway instances"; sửa cấu hình statement timeout Postgres sai property (pgjdbc) từ `StatementTimeout` → dùng `options = "-c statement_timeout=30000"` (giữ socketTimeout).
- Đã chạy: `node --check js/data/q-system-design.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Không chạy git commit/push, không mở browser, không kill process.
