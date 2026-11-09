# T1366R — Fact-check nội dung mới của T1366

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1366 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 3 câu hỏi mới của T1366 (microservices-055, 056, 057):
- **microservices-055** (consumer lag): Cơ chế hot key, partition assignment, pause/resume backpressure, metrics records-lag/records-lag-max, tuning max.poll.records — **đúng kỹ thuật**.
- **microservices-056** (data loss/unclean election): ISR shrink, min.insync.replicas=1 cho ack chỉ leader, unclean election hạ HW, truncate khi rejoin, leader epoch (KIP-101) không cứu dữ liệu chỉ trên leader cũ, cấu hình an toàn acks=all+minISR=2+unclean=false, NotEnoughReplicas trade-off, metrics UnderReplicatedPartitions/UnderMinIsrPartitionCount/UncleanLeaderElectionsPerSec — **đúng kỹ thuật**.
- **microservices-057** (EOS vs effectively-once): Kafka transaction chỉ bao phủ Kafka-internal, side effect (HTTP/DB/email) ngoài tầm kiểm soát, crash trước commitTransaction gây duplicate, effectively-once = at-least-once + idempotency key, key ổn định (topic-partition-offset/eventId), UUID.randomUUID() mỗi retry vô dụng, outbox/inbox pattern, read_committed isolation — **đúng kỹ thuật**.

Markup: dùng {{code}}, ###, ~~~, >, |table|, ~~~seq — **hợp lệ**. Không có chữ nước ngoài lẫn vào.

Validation: `node scripts/validate.js` → OK. `node scripts/build-light-index.js` → OK.
