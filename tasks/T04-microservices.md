# T04 — Nội dung: Microservices

Status: TODO
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
(agent ghi chú ở đây)
