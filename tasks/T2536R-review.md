# T2536R — Fact-check nội dung mới của T2536

Status: DONE
Agent: opencode
Owns: `js/data/q-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2536 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK (không lỗi trong q-sql.js; lỗi còn lại trong bugs.js là pre-existing, không thuộc file sở hữu). node scripts/build-light-index.js đã chạy OK.

## Notes
Lỗi đã sửa theo từng id:

sql-104: Không có lỗi kỹ thuật (ba trị logic, NOT IN/NULL, Hash Anti Join, SubPlan đều đúng).

sql-105:
- Thay collation MySQL (utf8mb4_general_ci, utf8mb4_unicode_ci, utf8mb4_0900_ai_ci) bằng collation PostgreSQL (en_US.utf8, C) trong câu hỏi và đáp án — tên collation MySQL không tồn tại trên PostgreSQL 15.
- Sửa sai lầm kỹ thuật: PostgreSQL KHÔNG cast ngầm giữa varchar và bigint (báo lỗi "operator does not exist"); phải cast tường minh một vế. Cast lên cột có index khiến index mất tác dụng.
- Thay các tham chiếu EXPLAIN/MySQL-specific (type: ALL, EXPLAIN FORMAT=JSON, possible_keys) bằng PostgreSQL (Seq Scan, Index Cond, Filter).
- Xoá tag 'utf8mb4' và 'MySQL' khỏi tags (chỉ giữ PostgreSQL-relevant).

sql-106:
- Sửa sai lầm kỹ thuật: với index (merchant_id, status, created_at), query WHERE merchant_id=? ORDER BY created_at KHÔNG thể bỏ qua cột status để sắp xếp — phải sort vì hàng trong index được sắp theo (status, created_at), không phải created_at đơn lẻ.
- Đặt nháy double-quote cho từ khóa reserved `order` trong CREATE INDEX (ON "order").
