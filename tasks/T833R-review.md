# T833R — Fact-check nội dung mới của T833

Status: TODO
Agent: opencode
Owns: `js/data/q-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T833 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

Status: DONE

## Notes

Đã fact-check nội dung mới (sql-031 … sql-038) do model free viết, sửa 3 lỗi kỹ thuật:

- **sql-031** (Histogram example): thay `{{status > 5}}` bằng `{{created_at > '2025-01-01'}}`. `status` là varchar, không thể so sánh với số 5; ví dụ range scan phải dùng cột số/timestamp.
- **sql-031** (Planner chọn sai): ghi rõ thêm lý do "cột có phân bố lệch (skew) và histogram không đủ bucket để ước lượng chính xác" — bản gốc chỉ nói "MCV không đủ bucket", thiếu phần skew.
- **sql-038** (Deadlock detection): thay "DB phát hiện (timeout)" bằng "PostgreSQL phát hiện deadlock cycle (thường trong vòng 1s nhờ deadlock_timeout) và abort một transaction (victim)". Deadlock detection trong PG không dựa vào timeout — nó dò cycle trong lock graph.

Kiểm tra:
- `node --check js/data/q-sql.js` → SYNTAX OK
- `KEYSTORE_PASS=changeit node scripts/validate.js` → OK — không có lỗi
- `KEYSTORE_PASS=changeit node scripts/build-light-index.js` → ghi index-light.js 144.3 KB (file này đã stale, đã regenerate)
