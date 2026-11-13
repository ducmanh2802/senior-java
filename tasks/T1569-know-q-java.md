# T1569 — Kiến thức: 8 câu hỏi kinh điển (core, collections, modern) vào q-java.js

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`

Thêm **8 câu hỏi phỏng vấn mới** (topic: core, collections, modern) vào `js/data/q-java.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-java.js`); đọc danh sách để **không trùng ý**.

Chủ đề: equals/hashCode/compareTo nhất quán, immutable class và defensive copy, record vs class vs Lombok, sealed interface + pattern matching (Java 21), String/StringBuilder/StringBuffer và hiệu năng nối chuỗi, ConcurrentHashMap vs Collections.synchronizedMap, PriorityQueue/ArrayDeque khi nào dùng, Stream lazy evaluation và pitfall (side effect, parallel stream).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → code Java ngắn có comment hoặc sơ đồ (~~~seq cho luồng nhiều bên) → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, vài câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/q-java.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-java.js logs/tmp-T1569.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm `core-043`–`core-045`, `collections-040`–`collections-041`, `modern-047`–`modern-049`. Đã chạy `node scripts/build-light-index.js`; `node --check js/data/q-java.js` và `node scripts/validate.js` đều đạt (`OK — không có lỗi.`).
Reviewed-by: kilo (T1569R)
