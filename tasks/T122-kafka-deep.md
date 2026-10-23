# T122 — Kafka & messaging mức Senior

Status: TODO
Agent: codex
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6 và mọi `q:` có sẵn (không trùng). Thêm **~10 câu** topic `microservices` về Kafka 3.x: partition/key và thứ tự, consumer group rebalance (cooperative sticky, static membership), offset commit at-least-once vs exactly-once (idempotent producer, transactions, read_committed), KRaft thay ZooKeeper, retention vs compaction, DLQ với Spring Kafka (DefaultErrorHandler, DeadLetterPublishingRecoverer), backpressure & consumer lag, schema evolution (Avro/Schema Registry compatibility), Kafka vs RabbitMQ vs IBM MQ trong ngân hàng, outbox + Debezium. Có `refs` (kafka.apache.org, docs.spring.io) nếu chắc link. `node scripts/validate.js` + `node scripts/check-links.mjs q-microservices.js` → OK.

## Notes
