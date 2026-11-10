# T1337R — Fact-check nội dung mới của T1337

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1337 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Review diff của js/data/q-microservices.js (6 block "Ví dụ đời thực" mới: split Kafka/RabbitMQ/IBM MQ, dedup outbox Debezium theo event ID, multi-tenant RLS + SET LOCAL + FORCE, tenant suspend trả 403 qua OncePerRequestFilter + fail-closed, idempotency key dùng Redis SET NX IN_FLIGHT, servlet body đọc 1 lần qua wrapper). Không tìm thấy lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup hay chữ nước ngoài lẫn vào. node scripts/validate.js → OK. Không sửa gì.
