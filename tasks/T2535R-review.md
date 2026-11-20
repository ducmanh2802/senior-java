# T2535R — Fact-check nội dung mới của T2535

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2535 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Reviewed 3 câu hỏi mới trong js/data/q-microservices.js (microservices-120 lead, microservices-121 senior, microservices-122 senior) do T2535 thêm:
- Không có lỗi kỹ thuật: max.poll.interval.ms mặc định 5 phút (300000 ms), rebalance khi bỏ qua poll, head-of-line blocking, consumer ≤ partition, Kafka không có ack per-message/retry-delay/priority native; Share Groups KIP-932 (Kafka 4.x) trạng thái preview được GÁN HẠN đúng.
- microservices-121: commit per message = 1 request broker; AckMode.BATCH/MANUAL, spring.kafka.listener.ack-mode=BATCH, ack.acknowledge() commit offset cuối lô, crash giữa lô → replay → cần upsert idempotent theo eventId — đúng.
- microservices-122: idempotent producer PID + sequence per partition, broker từ chối duplicate seq, max.in.flight=5 giữ thứ tự qua sequence, enable.idempotence mặc định true từ Kafka 3.0 (KIP-447) tự set acks=all/retries Integer.MAX/max.in.flight≤5, consumer vẫn phải dedup — đúng.
- Markup: không backtick, không ${, khối ~~~java cân bằng, bảng hợp lệ, độ dài đáp án > 1500 ký tự.
- Không sửa gì (nội dung đã đúng) → "không có lỗi".
- node scripts/validate.js: không có lỗi nào thuộc q-microservices.js. Lỗi toàn cục (bugs.js bug-047/bug-048) là công việc chưa hoàn thành của task T2532, không nằm ở HEAD và không sở hữu bởi task này — theo AGENTS.md quy tắc 3 không được sửa file khác, để nguyên.
