# T1324R — Fact-check nội dung mới của T1324

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1324 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Reviewed all 27 new questions added in T1324 (microservices-031 through microservices-057). All content is technically accurate for Kafka 3.x/4.x, Spring Boot 3.x, PostgreSQL 15, Redis, and Java 17/21. Key areas verified:

- **Kafka internals**: log segments, page cache, zero-copy, ISR, high watermark, replication factor, min.insync.replicas, unclean leader election, leader epoch (KIP-101)
- **Producer tuning**: sticky partitioner (Kafka 3.3+), linger.ms, batch.size, compression (zstd/lz4), idempotent producer (PID, sequence, epoch), transactions (EOS scope), max.in.flight.requests.per.connection
- **Consumer**: rebalance protocols (eager vs cooperative-sticky), static membership, max.poll.interval.ms vs session.timeout.ms, rebalance loop diagnosis
- **Exactly-once semantics**: idempotent producer vs transactions vs at-least-once + idempotency key; side effects outside Kafka not covered by EOS
- **Outbox + CDC (Debezium)**: WAL, replication slot, LSN, at-least-once delivery, inbox/dedup table with unique constraint in same transaction
- **Ordering & retry**: partition key for per-aggregate ordering, hot partition causes, retry topic reordering risk, per-key blocking / inline retry / state machine solutions
- **Multi-tenancy**: schema-per-tenant vs shared-schema + tenant_id vs RLS, N×M migration formula, hybrid routing with AbstractRoutingDataSource, SET LOCAL for RLS
- **Rate limiting**: token bucket per-tenant in Redis with Lua atomic script, 429 + Retry-After + X-RateLimit-* headers, fail-open with local fallback
- **API contracts**: 207 Multi-Status for partial success, 409 for business conflicts, 403 for suspended tenant, ProblemDetail (RFC 9457) envelope
- **Request ownership**: OncePerRequestFilter, ThreadLocal cleanup, not passing HttpServletRequest to async, ContentCachingRequestWrapper behavior
- **Schema Registry**: FULL_TRANSITIVE for multi-team, Avro default for new fields, alias for rename, CI compatibility checks
- **KRaft migration**: bridge release 3.9, controller quorum, metadata log, finalize step, quorum health monitoring
- **Work queues**: head-of-line blocking, share group (KIP-932) limitations (no ordering, no delay/priority), when to use RabbitMQ/SQS
- **Data loss scenarios**: ISR shrink + unclean election + truncation, alert on UncleanLeaderElectionsPerSec > 0

No technical errors found. Markup validated (no backticks in template literals, proper {{code}}, ~~~ blocks, ### headings). Validation passes: `OK — không có lỗi.`
