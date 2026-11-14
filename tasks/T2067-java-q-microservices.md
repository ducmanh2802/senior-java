# T2067 — 6 câu hỏi Senior Java (microservices) vào q-microservices.js

Status: DONE
Agent: kilo
Owns: `js/data/q-microservices.js`
After: T2020

Thêm **6 câu hỏi phỏng vấn mới** (topic: microservices) vào `js/data/q-microservices.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-microservices.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Event-driven với Kafka cho Java backend: transactional outbox + Debezium CDC, idempotent consumer (bảng processed_event), thứ tự message theo partition key, retry topic và dead letter topic trong Spring Kafka, schema evolution (Avro/JSON schema, backward compatibility), exactly-once thực tế đến đâu.

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
Da them 6 cau hoi moi (id noi tiep tu 081): microservices-082 (mid, idempotent consumer bang processed_event), microservices-083 (senior, thu tu theo partition key), microservices-084 (senior, retry topic + DLT Spring Kafka), microservices-085 (lead, schema evolution JSON khong co Schema Registry), microservices-086 (senior, Transactional Outbox + Debezium CDC), microservices-087 (senior, exactly-once thuc te). Cac goc da chon de khong trung voi cau co san (005/006/009/020/021/031/034/036/038/054): xu ly bang processed_event/TTL/natural-key, null-key/sticky partitioner + reorder buffer, retry-topic pattern (khac DefaultErrorHandler trong 034), JSON schemaVersion + tolerant reader (khac 021/036), outbox event contract + snapshot + polling vs CDC (khac 005/038/054), ket luan quyet dinh exactly-once + metric duplicate_supressed (khac 006/031/057/081). Da chay node --check, build-light-index, validate.js -> OK.
Reviewed-by: kilo (T2067R)
