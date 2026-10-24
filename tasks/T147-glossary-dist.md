# T147 — Từ điển thuật ngữ: thanh toán, hệ phân tán, microservices

Status: TODO
Agent: opencode
Owns: `js/data/glossary-dist.js`

Đọc comment schema đầu file (đã có sẵn, rỗng, đã gắn index.html), AGENTS.md mục 5 (markup) và 13 (refs). Người đọc: dev Java junior người Việt, chưa từng nghe thuật ngữ này. Thêm **~35 entry** vào `glossary-dist.js`: idempotency, idempotency key, payment intent, retry + exponential backoff, at-least-once / at-most-once / exactly-once delivery, dead letter queue, transactional outbox, saga (orchestration/choreography), two-phase commit, eventual consistency, strong consistency, CAP, distributed lock, leader election, circuit breaker, bulkhead, rate limiting, backpressure, message broker, consumer group, partition, offset, event sourcing, CQRS, API gateway, service discovery, double-entry ledger, reconciliation (đối soát), chargeback, webhook, correlation id, distributed tracing, timeout budget, fan-out.

Mỗi entry: `short` 1 câu dễ hiểu không dùng thuật ngữ khác; `body` 800–2000 ký tự gồm **### Ví dụ đời thường** (so sánh với đời sống: ngân hàng, quán cà phê, giao hàng…), **### Cơ chế** (từng bước), một sơ đồ ASCII trong `~~~text` (sequence giữa client/server/DB hoặc hộp-mũi-tên), **### Khi nào dùng**, **### Hay nhầm với** (so sánh với thuật ngữ gần nghĩa). `aliases`: viết thường, gồm biến thể số nhiều/viết tắt hay gặp trong đáp án (grep `js/data/q-*.js` để lấy đúng cách viết đang dùng). `related`: id entry khác (trong file này hoặc 2 file glossary còn lại nếu chắc chắn có). `refs` 1–3: ưu tiên tài liệu chính thức và video hội thảo/kênh uy tín; **chỉ link chắc chắn tồn tại** — chạy `node scripts/check-links.mjs js/data/glossary-dist.js` nếu script đã hỗ trợ glossary, không thì tự kiểm tra; không chắc thì bỏ refs. Không backtick, không `${`. `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes
