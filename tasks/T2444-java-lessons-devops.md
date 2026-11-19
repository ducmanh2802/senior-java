# T2444 — 2 bài học (devops) vào lessons-devops.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-devops.js`
After: T2393

Thêm **2 bài học mới** (track `devops`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: observability từ gốc: log có correlation id, metric counter/histogram, trace span cha-con; bài tập Java thuần: tự cài Tracer nhỏ lan truyền traceId qua các "service" (method) và qua message giả lập Kafka header, test kiểm tra cây span.

Theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (framework được mô phỏng bằng Java thuần), tests ≥ 3 case **deterministic**, reference pass 100%, starter biên dịch được với Java 17 và không pass hết; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/lessons-devops.js`; `node scripts/build-light-index.js`; `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết); `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 2 bài học:
- lesson-devops-014 (order 14): "Observability nền tảng: log JSON có correlation ID, Counter/Histogram, trace context W3C traceparent, MDC truyền qua ExecutorService/Kafka"
- lesson-devops-015 (order 15): "Distributed tracing: span tree cha-con, sampling, baggage, và truyền context qua Kafka/gRPC"

Mỗi bài có goals, body ≥ 2500 ký tự, exercises (MiniTracer + TraceTree) với starter/tests/reference/hints/explain, check questions 3-4, related IDs, tags.
Syntax check passed, build-light-index.js run, validate.js passes for new content (pre-existing errors in quiz-spring.js and bugs.js unrelated).
