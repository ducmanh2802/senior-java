# T1722 — Luyện phát âm: 20 thuật ngữ Java/Spring hay đọc sai

Status: DONE
Agent: kilo
Owns: `js/data/drills-term.js`

Thêm **20 thuật ngữ** (ví dụ: annotation, serialization, polymorphism, encapsulation, inheritance, generic, mutable, iterator, lambda, singleton, repository, dependency, middleware, cache, queue, schema…; bỏ từ đã có) vào `js/data/drills-term.js`. Giữ đúng định dạng, schema, độ dài và luật của task mẫu `tasks/T1558-en-drills-term-ai.md` (đọc file task đó). Id nối tiếp id lớn nhất hiện có. KHÔNG đọc toàn bộ file dữ liệu lớn: dùng `node scripts/qtool.js list <file>` để xem các mục đã có (tránh trùng), `qtool.js show <file> <id>` để xem một mẫu, rồi viết ngay vào file tạm và `qtool.js append`.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/drills-term.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/drills-term.js logs/tmp-T1722.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm 20 mục `drill-term-201`–`drill-term-220`: bean, DTO, POJO, exception, iterator, lambda, override, mutable, reflection, autowiring, controller, service, stream, collection, JVM, bytecode, garbage collection, classpath, record, singleton.
- `node --check js/data/drills-term.js` thành công; `node scripts/build-light-index.js` thành công; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Reviewed-by: check-i18n (translation, no LLM review)
