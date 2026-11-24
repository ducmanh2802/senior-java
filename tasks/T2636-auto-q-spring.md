# T2636 — 3 câu hỏi Senior Java (spring) vào q-spring-data.js

Status: DONE
Agent: kilo
Owns: `js/data/q-spring-data.js`
After: T2619

Thêm **3 câu hỏi phỏng vấn mới** (topic: spring) vào `js/data/q-spring-data.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-spring-data.js`); đọc danh sách để **không trùng ý**.

Chủ đề: Spring Boot auto-configuration hoạt động thế nào và cách viết starter nội bộ cho 20 service, @ConfigurationProperties + validation, observability với Micrometer: đặt tên metric và tag tránh high cardinality.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment hoặc ~~~seq cho luồng nhiều bên → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/q-spring-data.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 3 câu hỏi mới (id nối tiếp spring-104 → spring-105, 106, 107):

- **spring-105 (lead)** — Starter nội bộ cho 20 service: vì sao auto-configuration dễ phá vỡ diện rộng, condition an toàn (@ConditionalOnMissingBean + @ConditionalOnProperty matchIfMissing=false để rollout canary), spring-boot-configuration-processor sinh spring-configuration-metadata.json + additional metadata để autocomplete/validate và đánh dấu deprecated/replacement, semantic versioning + giữ alias property, test ApplicationContextRunner.
- **spring-106 (senior)** — @ConfigurationProperties ràng buộc chéo (cross-field) và theo profile: vì sao annotation field (@NotNull/@Min) không đủ, dùng class-level @AssertTrue (method không tham số trả boolean) cho cross-field để lỗi vào banner "Binding to target ... failed"; ràng buộc theo profile kiểm ở ApplicationRunner/SmartInitializingSingleton đọc Environment; so sánh với validate trong record constructor (lỗi thô, mất property path); bảng chọn cách + pitfall.
- **spring-107 (senior)** — Micrometer/Prometheus: quy ước đặt tên metric (chấm → gạch dưới, đơn vị giây, hậu tố _total, không nhúng đơn vị vào tên) và tag low-cardinality; cưỡng chế tập trung bằng MeterRegistryCustomizer + MeterFilter (ignoreTags, maximumAllowableTags, denyNameStartsWith, commonTags) trong starter dùng chung; so sánh MeterFilter (phía app) vs labeldrop (Prometheus ingest).

Góc nhìn khác với các câu đã có: auto-config/starter trước (spring-007/030/040/060/099/100) chỉ bàn cơ chế condition & thứ tự; spring-105 bàn vận hành/versioning/metadata cho 20 consumer. spring-050/084/094 bàn JSR-380 field-level + record; spring-106 bàn cross-field/profile (chưa có). spring-052/064/086 bàn Observation API + cardinality; spring-107 tập trung naming convention + MeterFilter tập trung (chưa có trong file q-spring-data.js).

Kiểm tra:
- `node --check js/data/q-spring-data.js` → OK.
- `node scripts/build-light-index.js` → ghi lại index-light.js (spring: 96 câu).
- `node scripts/validate.js` → không còn lỗi nào thuộc q-spring-data.js. Các lỗi còn lại (bug-050.story/rootCause ký tự "客服") nằm trong js/data/bugs.js — file của task khác (bug Java, đang chỉnh dở, git status: M), KHÔNG thuộc quyền sở hữu của T2636 nên không sửa (AGENTS.md luật 5). Khi task bugs.js hoàn tất, validate sẽ về OK.

Không commit (theo luật 4).
Reviewed-by: kilo (T2636R)
