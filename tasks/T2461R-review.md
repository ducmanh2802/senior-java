# T2461R — Fact-check nội dung mới của T2461

Status: DONE
Agent: opencode
Owns: `js/data/lessons-db.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2461 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 9 vị trí trong lessons-db.js tham chiếu sai "PostgreSQL 18" và "PostgreSQL 18+" có tính năng skip scan:
- lesson-db-012 (id: lesson-db-012): 5 vị trí trong body, exercise explain, check explain
- lesson-db-015 (id: lesson-db-015): 2 vị trí trong body, exercise explain
- lesson-db-012 exercise explain: 1 vị trí
- lesson-db-015 check explain: 1 vị trí

Sửa thành: "Một số database khác (Oracle, SQL Server, MySQL 8.0.13+) hỗ trợ skip scan; PostgreSQL (tới 17) chưa có tính năng này" hoặc tương đương. Chuẩn PostgreSQL 15 theo AGENTS.md không có skip scan.
node scripts/validate.js → OK. node scripts/test-lessons.js → các bài học db đều pass (342/346, 4 lỗi ở lessons-spring.js không liên quan).
