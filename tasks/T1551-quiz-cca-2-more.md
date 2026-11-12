# T1551 — Ôn CCA-F: thêm 15 câu domain "Claude Code Configuration" (đợt 2)

Status: DONE
Agent: kilo
Owns: `js/data/quiz-cca-2.js`

Thêm **15 câu trắc nghiệm tình huống** vào `js/data/quiz-cca-2.js`, id nối tiếp id lớn nhất trong file, `topic: 'claude'`, mọi `q` bắt đầu bằng tag `[Claude Code Configuration]`. Đọc các câu đã có trong file để **không trùng tình huống**; giữ đúng định dạng và chất lượng của task trước (tasks/T1517-*.md): q/options tiếng Anh, explain tiếng Việt giải thích vì sao đúng và vì sao từng phương án sai; khoảng 3/4 câu một đáp án, còn lại multi (Chọn 2). Chỉ dùng tính năng có thật của Claude API / Agent SDK / Claude Code / MCP; không chắc thì viết ở mức nguyên lý.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/quiz-cca-2.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/quiz-cca-2.js logs/tmp-T1551.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Added `qz-ccaf-031` through `qz-ccaf-045` (15 scenario questions) covering `/init`, MCP project/user configuration and diagnostics, plugin review, instruction imports and discovery, trust, and API-vs-Claude-Code configuration.
- Rebuilt `js/data/index-light.js`; `node scripts/validate.js` prints `OK — không có lỗi.`; `node --check` and `qtool check` pass for the quiz file.
Reviewed-by: kilo (T1551R)
