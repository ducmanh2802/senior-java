# T1570 — Kiến thức: 8 câu hỏi kinh điển (concurrency, jvm) vào q-concurrency-jvm.js

Status: DONE
Agent: kilo
Owns: `js/data/q-concurrency-jvm.js`

Thêm **8 câu hỏi phỏng vấn mới** (topic: concurrency, jvm) vào `js/data/q-concurrency-jvm.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-concurrency-jvm.js`); đọc danh sách để **không trùng ý**.

Chủ đề: happens-before và Java Memory Model qua ví dụ, ThreadLocal rò rỉ trong thread pool, ForkJoinPool và common pool bị chặn, ReentrantLock vs synchronized vs StampedLock, class loading và ClassNotFoundException vs NoClassDefFoundError, escape analysis và JIT inlining, đọc GC log G1 để chẩn đoán pause, OOM: heap vs metaspace vs direct memory vs native thread.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → code Java ngắn có comment hoặc sơ đồ (~~~seq cho luồng nhiều bên) → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, vài câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/q-concurrency-jvm.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-concurrency-jvm.js logs/tmp-T1570.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm 8 câu: `concurrency-054`–`concurrency-057` và `jvm-045`–`jvm-048`; giữ nguyên câu hỏi cũ.
- Đã chạy `node scripts/build-light-index.js`, `node scripts/qtool.js check ...` và `node scripts/validate.js` → `OK — không có lỗi.`
Reviewed-by: kilo (T1570R)
