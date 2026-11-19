# T2458R — Fact-check nội dung mới của T2458

Status: DONE
Agent: opencode
Owns: `js/data/labs-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2458 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
**lab-sql-030 (Keyset pagination / OFFSET):**
- Sửa giải thích EXPLAIN ANALYZE: artifact báo `actual rows=200100` nhưng count thực tế chỉ 35.420 dòng. Cập nhật answer để phản ánh đúng: planner duyệt theo ước lượng statistics (230k), thực tế đọc hết 35.420 entry rồi trả rỗng. Không còn nói "planner vẫn phải đọc hết 35.420 dòng rồi trả về rỗng (EXPLAIN vẫn báo rows=200100 vì ước lượng từ statistics)" một cách gây hiểu lầm — giờ giải thích rõ actual rows trong EXPLAIN ANALYZE là số dòng index entry đã duyệt theo thống kê, không phải count thực tế.

**lab-sql-031 (Missing FK index lock contention):**
- Sửa lỗi kỹ thuật nghiêm trọng: scenario gốc nói "chưa khai báo FK ở DB" nhưng artifact lại cho thấy PostgreSQL tự động kiểm tra FK và lock bảng con. PostgreSQL KHÔNG enforce FK nếu không khai báo CONSTRAINT. Đã sửa: FK **đã khai báo** nhưng **thiếu index** trên cột FK — đây là tình huống thực tế phổ biến.
- Sửa `wait_event = transactionid` → `wait_event = relation` (đúng cho relation-level lock RowExclusiveLock).
- Sửa title từ "ShareLock" → "RowExclusiveLock" (lock mode thực tế trong artifact).
- Xoá giải thích sai "PostgreSQL làm việc này tự động kể cả khi FK chưa khai báo" — thay bằng giải thích đúng: trigger RI được tạo ngầm khi khai báo FOREIGN KEY.
- Cập nhật questions/hints/answer/rubric phù hợp với scenario đã sửa (FK đã có, chỉ thiếu index).
