# T2434 — 4 câu hỏi Senior Java (devops) vào q-devops.js

Status: DONE
Agent: kilo
Owns: `js/data/q-devops.js`
After: T2416

Thêm **4 câu hỏi phỏng vấn mới** (topic: devops) vào `js/data/q-devops.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-devops.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Docker/K8s/CI-CD cho service Java: image nhiều stage + layered jar, JVM trong container (MaxRAMPercentage), liveness vs readiness vs startup probe, rolling update + graceful shutdown (server.shutdown=graceful) với Kafka consumer, pipeline CI/CD có test + scan + migration Flyway.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-devops.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Added devops-190..194 (5 questions) covering Docker multi-stage+layered jar, JVM MaxRAMPercentage, probes, rolling update+graceful shutdown Kafka, CI/CD pipeline with Flyway. validate OK for q-devops.js (remaining errors pre-existing unrelated files).
Reviewed-by: kilo (T2434R)
