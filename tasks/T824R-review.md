# T824R — Fact-check nội dung mới của T824

Status: DONE
Agent: opencode
Owns: `js/data/quiz-spring.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T824 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Fact-checked qz-spring-021..024, qz-jpa-021..024, qz-db-021..024, qz-api-023..025: translated leftover English sentences in explain to Vietnamese. Technical content verified (self-invocation, scopes, auto-config, TransactionalEventListener phases, IDENTITY batching, @Modifying, projection, @Version, MVCC, isolation, expression index, deadlock, idempotency, 429, versioning). validate reports only pre-existing error in lessons-security.js (not owned). Status: DONE
