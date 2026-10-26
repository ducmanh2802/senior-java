# T115 — Track bài học `microservices`: pattern phân tán bằng Java thuần

Status: DONE
Agent: codex
Owns: `js/data/lessons-microservices.js`, `index.html` (integrator đã gắn script tag)

Đọc AGENTS.md mục **12** và bài mẫu `lesson-collections-001`. Tạo file mới `js/data/lessons-microservices.js` (KHÔNG sửa index.html — integrator sẽ gắn script tag). Viết **5 bài** `lesson-microservices-001..005` (track `microservices`, order 1..5), mỗi bài 1–2 bài tập tự chấm:
1. Transactional outbox: ghi nghiệp vụ + outbox cùng "transaction" (mô phỏng bằng Map + lock), relay đọc outbox gửi đi đúng một lần.
2. Idempotent consumer: nhận message trùng / sai thứ tự (at-least-once), dedup bằng messageId, xử lý version.
3. Saga orchestration có bù trừ (compensation) khi bước 3 lỗi: đặt hàng → trừ tiền → giữ kho.
4. Retry + dead letter queue: số lần thử, backoff (đồng hồ giả), poison message.
5. Truyền trace context (traceId/spanId) qua các "service" và thread pool (MDC-like ThreadLocal, bẫy mất context khi đổi thread).
Body nêu công cụ production (Kafka, Debezium, Spring Cloud Stream, OpenTelemetry…) chính xác; bài tập chỉ JDK chuẩn, Java 17, deterministic.

## Nghiệm thu
`node scripts/test-lessons.js` và `node scripts/validate.js` → OK.

## Notes
- Đã tạo đủ 5 bài và 5 bài tập Java 17; tự biên dịch starter/reference và chạy các bộ test T115, tất cả reference pass.
- `node scripts/validate.js` hiện báo `lessons-microservices.js: file không được khai báo trong index.html`. Task quy định không sửa `index.html` và integrator sẽ gắn script tag; cần integrator thêm file này vào index rồi chạy lại validator.
Reviewed-by: claude (T115R)
Verify-failed: 2026-10-24 09:07:58
