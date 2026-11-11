# T1365R — Fact-check nội dung mới của T1365

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1365 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Reviewed 6 khối "### Ví dụ đời thực" mới của T1365 trong q-spring-data.js (câu db-025 → db-030, topic db), chỉ sửa lỗi kiến thức, không động nội dung HEAD, không thêm/xoá mục. Đã chạy build-light-index.js rồi validate.js → OK.

- db-028 (sequence): SỬA — gợi ý Oracle `ALTER TABLE payment MODIFY id GENERATED ... AS IDENTITY (START WITH LIMIT VALUE)` sai vì cột id trong tình huống sinh bởi sequence (không phải identity) → Oracle ném ORA-30673. Đổi thành `DROP SEQUENCE payment_seq` rồi `CREATE SEQUENCE payment_seq START WITH <max(id) + 1>`. Phần PostgreSQL `setval(...)` giữ nguyên (đúng).
- db-025 (Redis persistence), db-026 (REF CURSOR/SimpleJdbcCall), db-027 (fetch size/BULK COLLECT), db-029 (DBMS_XPLAN), db-030 (miễn Oracle → PostgreSQL): đã kiểm tra, không có lỗi kiến thức (API/flag, mặc định, cơ chế, số liệu), markup và thuật ngữ Anh đều OK theo AGENTS.md mục 5.
