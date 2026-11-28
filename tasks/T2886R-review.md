# T2886R — Fact-check nội dung mới của T2886

Status: DONE
Agent: opencode
Owns: `js/data/lessons-db.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2886 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- lesson-db-026: Sửa mâu thuẫn kỹ thuật — bảng quy định cho biết REPEATABLE READ chặn lost update (40001), nhưng văn bản lại viết "Lost update ở READ COMMITTED/REPEATABLE READ vẫn có thể xảy ra". Đã sửa thành "Lost update ở READ COMMITTED vẫn có thể xảy ra...; REPEATABLE READ và SERIALIZABLE chặn bằng 40001" cho đúng với PostgreSQL và nhất quán với bảng.
- lesson-db-027: Bổ sung method `int size()` vào HashIndexSim starter — test gọi `h.size()` nhưng starter thiếu method này gây compile error.
- lesson-db-027: Sửa test B-tree sai expectation — `eq(null, b.get(10230))` sai vì keys[1023] = 10230 (đúng là có trong mảng), đã đổi thành `eq(null, b.get(10235))` (khóa không tồn tại).
- validate.js → OK. test-lessons.js: lesson-db-026/027/028/029 đều pass 100%.
