# T2447 — 5 câu hỏi Senior Java (microservices) vào q-microservices.js

Status: DONE
Agent: kilo
Owns: `js/data/q-microservices.js`
After: T2414

Thêm **5 câu hỏi phỏng vấn mới** (topic: microservices) vào `js/data/q-microservices.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-microservices.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Kafka & RabbitMQ chuyên sâu: Kafka replication (ISR, acks=all, min.insync.replicas), producer idempotence và transaction, consumer lag và scale partition, RabbitMQ exchange types/ack/prefetch/quorum queue, chọn Kafka hay RabbitMQ cho task queue vs event stream.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-microservices.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 5 câu hỏi vào `js/data/q-microservices.js`, id nối tiếp id lớn nhất (microservices-107):
- microservices-108 (senior): Kafka replication — ISR, acks=all, min.insync.replicas, số broker tối thiểu.
- microservices-109 (senior): producer idempotence (PID, sequence, epoch) + transactional producer, khi chọn transaction.
- microservices-110 (senior): consumer lag, đo lag (kafka-consumer-groups, JMX records-lag-max), scale consumer vs tăng partition.
- microservices-111 (senior): RabbitMQ exchange (direct/topic/fanout/headers), ack/prefetch, quorum queue, chọn RabbitMQ vs Kafka.
- microservices-112 (lead): quyết định Kafka hay RabbitMQ cho task queue vs event stream, rủi ro dùng nhầm.

Mỗi câu có `**Tóm tắt:**`, cơ chế từng bước + VÌ SAO, code Java ≤ 30 dòng có comment, bảng trade-off, pitfall, `### Ví dụ đời thực` có số liệu, `### Trả lời mẫu khi phỏng vấn`, `> Senior tip:`, `follow` 3 câu, tags.

Xác thực:
- `node --check js/data/q-microservices.js` → SYNTAX_OK.
- `node scripts/validate.js` → không có lỗi/cảnh báo nào tham chiếu q-microservices.js hay các id mới (microservices topic hiện 112 câu hỏi).

Chưa đạt `OK — không có lỗi.` do lỗi lịch sử trong file KHÔNG sở hữu (per AGENTS.md mục 3, không sửa):
- `lessons-spring.js`: `lesson-spring-024.body` sai `{{`/`}}`, inline code lồng `{ }`, `###` thụt dòng (6 lỗi; thuộc T2442).
- `q-sql.js`: `sql-091` mẫu template literal chưa đóng backtick (thuộc T2449); lỗi này cũng làm `node scripts/build-light-index.js` crash nên `index-light.js` vẫn cũ theo validate.
Cần T2442 và T2449 sửa file của mình rồi chạy `node scripts/build-light-index.js` + `node scripts/validate.js` để đạt OK.
Reviewed-by: kilo (T2447R)
