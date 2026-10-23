# T122 — Kafka & messaging mức Senior

Status: DONE
Agent: codex
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6 và mọi `q:` có sẵn (không trùng). Thêm **~10 câu** topic `microservices` về Kafka 3.x: partition/key và thứ tự, consumer group rebalance (cooperative sticky, static membership), offset commit at-least-once vs exactly-once (idempotent producer, transactions, read_committed), KRaft thay ZooKeeper, retention vs compaction, DLQ với Spring Kafka (DefaultErrorHandler, DeadLetterPublishingRecoverer), backpressure & consumer lag, schema evolution (Avro/Schema Registry compatibility), Kafka vs RabbitMQ vs IBM MQ trong ngân hàng, outbox + Debezium. Có `refs` (kafka.apache.org, docs.spring.io) nếu chắc link. `node scripts/validate.js` + `node scripts/check-links.mjs q-microservices.js` → OK.

## Notes

- Đã thêm 10 câu Kafka/messaging (microservices-029–038), bao phủ toàn bộ chủ điểm yêu cầu; `node --check js/data/q-microservices.js` và `node scripts/validate.js` đều qua (`OK — không có lỗi.`).
- `node scripts/check-links.mjs q-microservices.js` chạy được nhưng môi trường chặn network (`EACCES`) với cả link mới và link refs cũ; cần kiểm tra URL khi có network.
