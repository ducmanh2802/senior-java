# T1556 — Phỏng vấn tiếng Anh: 4 câu về AI agent và system design

Status: DONE
Agent: kilo
Owns: `js/data/q-english.js`

Thêm **4 câu hỏi phỏng vấn tiếng Anh** (topic english, lang en, level senior) vào `js/data/q-english.js`: walk me through an AI feature you shipped; how would you design a system to handle 10x traffic; explain a technical trade-off to a product manager; describe how you would monitor an LLM-based service. Giữ đúng định dạng, schema, số lượng từ và luật của task mẫu `tasks/T1501-en-q-english-mid2-1.md` (đọc file task đó và các mục nó đã thêm). Id nối tiếp id lớn nhất hiện có trong file; đọc các mục đã có để không trùng ý.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/q-english.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-english.js logs/tmp-T1556.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm `english-198`–`english-201` (senior, lang en): triển khai AI feature, thiết kế chịu tải gấp 10 lần, giải thích trade-off với product manager, giám sát dịch vụ LLM.
- Đã append bằng `node scripts/qtool.js`; các sample answer dài 150–220 từ. `node scripts/build-light-index.js` đã chạy; `node scripts/validate.js` → `OK — không có lỗi.` Còn cảnh báo PATH có sẵn về 13 bài học, không liên quan task.
Reviewed-by: check-i18n (translation, no LLM review)
