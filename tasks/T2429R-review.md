# T2429R — Fact-check nội dung mới của T2429

Status: TODO
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2429 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- File `js/data/q-spring-data.js` đã validate OK với `node scripts/validate.js q-spring-data.js`.
- 3 câu hỏi JPA mới (jpa-075, jpa-076, jpa-077) đã được thêm, nội dung đúng kỹ thuật Java 17/21, Spring Boot 3.x, Hibernate 6.
- Các lỗi còn lại của validate toàn dự án (q-concurrency-jvm.js short answers, q-sql.sql short answer, path.js lessons not in PATH, q-english-new.js/quiz_backup.js not in manifest) không thuộc scope task này - task sở hữu chỉ `js/data/q-spring-data.js`.

Status: DONE
