# T2602R — Fact-check nội dung mới của T2602

Status: DONE
Agent: opencode
Owns: `js/data/labs-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2602 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Sửa lab-sql-031: FK thiếu index trên bảng con không giữ RowExclusiveLock mà là ShareRowExclusiveLock; INSERT child xin RowExclusiveLock, bỏ dòng AccessShareLock không đúng.
- Sửa lab-sql-033: expression index trên lower(name) có thể khớp vế trái lower(name); nguyên nhân Seq Scan là thiếu ANALYZE và index đơn lẻ không bao phủ category_id, không phải vế phải lower(?).
- node scripts/validate.js không đạt OK do lỗi cú pháp có sẵn trong q-english.js (không thuộc phạm vi task này); build-light-index.js cũng bị chặn bởi cùng lỗi. node --check js/data/labs-sql.js pass.
