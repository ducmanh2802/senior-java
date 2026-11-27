# T2768R — Fact-check nội dung mới của T2768

Status: DONE
Agent: opencode
Owns: `js/data/quiz-spring.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2768 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Review nội dung mới (qz-sql-067 → qz-sql-076) trong `js/data/quiz-spring.js`: tất cả 10 câu trắc nghiệm SQL (PostgreSQL) — LEFT JOIN/COALESCE, HAVING, ROW_NUMBER, EXISTS vs IN, composite index prefix, EXPLAIN Seq Scan, Index Only Scan, NOT IN NULL, UPSERT ON CONFLICT, giảm Seq Scan. Kĩ thuật đúng, markup hợp lệ, multi-answer `(Chọn 2)` đúng, đáp án trong range và tăng dần. Không có lỗi kiến thức, markup, hay từ nước ngoài. `node scripts/validate.js` → OK (không báo lỗi cho file này; các lỗi còn lại là của file khác không thuộc quyền sở hữu).
