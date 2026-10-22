# T49 — Nội dung: Microservices (đợt 2)

Status: TODO
Agent: opencode
Owns: `js/data/q-microservices.js`

> **Ghi theo lô nhỏ:** thêm **2 câu mỗi lần edit** (đáp án dài). Sau mỗi lô chạy `node --check <file>` và `node scripts/validate.js <file>`.

Đọc kỹ `AGENTS.md` mục 4–6 (schema, markup, **chuẩn chất lượng**) trước khi viết.

## Mục tiêu
Ngân hàng câu hỏi đã có sẵn câu ở các topic dưới đây. **Chỉ THÊM câu mới vào cuối mảng**, không sửa/xoá câu cũ.
ID tiếp nối số lớn nhất đang có trong topic (ví dụ đang có `core-011` thì bắt đầu từ `core-012`).
**Đọc lướt câu hỏi đã có trong file trước** để không viết trùng ý.

### topic `microservices`: thêm 10 câu (đang có 18 → mục tiêu ≥ 28)
- Kafka: chọn số partition, consumer rebalance (cooperative sticky), {{max.poll.interval.ms}}, static membership
- Retry topic và DLQ trong Kafka (Spring Kafka {{@RetryableTopic}}): blocking vs non-blocking retry, giữ ordering
- Schema evolution: Avro/Protobuf + Schema Registry, backward/forward compatibility
- Inbox pattern và idempotent consumer bằng bảng processed_message; so với outbox
- Choreography vs orchestration (Temporal, Camunda): khi nào cần workflow engine
- Kubernetes cho Java dev: liveness vs readiness vs startup probe, resource request/limit, graceful shutdown với preStop
- Timeout budget và deadline propagation qua nhiều hop; vì sao timeout phải giảm dần theo chiều sâu
- Bulkhead và giới hạn concurrency: thread pool riêng vs semaphore; chống một downstream chậm kéo sập cả service
- Tách bounded context: dấu hiệu chia sai service (chatty, distributed monolith) và cách gộp/tách lại
- Query dữ liệu nằm rải rác nhiều service: API composition vs read model (CQRS view) vs data lake

## Yêu cầu chất lượng (quan trọng nhất)
- Mỗi đáp án **1500–4000 ký tự**: `**Tóm tắt:**` trả lời miệng 30 giây, rồi các mục `###` giải thích cơ chế **và vì sao**, ví dụ code ngắn có comment, bảng trade-off, pitfall production, kết bằng `> Senior tip:`.
- Câu hỏi theo kiểu phỏng vấn thật (tình huống, so sánh, "bạn sẽ làm gì"), không hỏi định nghĩa suông. Bối cảnh ưu tiên ngân hàng, fintech, e-commerce Việt Nam.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6. **Không bịa API, flag hay số liệu**; không chắc thì viết ít lại nhưng đúng.
- `follow`: 2–3 câu hỏi đào sâu. Level xen kẽ: khoảng 25% mid, 55% senior, 20% lead.

## Nghiệm thu
`node scripts/validate.js` → OK và số câu mỗi topic đạt mục tiêu. Integrator sẽ fact-check sau.

## Notes
