# T1726 — Kiến thức: 6 câu hỏi API nâng cao

Status: DONE
Agent: kilo
Owns: `js/data/q-api.js`

Thêm **6 câu hỏi phỏng vấn mới** (topic: api) vào `js/data/q-api.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-api.js`); đọc danh sách để **không trùng ý**.

Chủ đề: thiết kế API cho mobile chậm/mất mạng (retry an toàn, idempotency), GraphQL vs REST khi nào chọn, API rate limit trả header gì, long-running operation (202 + polling vs webhook), upload file lớn (multipart, resumable, presigned URL), API cho AI streaming (SSE vs WebSocket).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → code Java ngắn có comment hoặc sơ đồ (~~~seq cho luồng nhiều bên) → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, vài câu lead.

> **Quan trọng:** KHÔNG đọc toàn bộ `js/data/q-api.js` (file lớn, sẽ hết lượt). Xem danh sách bằng `node scripts/qtool.js list js/data/q-api.js`, xem một mục mẫu bằng `node scripts/qtool.js show js/data/q-api.js <id>`, rồi viết ngay vào file tạm và chạy `qtool.js append`.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/q-api.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-api.js logs/tmp-T1726.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 6 câu vào `js/data/q-api.js` (id nối tiếp api-054):
  - `api-055` (senior): retry + idempotency cho app mobile mất mạng — idempotency key lưu write-ahead, bảng dedup unique, 409/422, backoff + jitter, hàng đợi offline.
  - `api-056` (lead): GraphQL vs REST — khi nào GraphQL thắng, chi phí cache/CDN/rate limit/N+1/schema, code Spring for GraphQL.
  - `api-057` (senior): header rate limit — `Retry-After`, `RateLimit-Policy`, `RateLimit` (draft IETF httpapi), legacy `X-RateLimit-*`, filter Spring, pitfall multi-instance.
  - `api-058` (lead): tác vụ chạy lâu — tách job/attempt, `FOR UPDATE SKIP LOCKED`, lease + heartbeat + reaper, outbox, key S3 cố định, polling/webhook/SSE.
  - `api-059` (senior): upload 2 GB — S3 multipart + presigned URL (`S3Presigner.presignUploadPart`), resume theo part, tus (`Upload-Offset`, `HEAD`/`PATCH`, 409/412), lifecycle abort.
  - `api-060` (senior): API streaming cho AI — SSE vs WebSocket vs NDJSON, Spring AI `Flux<String>` + `ServerSentEvent`, `doOnCancel` để hủy upstream, usage ở `message_delta`, heartbeat/buffering.
- Mỗi câu có `**Tóm tắt:**`, cơ chế từng bước, code Java/`~~~seq`, bảng trade-off, pitfall, `### Ví dụ đời thực`, `### Trả lời mẫu khi phỏng vấn`, `> Senior tip:`, 3 câu `follow`.
- Nghiệm thu: `node scripts/build-light-index.js` (đã chạy) và `node scripts/validate.js` → `OK — không có lỗi.`
- Không commit; chỉ sửa `js/data/q-api.js` và file sinh `js/data/index-light.js`.
Reviewed-by: kilo (T1726R)
