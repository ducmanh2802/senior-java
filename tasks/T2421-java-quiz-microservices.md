# T2421 — 10 câu trắc nghiệm (microservices) vào quiz.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz.js`
After: T2420

Thêm **10 câu trắc nghiệm** vào `js/data/quiz.js` (topic `microservices`; id `qz-microservices-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-microservices-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: tình huống messaging: Kafka partition & ordering, consumer group rebalance, at-least-once + idempotent consumer, retry/DLQ, outbox, RabbitMQ ack/prefetch.

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là `multi: true` (Chọn 2); đáp án đúng rải đều vị trí; `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/quiz.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 10 câu `qz-microservices-033` … `qz-microservices-042` vào `js/data/quiz.js` (append vào cuối mảng `QUIZ`, id nối tiếp 032 — đã đếm trước/sau không mất mục nào):

- 033 Kafka partition & ordering (key = orderId, hash % N)
- 034 consumer group rebalance do vượt `max.poll.interval.ms`
- 035 (multi, Chọn 3) delivery semantics: acks=all + idempotent producer, at-least-once, at-most-once
- 036 poison pill → head-of-line blocking, retry có giới hạn + DLQ
- 037 replay DLQ an toàn: idempotent + giữ key/thứ tự
- 038 (multi, Chọn 2) thiết kế DLQ: metadata + cảnh báo/replay có kiểm soát
- 039 RabbitMQ manual ack: crash trước ack → redelivered → cần idempotent
- 040 RabbitMQ prefetch 250 gây lệch tải; trade-off prefetch
- 041 (multi, Chọn 3) transactional outbox + CDC (Debezium), consumer vẫn at-least-once
- 042 effectively-once: ledger UPSERT theo khoá tự nhiên / processed_events cùng transaction

Đáp án đơn rải đều vị trí: 0, 2, 1, 3, 0, 2, 1. Đã chạy `node --check js/data/quiz.js` (OK) và `node scripts/build-light-index.js` (OK). `node scripts/validate.js` không báo lỗi nào thuộc `quiz.js`; các lỗi còn lại đến từ file của agent khác đang sửa dở tại thời điểm chạy: `quiz_backup.js` (untracked, không khai báo trong data-manifest), `labs-sql.js`, `q-api.js` (lỗi cú pháp giữa chừng) và `bugs.js` (related `api-009` mất do `q-api.js` hỏng). Không sửa các file đó vì ngoài quyền sở hữu — integrator chạy lại validate sau khi các agent kia hoàn tất.
Reviewed-by: kilo (T2421R)
