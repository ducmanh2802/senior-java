# T2513R — Fact-check nội dung mới của T2513

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2513 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Fixed 3 new questions added by T2513 in q-concurrency-jvm.js:

- **jvm-070** (was concurrency-090): Fixed ID format from `concurrency-090` → `jvm-070` (must match topic 'jvm'), fixed backtick markup `` `ThreadLocal` `` → `{{ThreadLocal}}` in question, removed stray comma before entry. Technical content verified correct: ThreadLocal leak in thread pools, remove() in finally, ScopedValue (Java 21 preview).

- **jvm-071** (was concurrency-091): Fixed ID format from `concurrency-091` → `jvm-071`. Technical content verified correct: commonPool parallelism = cores-1, shared JVM-wide, blocking I/O starves pool, use dedicated executor for I/O.

- **jvm-072** (was concurrency-092): Fixed ID format from `concurrency-092` → `jvm-072`. Technical content verified correct: StructuredTaskScope (Java 21 preview JEP 453) binds subtask lifecycle to scope, auto-cancels on failure/timeout, ShutdownOnFailure/ShutdownOnSuccess policies.

No technical knowledge errors found in answers. Answer length warnings remain (by design, task prohibits expanding content). build-light-index.js fails due to pre-existing syntax errors in q-microservices.js and q-system-design.js (not owned by this task).
