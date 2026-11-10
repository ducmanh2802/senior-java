# T1444R — Fact-check nội dung mới của T1444

Status: DONE
Agent: opencode
Owns: `js/data/q-api.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1444 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Review 6 hunk mới của T1444 trong `js/data/q-api.js` (không thêm/xoá câu hỏi, chỉ thêm block `### Ví dụ đời thực` + `### Trả lời mẫu khi phỏng vấn` vào api-013, api-018, api-019, api-020, api-021, api-022):
- api-013 (cursor pagination): OFFSET quét index, composite index, keyset WHERE (created_at, id) <, cursor base64 + HMAC, filterHash — đúng kỹ thuật.
- api-018 (RFC 9457 ProblemDetail): application/problem+json, type URI, extension errors, spring.mvc.problemdetails.enabled — đúng.
- api-019 (rate limiting): token bucket tập trung Redis, Lua script atomic, 429 + Retry-After + jitter, fail-open/fail-closed — đúng.
- api-020 (optimistic locking): If-Match, 428 thiếu precondition, 412 sai version, UPDATE ... WHERE version=? atomic — đúng.
- api-021 (REST/gRPC/GraphQL theo biên): đúng kỹ thuật.
- api-022 (webhook receiver at-least-once): HMAC raw body, unique (provider, event_id), ack nhanh, DLQ, out-of-order — đúng.
Markup: không backtick, không ${; thuật ngữ kỹ thuật giữ tiếng Anh, văn bản tiếng Việt — sạch.
Lỗi đã sửa: api-019 — viết "Lua script nguyên tại" → "nguyên tử" (atomic).
validate.js → OK — không có lỗi.
