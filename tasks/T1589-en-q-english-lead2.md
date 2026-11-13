# T1589 — Phỏng vấn tiếng Anh: 4 câu cấp lead về dẫn dắt kỹ thuật

Status: DONE
Agent: kilo
Owns: `js/data/q-english.js`

Thêm **4 câu** (level lead) vào `js/data/q-english.js`: how do you set technical direction for a team; tell me about a time you introduced AI tools into your team workflow; how do you handle a production incident as the lead; how do you grow senior engineers. Giữ đúng định dạng, schema, độ dài và luật của task mẫu `tasks/T1460-en-q-english-lead-1.md` (đọc file task đó và các mục nó đã thêm). Id nối tiếp id lớn nhất hiện có; đọc các mục đã có để không trùng ý.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/q-english.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-english.js logs/tmp-T1589.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Added `english-202` (lead, en): how do you set technical direction for a team.
- Added `english-203` (lead, en): tell me about a time you introduced AI tools into your team workflow.
- Added `english-204` (lead, en): how do you handle a production incident as the lead.
- Added `english-205` (lead, en): how do you grow senior engineers.
- Each question includes required sections: **Tóm tắt**, ### Sample answer (150–220 words, EN, metrics, trade-offs, lesson), ### Useful phrases (5–8), ### Lỗi người Việt hay mắc (2–4), and final `> Senior tip:` (VI).
- Appended via `node scripts/qtool.js append js/data/q-english.js logs/tmp-T1589.js`; temp file `logs/tmp-T1589.js` left as artifact.
- Ran `node scripts/build-light-index.js` and `node scripts/validate.js` → OK — không có lỗi.
- No other files modified; no git commands run.
Reviewed-by: check-i18n (translation, no LLM review)
