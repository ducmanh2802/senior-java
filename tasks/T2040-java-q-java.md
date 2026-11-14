# T2040 — 6 câu hỏi Senior Java (modern) vào q-java.js

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`
After: T2016

Thêm **6 câu hỏi phỏng vấn mới** (topic: modern) vào `js/data/q-java.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-java.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Java 17→21 khi nâng cấp dự án thật: record làm DTO/JPA projection (và vì sao không làm entity), sealed hierarchy cho domain lỗi, text block, switch pattern với record pattern, String templates đã bị rút khỏi JDK (nói đúng trạng thái), virtual threads trong Spring Boot 3.2+ (spring.threads.virtual.enabled) — đọc câu đã có để không trùng.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-java.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 6 câu (id nối tiếp sau modern-057), chỉ THÊM, không sửa mục cũ:

- `modern-058` (senior) — record làm DTO/JPA projection trong Spring Boot 3 + Hibernate 6; so sánh interface projection / constructor expression / record; vì sao record không làm entity (non-final, no-arg ctor, setter cho dirty checking, proxy lazy loading); record làm `@Embeddable` từ Hibernate 6.2.
- `modern-059` (lead) — sealed hierarchy domain lỗi (`DomainError` + biến thể record), ánh xạ sang `ProblemDetail`/HTTP bằng switch exhaustive không `default`, `retryable()`, trade-off với exception/Result, bẫy rollback khi bắt lỗi trong service.
- `modern-060` (senior) — text block: cơ chế chuẩn hoá line terminator về LF, cắt incidental indentation, dòng trống cuối khi dấu đóng ở dòng riêng, là hằng số (dùng được trong annotation/case label), escape, encoding UTF-8, bẫy `formatted` với `%`, log injection.
- `modern-061` (senior) — switch pattern + record pattern lồng nhau cho evaluator biểu thức, guard `when`, `yield`, dominance/exhaustiveness, constant folding, giới hạn Java 21 chưa có primitive pattern, không fall-through, đệ quy sâu.
- `modern-062` (senior) — String templates (JEP 430/459): preview ở JDK 21/22, bị rút trước JDK 23, JEP 465 bị hủy; nói đúng trạng thái (không JDK chính thức nào có); migrate sang text block / `String.formatted` / `MessageFormat` / PreparedStatement; quản trị preview feature (`--enable-preview`).
- `modern-063` (lead) — `spring.threads.virtual.enabled=true` trên Spring Boot 3.2+/JDK 21: chính xác cái gì đổi (Tomcat/Jetty, `applicationTaskExecutor`, `taskScheduler`, listener Kafka/Rabbit, Redis cluster) và cái gì KHÔNG đổi (HikariCP pool, `@Transactional`, event loop WebFlux, downstream); pinning trên JDK 21-23 và JEP 491 ở JDK 24; semaphore/bulkhead, `keep-alive`, graceful shutdown, đo bằng JFR/load test.

Kiểm tra: `node --check js/data/q-java.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` không có lỗi thuộc `q-java.js` (2 lỗi còn lại nằm ở `js/data/lessons-core.js` — file của task khác, không thuộc phạm vi T2040). Đã sửa 2 lỗi cú pháp trong `modern-063` (tên biến sai `_Djdk.tracePinnedThreads=short_` → `-Djdk.tracePinnedThreads=short`, và YAML `spring:` bị lặp 2 lần).

Tổng `window.QUESTIONS` sau khi thêm: 164 mục, id duy nhất 164. Topic `modern`: 62 câu.
Reviewed-by: kilo (T2040R)
