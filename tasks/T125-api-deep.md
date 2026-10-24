# T125 — API design cho Senior

Status: DONE
Agent: agy
Owns: `js/data/q-api.js`

Đọc AGENTS.md mục 4–6 và mọi `q:` có sẵn trong mọi file q-*.js (không trùng). Thêm **~8 câu** topic `api` (id tiếp nối số lớn nhất hiện có, ~2 mid / 4 senior / 2 lead, đáp án 2500–4000 ký tự, kết bằng `> Senior tip:`): idempotency key cho POST thanh toán, versioning (URI/header) và deprecation, pagination cursor, error model RFC 9457 Problem Details trong Spring Boot 3, rate limiting (token bucket, 429 + Retry-After), ETag/optimistic concurrency (If-Match), REST vs gRPC vs GraphQL trade-off, webhook (ký HMAC, retry, at-least-once). Chỉ dùng API/hành vi bạn chắc chắn đúng (Java 17/21, Spring Boot 3.x, PostgreSQL 16). Không thêm `refs` nếu không chắc link tồn tại. Chạy `node scripts/validate.js` → OK, rồi ghi `Status: DONE` + ghi chú ngắn.

## Notes

- Đã thêm 8 câu `api-015` → `api-022` (id nối tiếp `api-014`), level: 2 mid (015, 016), 4 senior (017–020), 2 lead (021, 022).
- Nội dung: 015 idempotency key cho POST thanh toán (bảng trạng thái, unique index, replay); 016 versioning URI vs header + vòng đời deprecation/brownout/sunset (Deprecation RFC 9745, Sunset RFC 8594); 017 keyset cursor đi sâu (composite index, cursor ký HMAC + filterHash, lỗi mất/trùng dòng); 018 error model RFC 9457 với `ProblemDetail` + `spring.mvc.problemdetails.enabled`; 019 token bucket phân tán bằng Redis Lua, 429 + `Retry-After`/`RateLimit-*`, fail-open vs fail-closed; 020 If-Match/@Version + phân biệt 412/409/428, bulk update có điều kiện; 021 kiến trúc protocol hybrid REST/gRPC/GraphQL theo biên + chi phí vận hành; 022 webhook **receiver** at-least-once (verify raw body HMAC, inbox unique, ack nhanh, DLQ, thứ tự, đối soát).
- Đã đọc toàn bộ 14 câu cũ của `q-api.js` và các file q-* để tránh trùng; các câu gần chủ đề cũ (009 ETag, 011 webhook sender, 013 REST/gRPC/GraphQL, 003 pagination) được viết theo góc khác (receiver-side, conflict UX, kiến trúc theo biên, triển khai keyset) chứ không lặp cơ chế cơ bản.
- Không thêm `refs` (không chắc link tồn tại). Không sửa file nào ngoài `js/data/q-api.js`.
- `node --check js/data/q-api.js` OK; `node scripts/validate.js` → `OK — không có lỗi.` (575 câu hỏi). Đáp án dài ~3.800–4.900 ký tự, có `**Tóm tắt:**`, bảng/code block và kết bằng `> Senior tip:`.

Reviewed-by: opencode (T125R)
