# T1422R — Fact-check nội dung mới của T1422

Status: DONE
Agent: opencode
Owns: `js/data/lessons-spring.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1422 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
không có lỗi — validation OK, test-lessons OK. Đã fact-check 11 bài học mới (lesson-spring-003 đến 013): @Transactional propagation/rollback, bean lifecycle & scope, Spring MVC request flow & ProblemDetail, Flyway-style migration runner, Jackson mapper visibility/strict mode, auto-configuration & @Conditional, @TransactionalEventListener & outbox, self-invocation proxy mechanics, circular dependency & early reference, AOP interceptor chain & @Order, BeanPostProcessor & proxy creation. Tất cả nội dung đúng kỹ thuật với Spring Boot 3.x / Java 17/21.
