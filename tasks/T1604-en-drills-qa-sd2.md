# T1604 — Luyện nói tiếng Anh: 8 bài hỏi–đáp giải thích system design

Status: DONE
Agent: kilo
Owns: `js/data/drills-qa.js`

Thêm **8 bài hỏi–đáp** (kind "qa", theme "design") vào `js/data/drills-qa.js`: giải thích bằng tiếng Anh cách thiết kế URL shortener, chat app, news feed, rate limiter, notification system, payment flow, search autocomplete, file upload lớn. Giữ đúng định dạng, schema, độ dài và luật của task mẫu `tasks/T1555-en-drills-qa-ai-sd.md` (đọc file task đó và các mục nó đã thêm). Id nối tiếp id lớn nhất hiện có; đọc các mục đã có để không trùng ý.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/drills-qa.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/drills-qa.js logs/tmp-T1604.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 8 bài hỏi–đáp `drill-qa-146` đến `drill-qa-153` về thiết kế URL shortener, chat app, news feed, rate limiter đa trung tâm, notification system, payment flow, search autocomplete, và large file upload. Đã chạy `node scripts/build-light-index.js`, `node --check js/data/drills-qa.js` và `node scripts/validate.js`; kết quả validate: `OK — không có lỗi.`
Reviewed-by: check-i18n (translation, no LLM review)
