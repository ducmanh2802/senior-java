# T2514R — Fact-check nội dung mới của T2514

Status: DONE
Agent: opencode
Owns: `js/data/labs-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2514 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Không có lỗi. 32 lab (lab-sql-001 đến lab-sql-032) đều đúng kỹ thuật về PostgreSQL 15/MySQL 8.0: locking, deadlock, vacuum/bloat, N+1, prepared statement generic vs custom plan, index sargable, expression index, JSONB querying, REINDEX CONCURRENTLY, FK index, keyset pagination, CHECK NOT VALID, FOR UPDATE SKIP LOCKED, idle_in_transaction_session_timeout, connection pool exhaustion. Markup tuân thủ ({{code}}, ###, ~~~, ~~~seq, không backtick, không ${). ID đúng format lab-sql-NNN, category=sql, rubric ≥3.
