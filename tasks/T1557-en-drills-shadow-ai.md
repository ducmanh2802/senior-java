# T1557 — Luyện nói tiếng Anh: 20 câu shadowing về AI agent và system design

Status: DONE
Agent: kilo
Owns: `js/data/drills-shadow.js`
After: T1503

Thêm **20 câu shadowing** (10 theme "tech" về AI agent/LLM, 10 theme "design" về system design) vào `js/data/drills-shadow.js`. Giữ đúng định dạng, schema, số lượng từ và luật của task mẫu `tasks/T1503-en-drills-shadow-1.md` (đọc file task đó và các mục nó đã thêm). Id nối tiếp id lớn nhất hiện có trong file; đọc các mục đã có để không trùng ý.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/drills-shadow.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/drills-shadow.js logs/tmp-T1557.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 20 câu shadowing:
- Theme `tech`: `drill-shadow-241` … `drill-shadow-250` (AI agent, tool calling, Spring AI, MCP, RAG, embedding, kiểm tra đầu ra và context window).
- Theme `design`: `drill-shadow-251` … `drill-shadow-260` (cursor pagination, replica lag, deadline, schema migration, Kafka partition, multi-region, SLO, bulkhead, backpressure và read model).

Đã chạy `node scripts/build-light-index.js`, `node --check js/data/drills-shadow.js`, `node scripts/qtool.js check ...` và `node scripts/validate.js`; validator in `OK — không có lỗi.` Còn cảnh báo cũ về 13 bài học chưa nằm trong PATH, không liên quan task.
Reviewed-by: check-i18n (translation, no LLM review)
