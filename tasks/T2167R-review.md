# T2167R — Fact-check nội dung mới của T2167

Status: DONE
Agent: opencode
Owns: `js/data/lessons-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2167 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Sửa lỗi chữ hoa tiếng Việt: "optimizer Ước lượng sai" → "optimizer ước lượng sai" (lesson-sql-010, dòng 2068) — từ "Ước lượng" viết hoa giữa câu không đúng quy tắc tiếng Việt.
- Toàn bộ nội dung kỹ thuật đã đúng: hash_mem_multiplier (PG 15), công thức chi phí join, số liệu pagination, EXPLAIN ANALYZE reading, B-tree steps.
- Tất cả bài tập (test-lessons.js) pass cho các lesson sql-001, 002, 010, 011, 012, 013.
- validate.js báo OK.
