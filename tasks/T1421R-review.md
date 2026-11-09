# T1421R — Fact-check nội dung mới của T1421

Status: DONE
Agent: opencode
Owns: `js/data/lessons-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1421 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
không có lỗi — validation OK, lesson tests OK (220/220), syntax check OK. Các bài học mới (lesson-microservices-003 đến 011) đều đúng kỹ thuật: Saga orchestration, Retry/DLQ, Trace context propagation, Idempotency key store (TTL, phantom promotion), Partial success delete (207, compensation ledger), Saga engine (reverse compensation, idempotent guard), Timeout budget (deadline propagation, retry storm), MiniKafka (partition, offset, commit strategy), Idempotent producer (PID, sequence, OUT_OF_ORDER). Không có lỗi markup, không có từ nước ngoài lẫn vào.
