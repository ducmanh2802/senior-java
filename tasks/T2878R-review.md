# T2878R — Fact-check nội dung mới của T2878

Status: DONE
Agent: opencode
Owns: `js/data/q-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2878 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Không có lỗi kỹ thuật trong 3 câu hỏi mới (sql-125, sql-126, sql-127). Đã kiểm tra:
- node --check q-sql.js: OK (không có lỗi JS, không có backtick/`${` trong template literal)
- node scripts/validate.js: OK (không báo lỗi nào cho q-sql.js)
- Kiểm tra kỹ thuật PostgreSQL 15: ROWS/RANGE frame, INTERVAL RANGE, row value comparison, BackwardIndexScan, INCLUDE covering index, pg_partman, RANGE+HASH sub-partition, partition-wise join, "no FK TO partitioned table" — đều đúng
- Không có API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ, lỗi markup, chữ nước ngoài cần dịch
