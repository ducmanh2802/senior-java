# T2416 — 5 câu hỏi Senior Java (devops) vào q-devops.js

Status: DONE
Agent: kilo
Owns: `js/data/q-devops.js`
After: T2392

Thêm **5 câu hỏi phỏng vấn mới** (topic: devops) vào `js/data/q-devops.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-devops.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: observability & vận hành: OpenTelemetry tracing qua HTTP và Kafka, metric RED/USE với Micrometer + Prometheus, thiết kế alert theo SLO/error budget, structured logging + correlation id, quy trình incident response và viết RCA/postmortem blameless.

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
Đã thêm 5 câu vào cuối `js/data/q-devops.js`, nối tiếp id lớn nhất của file (184):

- `devops-185` (senior) — audit/sửa trace bị đứt qua HTTP + Kafka: propagator W3C, client tự tạo, ThreadLocal khi async, span link cho batch consumer; đo trace coverage / orphan span ratio. Góc khác 170/175 (hai câu đó nói cấu hình và cơ chế propagate cơ bản).
- `devops-186` (senior) — RED cho service + USE cho tài nguyên với Micrometer/Prometheus; vì sao p99 phải gộp bucket, saturation vs utilization.
- `devops-187` (senior) — thiết kế lại alert theo SLO ở biên: journey SLO, phân tầng page/ticket/chat, grouping/inhibition Alertmanager, đo precision/MTTD/rule chết. Góc khác 038/171/176 (các câu đó tập trung công thức burn rate và postmortem).
- `devops-188` (senior) — structured logging JSON + correlation id qua HTTP/Kafka, MDC rò thread, TaskDecorator, che PII, chống log injection.
- `devops-189` (lead) — incident response: severity, IC/comms/scribe, mitigation-first, timeline, postmortem blameless và action item có owner.

Đã chạy `node --check js/data/q-devops.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → `OK — không có lỗi.` (các cảnh báo còn lại thuộc file khác, có từ trước). Không commit.
Reviewed-by: kilo (T2416R)
