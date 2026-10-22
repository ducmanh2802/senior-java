# T04 — Nội dung: Microservices

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`

## Mục tiêu
Viết câu hỏi kèm đáp án mẫu cho topic `microservices` theo `AGENTS.md` mục 4–6, ID từ `microservices-001`.
Ví dụ minh hoạ dùng Spring Boot 3 / Spring Cloud / Resilience4j / Kafka. Văn phong theo mẫu `core-001` trong `js/data/q-java.js`.

## Danh sách câu hỏi (≥ 16 câu, bắt buộc bao phủ)
- Monolith vs microservices vs modular monolith: khi nào KHÔNG nên tách microservices
- Xác định service boundary: DDD bounded context, database-per-service
- Giao tiếp sync (REST/gRPC) vs async (messaging): trade-off, coupling
- Distributed transaction: vì sao tránh 2PC; Saga (choreography vs orchestration), compensation
- Transactional Outbox pattern & CDC (Debezium); vấn đề dual-write
- Idempotency: idempotency key, consumer idempotent, exactly-once "hiệu quả"
- Resilience: timeout, retry (exponential backoff + jitter), circuit breaker, bulkhead, fallback (Resilience4j)
- Retry storm / cascading failure: nguyên nhân & cách ngăn
- Kafka: partition, ordering, consumer group, offset commit, delivery semantics, rebalancing, DLQ
- Kafka vs RabbitMQ vs SQS/SNS: chọn thế nào
- API Gateway, BFF, service discovery, client-side vs server-side load balancing
- Distributed tracing & observability (OpenTelemetry, correlation id, RED/USE metrics)
- Bảo mật giữa các service: OAuth2 client credentials, mTLS, service mesh
- Versioning API & backward compatibility (consumer-driven contract testing)
- Data consistency khi đọc: CQRS, event sourcing: lợi ích & chi phí
- Deploy: blue-green, canary, feature flag; rollback khi có migration DB
- Chiến lược migrate monolith sang microservices (strangler fig)
- Config & secret tập trung, 12-factor app

## Notes
- Đã viết 18 câu (`microservices-001` … `microservices-018`), phủ đủ 18 chủ đề bắt buộc; level: 4 mid / 10 senior / 4 lead (~22/56/22%).
- Mỗi đáp án mở đầu `**Tóm tắt:**`, đi sâu bằng `###` (cơ chế + vì sao, bảng trade-off, sơ đồ ASCII, pitfall production), code ≤ 30 dòng (Spring Boot 3, Spring Cloud Gateway, Resilience4j, Spring Kafka, Debezium/outbox, Flyway/expand-contract), kết thúc `> Senior tip:`; độ dài 2300–3370 ký tự/câu; mỗi câu có 3 follow-up + tags.
- `node scripts/validate.js q-microservices.js` → `OK — không có lỗi.` (0 cảnh báo). Lưu ý: lúc chạy full `node scripts/validate.js`, các file của task khác (`q-concurrency-jvm.js`, `q-aws.js`) đang được agent khác ghi dở nên báo lỗi cú pháp tạm thời — không thuộc quyền sở hữu của T04, không sửa.
- Không sửa file nào ngoài `js/data/q-microservices.js` và file task này; không commit.
