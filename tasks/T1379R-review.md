# T1379R — Fact-check nội dung mới của T1379

Status: DONE
Agent: opencode
Owns: `js/data/q-remote.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1379 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Reviewed T1379 new content in q-remote.js (remote-061 → remote-067: supply chain section, 2 ví dụ đời thực, 2 trả lời mẫu, 1 senior tip in remote-061; chi phí ẩn/capacity planning + ví dụ + trả lời mẫu + senior tip in remote-062; CHECK constraint in remote-063; distributed lock + ví dụ + trả lời mẫu + senior tip in remote-064; Escrow def + pricing/retainer + ví dụ + trả lời mẫu + senior tip in remote-065; Residual risk def + ma trận risk communication + ví dụ + trả lời mẫu + senior tip in remote-066; Strangler Fig def + exit criteria + ví dụ + trả lời mẫu + senior tip in remote-067).

Lỗi đã sửa:
- remote-061 (id: remote-061): `~~~javascript` code fence (2 lần, dòng ~5976 và ~5986) → `~~~text`. AGENTS.md §5 chỉ hỗ trợ java|sql|yaml|json|bash|text cho `~~~`. Giữ `\${userId}` đã escape đúng trong template literal.

Không có lỗi kiến thức kỹ thuật (API, mặc định, cơ chế, số liệu) trong nội dung mới. Tất cả thuật ngữ (Stripe webhook, pg_stat_statements, EXPLAIN ANALYZE, CREATE INDEX CONCURRENTLY, Redis SETNX/Redlock, UNIQUE/CHECK constraint, idempotency key, Strangler Fig Pattern) đúng chuẩn.

Khó khăn / chặn nghiệm thu:
- `node scripts/build-light-index.js` crash do lỗi cú pháp cũ trong `q-system-design.js` (line ~5550: `SET processed_req` — file không thuộc task này, không được sửa). Do đó `index-light.js` vẫn cũ so với q-remote.js; validate.js báo `index-light.js: đã cũ`.
- validate.js không in OK do lỗi cũ trong các file khác (q-system-design.js, lessons-architecture.js, projects.js, path.js) — không thuộc phạm vi task này.
- `node scripts/test-lessons.js`: không chạy hết được (timeout 180s, 196 bài học × compile Java). q-remote.js không chứa lessons nên không liên quan đến thay đổi này.
