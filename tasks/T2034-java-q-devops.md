# T2034 — 6 câu hỏi Senior Java (devops) vào q-devops.js

Status: DONE
Agent: kilo
Owns: `js/data/q-devops.js`
After: T1576

Thêm **6 câu hỏi phỏng vấn mới** (topic: devops) vào `js/data/q-devops.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-devops.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Java trên production: graceful shutdown Spring Boot trên K8s (preStop, server.shutdown=graceful), JVM flags nên đặt trong container, structured logging JSON và correlation id (MDC), đọc metrics JVM qua Micrometer/Prometheus (heap, GC pause, thread), CDS/AppCDS và giảm thời gian khởi động, chọn base image JRE (đọc câu đã có để không trùng).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-devops.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 6 câu hỏi: devops-158 (Graceful shutdown Kafka consumer), devops-159 (JVM flags cho virtual threads + ZGC + JFR + CDS), devops-160 (Log sampling, PII redaction, Loki label policy), devops-161 (Cardinality control: relabel_configs, recording rules, business SLI, JFR streaming), devops-162 (CDS + AOT cache startup optimization), devops-163 (Base image JRE selection: Distroless vs jlink vs Alpine, supply chain security). Tất cả câu trả lời dài 4000–9000 ký tự, có code, bảng, ví dụ thực tế, senior tip. Validate OK.
Reviewed-by: kilo (T2034R)
