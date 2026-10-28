# T330 — Kafka internals + chuyển từ sync sang async job

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`, `js/data/q-system-design.js`

Áp dụng đúng mục "Nguồn tham khảo và bản quyền" và "Bước 1: chống trùng" trong `tasks/T329-db-internals-zemit.md`:
- Chủ đề lấy từ series ZemIT, nhưng tự viết từ kafka.apache.org/documentation, không chép.
- Chỉ được gắn bài miễn phí https://zemit.substack.com/p/kafka-a-co-queue-that-va-ban-van làm `refs` (type `article`), kèm docs Kafka chính thức.
- Chạy `node scripts/check-links.mjs` cho từng file.

**`js/data/q-microservices.js`** (topic `microservices`, id tiếp số lớn nhất), tối đa 5 câu:
- Kafka broker: log segment, page cache, zero-copy (sendfile), ISR, `acks`, `min.insync.replicas`, retention / compaction; vì sao Kafka nhanh dù ghi xuống đĩa.
- Kafka producer: partitioner (sticky), record accumulator, `batch.size` / `linger.ms`, `max.in.flight.requests.per.connection` và thứ tự, idempotent producer, transactions.
- Consumer group và rebalance: eager vs cooperative-sticky, `max.poll.interval.ms`, static membership; vì sao xử lý lâu gây rebalance liên tục.
- Vì sao không nên dùng Kafka làm work queue: head-of-line blocking theo partition, retry/DLQ phải tự làm, scale bị giới hạn bởi số partition. Queues for Kafka (share groups, KIP-932) giải quyết được gì và còn hạn chế gì: chỉ viết đúng như docs Kafka hiện hành, không chắc thì viết ít lại.

**`js/data/q-system-design.js`** (topic `design`), tối đa 2 câu:
- Chuyển một API đồng bộ chạy lâu sang async: bảng jobs (trạng thái, lease/heartbeat), worker lấy job bằng `SELECT … FOR UPDATE SKIP LOCKED`, reaper thu hồi job treo, status API / webhook, idempotency, retry có backoff.
- So sánh hàng đợi bằng DB, bằng Redis Streams, bằng message broker (RabbitMQ/SQS) và bằng Kafka cho background job: khi nào chọn cái nào.

Chuẩn đáp án như AGENTS.md mục 6. Ghi file theo đợt, sau mỗi đợt chạy `node --check` + `node scripts/validate.js`. Ghi Notes, `Status: DONE`.

## Notes

- Thêm `microservices-047` (broker: segment, page cache, zero-copy, ISR/HW, acks, min.insync.replicas), `microservices-048` (producer: sticky partitioner, accumulator, batch.size/linger.ms, nén, in-flight + idempotence), `microservices-049` (Kafka làm work queue + share group KIP-932, chỉ ghi early access 4.0 / preview 4.1, khuyên kiểm tra release notes).
- Thêm `design-028` (sync → async: 202 + status API, bảng jobs, SKIP LOCKED, lease/heartbeat + fencing, reaper, backoff, webhook) và `design-029` (so sánh bảng DB / Redis Streams / RabbitMQ-SQS / Kafka cho background job).
- Bỏ qua (đã có): consumer group & rebalance eager/cooperative/static membership/max.poll.interval.ms → `microservices-009`, `-019`, `-030`; transactions/idempotent chi tiết → `-031`; retention/compaction → `-033`. Async job tránh lặp `design-013` (scheduler) bằng cách tập trung hợp đồng API + fencing.
- `node --check` cả 2 file OK; `node scripts/validate.js` → OK; check-links: q-microservices 91 link hỏng 0 (KIP-932 cwiki timeout ở script, curl xác nhận 200), q-system-design 98 link hỏng 0.
Reviewed-by: claude (subagent; validate OK, check-links 0 broken)
