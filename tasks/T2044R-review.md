# T2044R — Fact-check nội dung mới của T2044

Status: DONE
Agent: opencode
Owns: `js/data/labs-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2044 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- lab-sql-019 (hint): sửa "200 lần round-trip * ~20 ms ≈ 4 giây" → "50 lần round-trip * ~80 ms ≈ 4 giây" — chỉ có 50 câu SQL (1 câu/mỗi đơn), không phải 200.
- lab-sql-019 (answer tóm tắt): sửa "~200 lần round-trip" → "~50 lần round-trip" — cùng lý do trên.
- lab-sql-022 (scenario): sửa "**15 session** của batch-service" → "**1 session** của batch-service — artifact pg_stat_activity chỉ cho thấy 1 session batch-service (các session khác là của service khác chia sẻ pool).
- validate.js: không có lỗi nào thuộc labs-sql.js (các LỖI còn lại là của q-java.js, q-spring-data.js, bugs.js, lessons-*.js, path.js — file không sở hữu, không sửa).