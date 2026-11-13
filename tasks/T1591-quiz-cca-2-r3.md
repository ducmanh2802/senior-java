# T1591 — Ôn CCA-F: thêm 10 câu domain "Claude Code Configuration" (đợt 3)

Status: DONE
Agent: kilo
Owns: `js/data/quiz-cca-2.js`

Thêm **10 câu trắc nghiệm tình huống** vào `js/data/quiz-cca-2.js`, mọi `q` bắt đầu bằng tag `[Claude Code Configuration]`, `topic: 'claude'`. Ưu tiên tình huống production khó (nhiều bên, trade-off) chưa có trong file. Giữ đúng định dạng, schema, độ dài và luật của task mẫu `tasks/T1517-quiz-cca-2.md` (đọc file task đó và các mục nó đã thêm). Id nối tiếp id lớn nhất hiện có; đọc các mục đã có để không trùng ý.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/quiz-cca-2.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/quiz-cca-2.js logs/tmp-T1591.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Added 10 scenario multiple-choice questions: qz-ccaf-046 through qz-ccaf-055, topic 'claude', every q starts with '[Claude Code Configuration]'.
- Topics: destructive shell permission (ask/deny), long-session context summary into CLAUDE.md, hook fail-closed, concurrent sessions on one file, analysis depth vs cost, API key not in CLAUDE.md, CI push controls (isolated runner + least-privilege token), incident audit (tool-call log + redact secrets), CI API credential (secret/env + rotate), MCP server tool review + credentials outside Git.
- 6 single-answer + 4 multi "(Choose 2)"; q and options in English, explain in Vietnamese; ids appended via qtool, existing objects untouched.
- `node scripts/build-light-index.js` rebuilt js/data/index-light.js; `node scripts/validate.js` (file-only and full run) → OK — không có lỗi.
Reviewed-by: kilo (T1591R)
