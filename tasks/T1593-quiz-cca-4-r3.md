# T1593 — Ôn CCA-F: thêm 10 câu domain "Tool Design & MCP" (đợt 3)

Status: DONE
Agent: kilo
Owns: `js/data/quiz-cca-4.js`

Thêm **10 câu trắc nghiệm tình huống** vào `js/data/quiz-cca-4.js`, mọi `q` bắt đầu bằng tag `[Tool Design & MCP]`, `topic: 'claude'`. Ưu tiên tình huống production khó (nhiều bên, trade-off) chưa có trong file. Giữ đúng định dạng, schema, độ dài và luật của task mẫu `tasks/T1519-quiz-cca-4.md` (đọc file task đó và các mục nó đã thêm). Id nối tiếp id lớn nhất hiện có; đọc các mục đã có để không trùng ý.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/quiz-cca-4.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/quiz-cca-4.js logs/tmp-T1593.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm 10 câu `qz-ccat-042` … `qz-ccat-051` vào `js/data/quiz-cca-4.js`: 7 câu một đáp án, 3 câu `multi: true` (Chọn 2); mọi `q` bắt đầu bằng `[Tool Design & MCP]`, `topic: 'claude'`.
- Chủ đề chính: MCP error handling (tool execution error `isError` vs JSON-RPC protocol error), token passthrough/confused deputy, local HTTP MCP + DNS rebinding/Origin, trùng tên tool giữa các server (namespacing), MCP roots và ranh giới filesystem, sampling có human-in-the-loop, validate outputSchema/structuredContent, cancellation/checkpoint, managed MCP allowlist, `disable_parallel_tool_use`.
- Đã đọc các câu `quiz-claude.js`, `quiz-cca-3.js`, `quiz-cca-5.js` để tránh trùng ý; nội dung đối chiếu tài liệu MCP 2025-06-18 và Claude API tool-use hiện hành.
- `node --check js/data/quiz-cca-4.js`, `node scripts/qtool.js check js/data/quiz-cca-4.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → `OK — không có lỗi.` Không commit.
Reviewed-by: kilo (T1593R)
