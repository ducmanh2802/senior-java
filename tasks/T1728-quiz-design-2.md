# T1728 — Trắc nghiệm: 15 câu system design (đợt 2)

Status: DONE
Agent: kilo
Owns: `js/data/quiz-design.js`

Thêm **15 câu trắc nghiệm tình huống** (topic design/architecture) vào `js/data/quiz-design.js`: hệ phân tán (consistent hashing, quorum, CDC, exactly-once), thiết kế API, và hệ thống có LLM. Giữ đúng định dạng, schema, độ dài và luật của task mẫu `tasks/T1587-quiz-design-sd.md`. Id nối tiếp id lớn nhất hiện có; không trùng ý với mục đã có.

> **Quan trọng:** KHÔNG đọc toàn bộ `js/data/quiz-design.js` (file lớn, sẽ hết lượt). Xem danh sách bằng `node scripts/qtool.js list js/data/quiz-design.js`, xem một mục mẫu bằng `node scripts/qtool.js show js/data/quiz-design.js <id>`, rồi viết ngay vào file tạm và chạy `qtool.js append`.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/quiz-design.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/quiz-design.js logs/tmp-T1728.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 15 câu (topic `design`), id nối tiếp sau `qz-design-035`: `qz-design-036` … `qz-design-050`.
- 3 câu một đáp án (single, 4 options): `qz-design-038` (keyset/cursor pagination, answer 0), `qz-design-042` (token bucket rate limit, answer 0), `qz-design-047` (cache TTL vs tồn kho/oversell, answer 0).
- 12 câu multi: `qz-design-036` (acks/min.insync.replicas/quorum, [0,1]), `qz-design-037` (REST API design/HTTP method/status, [0,3]), `qz-design-039` (pgvector metrics, [0,1,2] - Chọn 3), `qz-design-040` (RAG authz/ACL), `qz-design-041` (LLM streaming/timeout/fallback), `qz-design-043` (multipart/pre-signed upload), `qz-design-044` (CDC vs poll), `qz-design-045` (chat offline/ordering), `qz-design-046` (notification queue/idempotency/DLQ), `qz-design-048` (API error contract), `qz-design-049` (PostgreSQL → Elasticsearch outbox/reconciliation), `qz-design-050` (Saga compensation).
- Chủ đề bao phủ đúng yêu cầu: hệ phân tán (quorum/Kafka, consistent hashing đã có ở câu cũ nên chỉ thêm các phần còn thiếu), thiết kế API (REST, pagination, error contract, upload lớn), CDC, exactly-once/không mất tin (chat, notification), và hệ thống có LLM (RAG authz, streaming/độ trễ).
- Không trùng ý với `qz-design-007`..`qz-design-035`: đã đọc `list` toàn bộ và `show` các câu liên quan (009 consistent hashing, 019 sharding, 020 job duplication, 022 chat, 024 consistency, 026 Kafka ordering, 031 RAG, 032-035 LLM) trước khi viết.
- Explain viết chi tiết tiếng Việt cho dev ~4 năm: giải thích thuật ngữ ở lần đầu (ISR, quorum, WAL, CDC, TTFT, outbox, DLQ, ETag...), có mục `### Giải thích từng bước`, `### Vì sao các phương án khác sai`, `### Ví dụ đời thực` có số liệu, `### Trả lời mẫu khi phỏng vấn` và `> Senior tip:`.
- Không dùng backtick và không dùng `${` trong nội dung; mọi chỗ cần code đều viết bằng `{{code}}` hoặc code fence `~~~`.
- Đã sửa 2 lỗi sau khi append (dùng `qtool.js apply`): thiếu `(Chọn N)` ở 6 câu multi, và một dấu `}` thừa trong `qz-design-036` explain.
- Nghiệm thu: `node scripts/build-light-index.js` (đã sinh lại `js/data/index-light.js`); `node scripts/validate.js` → `OK — không có lỗi.`; `node scripts/qtool.js check js/data/quiz-design.js` → OK. KHÔNG commit.
- File tạm đã xoá sau khi append.
Reviewed-by: kilo (T1728R)
