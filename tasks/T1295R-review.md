# T1295R — Fact-check nội dung mới của T1295

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1295 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK (với file sở hữu). Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Phạm vi: chỉ `js/data/q-system-design.js` (diff HEAD thêm 6 block "Ví dụ đời thực" + "Trả lời mẫu khi phỏng vấn" cho `architecture-006,007,008`, `design-014,015,016`). Không sửa nội dung đã có ở HEAD (chỉ nội dung mới được chỉnh; 2 dòng `> Senior tip:` của design-015/016 xuất hiện trong diff do vị trí, nội dung tip giữ nguyên ý).
- `node --check js/data/q-system-design.js` OK. `node scripts/build-light-index.js` đã chạy. `node scripts/validate.js` không còn lỗi thuộc `q-system-design.js`; còn 4 lỗi `lessons-testing.js: lesson-testing-005.body` (inline `{{}}` lồng nhau) là lỗi có sẵn ngoài phạm vi sở hữu, chưa sửa.
- **design-014 (chuyển tiền liên ngân hàng/NAPAS):** thay từ lẫn tiếng Anh "thinking rằng" → tiếng Việt; giải thích thuật ngữ lần đầu (timeout/hết thời gian chờ phản hồi, hold/tiền bị giữ, settlement/đối soát cuối ngày, reversal/giao dịch đảo chiều, inquiry/bản tin truy vấn trạng thái, backoff/chờ tăng dần, retry/thử lại, metric, runbook/quy trình xử lý sự cố, state machine/máy trạng thái). Kiểm tra kỹ thuật: UNKNOWN phải giữ hold, không tự FAILED; inquiry trước khi kết luận; reversal khi settlement cho thấy đã thành công — đúng nguyên tắc an toàn giao dịch.
- **architecture-007 (ADR/RFC, Kafka vs RabbitMQ):** sửa mô tả sai lệch kỹ thuật RabbitMQ ("durable nhưng không set auto-delete=false và không có mirrored queue" gây hiểu nhầm; `auto-delete` không phải cờ độ bền message; mirrored/classic HA queue là cơ chế cũ). Viết lại chính xác: queue durable, message cần publish persistent; queue không sao chép (quorum queue/mirrored) nên không có bản sao; vấn đề replay là do RabbitMQ xoá message sau ack (mặc định) còn Kafka giữ theo retention/offset — phù hợp mục đánh giá replay/throughput trong ADR. Giải thích thuật ngữ (broker, queue, message, ack, replay, throughput, outbox table, event bus, migration, retention, supersede).
- **design-015 (Snowflake ID):** giải thích thuật ngữ (instance, pod/Kubernetes, crash, worker ID, timestamp, sequence, insert, constraint/ràng buộc unique, lease, TTL, clock skew/đồng hồ lệch, NTP, fail-fast, UUIDv7/RFC 9562). Cơ chế giữ nguyên, đúng: hash IP có thể trùng khi K8s tái dùng IP; clock lùi cần giữ lastTimestamp/chờ/dừng; lease/StatefulSet ordinal/UUIDv7 là các hướng hợp lệ.
- **design-016 (đặt vé):** giải thích thuật ngữ (HELD/giữ chỗ, bot, callback, cache/stale, virtual waiting room/phòng chờ ảo, idempotent, TTL, pub/sub, conditional UPDATE, race condition, unique constraint, distributed lock). Sửa số liệu diễn đạt: "500.000 request/giây xuống 2.000 request/giây" (dễ gây hiểu nhầm đơn vị) → "từ mức bùng nổ xuống còn khoảng 2.000 yêu cầu/phút (được phòng chờ điều tiết)". Cơ chế conditional UPDATE + hold + callback idempotent + waiting room đúng.
- **architecture-006 (technical debt/refactor):** giải thích thuật ngữ (monolith, deploy/phát hành, p99, unit/integration test, nợ kỹ thuật, branch by abstraction, characterization test/golden master, implementation, feature flag, refactor, rollback, PR, business rule, hotspot/git churn/cyclomatic complexity, trade-off). Chiến lược branch by abstraction + characterization test + feature flag + PR nhỏ đúng thực hành.
- **architecture-008 (distributed monolith/anti-pattern):** giải thích thuật ngữ (fintech, microservice, database schema, deploy, crash, p99 end-to-end, dependency, mock, distributed monolith, coupling, boundary/business capability, event, contract/OpenAPI/schema event, contract testing, deploy independence, God class/change magnet, anemic domain model/invariant/aggregate/value object, DB per service). Đúng kỹ thuật.
