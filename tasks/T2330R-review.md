# T2330R — Fact-check nội dung mới của T2330

Status: DONE
Agent: opencode
Owns: `js/data/lessons-spring.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2330 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã sửa lỗi tên class trong `lesson-spring-020`: `TransactionAttributePointcut` → `TransactionAttributeSourcePointcut` (tên class Spring thực tế trong `org.springframework.transaction.interceptor`).
- Các bài tập (2 exercises) của lesson-spring-020 đã pass `node scripts/test-lessons.js lesson-spring-020` (8/8 test cases).
- File `js/data/lessons-spring.js` syntax OK (`node --check` pass).
- `node scripts/validate.js` báo lỗi ở file khác (`lessons-jpa.js`, `projects.js`, `path.js`) không thuộc quyền sở hữu task này — không được sửa theo quy tắc.
