# T2535 — 3 câu hỏi Senior Java (microservices) vào q-microservices.js

Status: DONE
Agent: kilo
Owns: `js/data/q-microservices.js`
After: T2509

Thêm **3 câu hỏi phỏng vấn mới** (topic: microservices) vào `js/data/q-microservices.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-microservices.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Kafka vận hành sâu: (1) Vì sao KHÔNG nên dùng Kafka làm work queue cho job chạy lâu (xử lý 1 message 5 phút → vượt max.poll.interval.ms → rebalance liên miên, throughput về 0; head-of-line blocking trong partition; số consumer bị giới hạn bởi số partition), so sánh Share Groups (KIP-932, Kafka 4.x, ghi rõ trạng thái preview/GA theo phiên bản, không chắc thì nói ít) với RabbitMQ/SQS/bảng jobs; (2) Consumer batching: vì sao commit từng message chậm hàng chục lần, xử lý + ghi DB + commit theo lô với Spring Kafka (batch listener, AckMode.BATCH/MANUAL), chống trùng khi crash giữa lô; (3) Idempotent producer: vì sao max.in.flight=5 vẫn giữ thứ tự (sequence number theo partition), enable.idempotence mặc định từ Kafka 3.0, và vì sao consumer VẪN phải tự chống trùng theo version/khóa nghiệp vụ. Mỗi câu có số đo cụ thể (ms, TPS, MB) tự nhất quán và mục ### Checklist cuối (5–7 việc làm được ngay), trước > Senior tip..

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-microservices.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Added microservices-120,121,122. validate remaining errors are in bugs.js (not owned).
Reviewed-by: kilo (T2535R)
