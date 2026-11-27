# T2866R — Fact-check nội dung mới của T2866

Status: DONE
Agent: opencode
Owns: `js/data/quiz-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2866 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã fact-check 10 câu mới của T2866 (qz-architecture-051 … 060). Sửa 2 lỗi kỹ thuật:
- qz-architecture-052: sai tên exception khi mô tả vòng phụ thuộc bean — đã đổi `UnsatisfiedDependencyException` → `BeanCurrentlyInCreationException` (đúng exception Spring ném khi gặp circular dependency; UnsatisfiedDependencyException là khi thiếu bean, không phải vòng).
- qz-architecture-059: còn sót chữ lỗi/không nghĩa "thư viện invi" (2 chỗ) — đã sửa thành "thư viện bên ngoài".
Các câu còn lại (051, 053, 054, 055, 056, 057, 058, 060): không có lỗi kiến thức (Clean/Hexagonal, outbox, modular monolith + Spring Modulith @ApplicationModuleListener, strangler fig + CDC/Debezium đọc WAL, CQRS/eventual consistency, event sourcing upcaster, orchestrator saga idempotent compensation, ADR Michael Nygard, DTO mapping, shared kernel).

`node scripts/build-light-index.js` đã chạy lại (index-light.js cập nhật). `node scripts/validate.js`: **quiz-design.js không còn lỗi nào**. Các lỗi validate còn lại đều thuộc file của task khác trong working tree (quiz-ops.js, q-frontend.js, lessons-modern.js, lessons-jpa.js, lessons-payments.js, toeic-lr) — ngoài quyền sở hữu của T2866R nên không sửa.
