# T2067R — Fact-check nội dung mới của T2067

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2067 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Da review tat ca cau hỏi moi cua T2067 trong js/data/q-microservices.js (microservices-082 den microservices-087).
- Sua loi ki thuat tai microservices-083: luc sach "Idempotent producer" bao sai mac dinh Kafka. Chuẩn Kafka 3.x bat mac dinh enable.idempotence=true tu phien ban 3.0, khong phai "khong bat mac dinh". Da sua thanh: "(Kafka 3.x bat mac dinh enable.idempotence=true; tu Kafka 0.11 tro len co the bat thu cong)".
- microservices-082 (idempotent consumer, processed_event, commit offset sau DB commit), 084 (retry topic/DLT, khung yeu tuong), 085 (schema evolution JSON, tolerant reader), 086 (outbox vs CDC Debezium), 087 (exactly-once không the end-to-end, at-least-once + idempotent): khong co loi ki thuat, markup (backtick, ${), hoac chu nuoc ngoai can sua.
- Da chay node scripts/build-light-index.js va node scripts/validate.js q-microservices.js => OK — không co lỗi.
- node scripts/validate.js (toan bo repo) bao loi co dinh tai labs-thread.js ("Unexpected identifier 'sortedLock'") — file nay khong thuoc nhiem vu T2067R va da co trong working tree truoc khi bat tay, khong sua duoc theo luat 3 AGENTS.md.