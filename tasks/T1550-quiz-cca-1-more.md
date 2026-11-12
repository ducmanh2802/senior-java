# T1550 — Ôn CCA-F: thêm 20 câu domain "Agentic Architecture" (đợt 2)

Status: DONE
Agent: kilo
Owns: `js/data/quiz-cca-1.js`

Thêm **25 câu trắc nghiệm tình huống** vào `js/data/quiz-cca-1.js`, id nối tiếp id lớn nhất trong file (`qz-cca-041` đến `qz-cca-065`), `topic: 'claude'`, mọi `q` bắt đầu bằng tag `[Agentic Architecture]`. Đọc các câu đã có trong file để **không trùng tình huống**; giữ đúng định dạng và chất lượng của task trước (tasks/T1516-*.md): q/options tiếng Anh, explain tiếng Việt giải thích vì sao đúng và vì sao từng phương án sai; khoảng 3/4 câu một đáp án, còn lại multi (Chọn 2). Chỉ dùng tính năng có thật của Claude API / Agent SDK / Claude Code / MCP; không chắc thì viết ở mức nguyên lý.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/quiz-cca-1.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/quiz-cca-1.js logs/tmp-T1550.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
Added 25 questions: qz-cca-041 to qz-cca-065. Topics covered: tool_call_timeout handling, Message Batches API, thinking blocks, large response handling, tool_choice, stop_reason, state persistence, stop_sequence, MCP client/server, MCP sampling, agent testing challenges, prompt chaining, cost optimization metrics, agent loop detection, temperature/top_p, MCP advantages, file processing, tool recursion, Claude Code subagent tools restriction.

Single-answer: 20 questions (qz-cca-041 to qz-cca-060)
Multi (Choose 2): 5 questions (qz-cca-061 to qz-cca-065)

Validation passed: `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: kilo (T1550R)
