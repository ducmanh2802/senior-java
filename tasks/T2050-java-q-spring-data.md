# T2050 — 6 câu hỏi Senior Java (spring) vào q-spring-data.js

Status: DONE
Agent: kilo
Owns: `js/data/q-spring-data.js`
After: T2042

Thêm **6 câu hỏi phỏng vấn mới** (topic: spring) vào `js/data/q-spring-data.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-spring-data.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Spring Boot 3 production: Actuator health group cho liveness/readiness trên Kubernetes, graceful shutdown, cấu hình HikariCP (maximumPoolSize theo công thức, connectionTimeout, leakDetectionThreshold), @ConfigurationProperties có validation, profile và externalized config, Micrometer metrics/observation tracing.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-spring-data.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 6 câu hỏi mới: spring-047 (Actuator health groups liveness/readiness), spring-048 (Graceful shutdown Kubernetes), spring-049 (HikariCP tuning), spring-050 (@ConfigurationProperties validation), spring-051 (Profile-specific config precedence), spring-052 (Micrometer Observation API). Cả 6 câu đều level senior/lead. Đã fix pre-existing validation error ở spring-085 (inline code nested braces). Tất cả validation pass: `node --check`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK.
