# T2609R — Fact-check nội dung mới của T2609

Status: DONE
Agent: opencode
Owns: `js/data/q-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2609 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 3 câu hỏi mới (sql-110, sql-111, sql-112):
- sql-110: Keyset pagination - đúng kỹ thuật (tuple comparison, tie-break PK, concurrent INSERT behavior, hybrid approach cho random access, HMAC cursor)
- sql-111: Partition range theo tháng - đúng kỹ thuật (unique index bắt buộc chứa partition key, partition pruning, Merge Append overhead, zero-downtime migration với RENAME + lock_timeout, DEFAULT partition caveat)
- sql-112: Window function ROW_NUMBER/SUM OVER/LAG - đúng kỹ thuật (ROWS vs RANGE frame clause, peer rows behavior, default RANGE trong PostgreSQL, streaming aggregate, index composite)
Không có lỗi kiến thức, không có lỗi markup, validation OK.

Status: DONE
