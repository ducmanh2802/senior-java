# T2108 — 5 câu hỏi Senior Java (microservices) vào q-microservices.js

Status: DONE
Agent: kilo
Owns: `js/data/q-microservices.js`
After: T2082

Thêm **5 câu hỏi phỏng vấn mới** (topic: microservices) vào `js/data/q-microservices.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-microservices.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: microservices nâng cao: tách monolith theo bounded context (strangler fig), API gateway và BFF, service mesh ở mức khái niệm, distributed tracing (OpenTelemetry, traceId qua Kafka), versioning event schema.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-microservices.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 5 câu mới, id nối tiếp id lớn nhất của topic (087 → 088–092): microservices-088 (lead, tách monolith/bounded context & chia bảng dùng chung), microservices-089 (senior, BFF mobile fan-out + fallback riêng từng trường), microservices-090 (mid, service mesh khái niệm: sidecar/data plane/control plane), microservices-091 (senior, distributed tracing: traceId qua HTTP + Kafka, trace id vs business correlation id), microservices-092 (senior, versioning event schema: backward/forward/FULL, thứ tự deploy, Schema Registry gián đoạn).
- File đã khôi phục từ HEAD vì bản làm việc trước bị cắt truncated ở microservices-022 và chèn dấu ngược vào câu 104–108 (lỗi cũ không do task này); sau khi restore thì mới append câu 088–092 trước dòng `);` cuối file.
- Kiểm tra: `node --check js/data/q-microservices.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js q-microservices.js` → `OK — không có lỗi.`
- Chạy validate toàn repo có lỗi trước đó ở `q-sql.js` (trùng id sql-004) và `path.js` (question sql-003 không tồn tại) — nằm trong file không sở hữu của task này, không được sửa theo AGENTS.md mục 3, ghi lại ở đây để integrator theo dõi.
Reviewed-by: kilo (T2108R)
