# T1571 — Kiến thức: 8 câu hỏi kinh điển (spring, jpa, db) vào q-spring-data.js

Status: DONE
Agent: kilo
Owns: `js/data/q-spring-data.js`

Thêm **8 câu hỏi phỏng vấn mới** (topic: spring, jpa, db) vào `js/data/q-spring-data.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-spring-data.js`); đọc danh sách để **không trùng ý**.

Chủ đề: bean lifecycle và BeanPostProcessor, @Configuration proxyBeanMethods, AOP proxy JDK vs CGLIB và self-invocation, transaction propagation REQUIRES_NEW pitfall, Hibernate first-level cache và flush mode, @Version và optimistic lock exception xử lý thế nào, connection leak và HikariCP leak detection, Spring Boot auto-configuration và @Conditional.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → code Java ngắn có comment hoặc sơ đồ (~~~seq cho luồng nhiều bên) → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, vài câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/q-spring-data.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-spring-data.js logs/tmp-T1571.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 8 câu: `spring-056`–`spring-059`, `jpa-049`–`jpa-050`, `db-056`, `spring-060`. Đã chạy `node scripts/build-light-index.js`; `node scripts/qtool.js check` và `node scripts/validate.js` đều đạt.
Reviewed-by: kilo (T1571R)
