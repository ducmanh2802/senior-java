# T2473R — Fact-check nội dung mới của T2473

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2473 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- microservices-086: Không có lỗi kỹ thuật. Nội dung về Transactional Outbox vs CDC Debezium đúng chuẩn (dual-write problem, polling relay với FOR UPDATE SKIP LOCKED, Debezium đọc WAL/binlog, Outbox Event Router SMT, replication slot, max_slot_wal_keep_size).
- microservices-087: Không có lỗi kỹ thuật. Nội dung về exactly-once vs at-least-once đúng chuẩn (Two Generals problem, Kafka transaction chỉ trong Kafka, effective exactly-once qua idempotent consumer, Spring Kafka AckMode.RECORD mặc định, processed_event table pattern).
- Sửa typo markup: "bảo bảo" → "bảo chỉ" ở dòng 7567 (microservices-087, thuật ngữ Exactly-once end-to-end).
- Chạy `node scripts/build-light-index.js` để cập nhật index-light.js.
- `node scripts/validate.js` → OK cho q-microservices.js.
