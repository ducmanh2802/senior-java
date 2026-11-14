# T1724 — AI agent: 6 câu hỏi về agent viết code và tự động hoá dev (11)

Status: DONE
Agent: kilo
Owns: `js/data/q-ai.js`

Thêm **6 câu hỏi phỏng vấn mới** (topic: ai) vào `js/data/q-ai.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-ai.js`); đọc danh sách để **không trùng ý**.

Chủ đề: coding agent hoạt động thế nào (đọc repo, chạy test, sửa, lặp), giới hạn quyền của coding agent trong CI, review code do AI viết, dùng AI sinh test có ý nghĩa, rủi ro bảo mật khi agent chạy lệnh shell, đo hiệu quả AI trong team (lead time, lỗi sau release).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → code Java ngắn có comment hoặc sơ đồ (~~~seq cho luồng nhiều bên) → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, vài câu lead.

> **Quan trọng:** KHÔNG đọc toàn bộ `js/data/q-ai.js` (file lớn, sẽ hết lượt). Xem danh sách bằng `node scripts/qtool.js list js/data/q-ai.js`, xem một mục mẫu bằng `node scripts/qtool.js show js/data/q-ai.js <id>`, rồi viết ngay vào file tạm và chạy `qtool.js append`.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/q-ai.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-ai.js logs/tmp-T1724.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 6 câu: `ai-115` (senior, coding agent loop: đọc repo/chạy test/sửa/lặp), `ai-116` (lead, giới hạn quyền agent trong CI/least privilege), `ai-117` (senior, review code do AI viết), `ai-118` (senior, dùng AI sinh test có ý nghĩa vs an toàn giả, mutation testing), `ai-119` (senior, rủi ro bảo mật khi agent chạy shell & giảm thiểu), `ai-120` (lead, đo hiệu quả AI trong team: lead time, lỗi sau release, DORA, guardrail).
- Mỗi câu có: Tóm tắt, thuật ngữ/giải thích từng bước & VÌ SAO, sơ đồ `~~~seq` hoặc code Java ngắn, bảng trade-off/so sánh, pitfall production, Ví dụ đời thực có số liệu, Trả lời mẫu khi phỏng vấn, `> Senior tip:`, và `follow` (3 câu).
- `node scripts/build-light-index.js` → OK; `node scripts/validate.js` → `OK — không có lỗi.` (ai topic: 120 câu). Chỉ sửa `js/data/q-ai.js` và file task này.
Reviewed-by: kilo (T1724R)
