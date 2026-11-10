# T1309R — Fact-check nội dung mới của T1309

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1309 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Review toàn bộ 6 mục `### Ví dụ đời thực` mới của T1309 trong js/data/q-microservices.js (câu microservices-025 timeout budget/deadline propagation, 026 Resilience4j bulkhead, 027 phân rã bounded context, 028 API Composition/CQRS/Data Lake, 029 Kafka key-ordering/idempotent producer, 030 cooperative sticky + static membership rebalance).
Kiểm tra: cơ chế kỹ thuật (deadline propagation, timeout giảm dần theo hop, bulkhead semaphore/thread-pool, Little's Law, change coupling, API composition song song+partial response, projection lag/version, Kafka murmur2 key + idempotence mặc định Kafka 3.x, acks=all, CooperativeStickyAssignor rolling 2 bước, group.instance.id/StatefulSet, KIP-848 Kafka 4.x); cờ/mặc định (failureRateThreshold 50%, max.poll.interval.ms 5 phút, session.timeout 45s, heartbeat 10s, max.poll.records 200 — đều hợp lý, đóng vai ví dụ); markup (không có backtick / `${` trong template literal, các `~~~` không bị ảnh hưởng, `> Senior tip` blockquote và `follow`/`tags`/`refs` không thay đổi); chữ nước ngoài (không có câu tiếng lạ, thuật ngữ kỹ thuật giữ tiếng Anh theo quy ước).
Không tìm thấy lỗi kỹ thuật, markup hay ngôn ngữ cần sửa → không chỉnh sửa nội dung (nội dung HEAD giữ nguyên, chỉ T1309 thêm ví dụ).
Xác thực: `node --check js/data/q-microservices.js` sạch; `node scripts/build-light-index.js` (index-light.js không thay đổi vì ví dụ không nằm trong index); `node scripts/validate.js` → OK — không có lỗi. (Cảnh báo path.js lesson-design-006/007 là lỗi cũ, không liên quan file này.)
