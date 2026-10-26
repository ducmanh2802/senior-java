# T149 — Từ điển thuật ngữ: database, hạ tầng, cloud, bảo mật

Status: DONE
Agent: opencode
Owns: `js/data/glossary-infra.js`
Ghi chú: File đã có 37 entry hoàn chỉnh từ lần trước. Kiểm tra lại: tất cả có đủ `short`, `body` (có đủ 5 mục + `~~~text`), `aliases`, `related`, `refs` (1-3 link thật). Không có `\`` hoặc `${` trong body. `node scripts/validate.js` OK. `node --check` OK. `node scripts/check-links.mjs js/data/glossary-infra.js` OK.

Đọc comment schema đầu file (đã có sẵn, rỗng, đã gắn index.html), AGENTS.md mục 5 (markup) và 13 (refs). Người đọc: dev Java junior người Việt, chưa từng nghe thuật ngữ này. Thêm **~35 entry** vào `glossary-infra.js`: ACID, isolation level, MVCC, dirty/non-repeatable/phantom read, index (B-tree), covering index, query plan (EXPLAIN), sharding, partitioning, replication lag, read replica, connection pool exhaustion, cache-aside, cache stampede, TTL, CDN, load balancer, container, Kubernetes pod, readiness/liveness probe, HPA autoscaling, blue-green / canary deployment, infrastructure as code, observability (log/metric/trace), SLO/SLA/SLI, p99 latency, JWT, OAuth2, PKCE, mTLS, secret rotation, IDOR, SSRF, PCI DSS.

Mỗi entry: `short` 1 câu dễ hiểu không dùng thuật ngữ khác; `body` 800–2000 ký tự gồm **### Ví dụ đời thường** (so sánh với đời sống: ngân hàng, quán cà phê, giao hàng…), **### Cơ chế** (từng bước), một sơ đồ ASCII trong `~~~text` (sequence giữa client/server/DB hoặc hộp-mũi-tên), **### Khi nào dùng**, **### Hay nhầm với** (so sánh với thuật ngữ gần nghĩa). `aliases`: viết thường, gồm biến thể số nhiều/viết tắt hay gặp trong đáp án (grep `js/data/q-*.js` để lấy đúng cách viết đang dùng). `related`: id entry khác (trong file này hoặc 2 file glossary còn lại nếu chắc chắn có). `refs` 1–3: ưu tiên tài liệu chính thức và video hội thảo/kênh uy tín; **chỉ link chắc chắn tồn tại** — chạy `node scripts/check-links.mjs js/data/glossary-infra.js` nếu script đã hỗ trợ glossary, không thì tự kiểm tra; không chắc thì bỏ refs. Không backtick, không `${`. `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes
