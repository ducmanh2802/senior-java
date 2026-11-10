# T1409R — Fact-check nội dung mới của T1409

Status: DONE
Agent: opencode
Owns: `js/data/lessons-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1409 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Review diff vs HEAD (chỉ lessons 001–002 là nội dung mới; 003–011 là nội dung HEAD, không đục). Không tìm được lỗi kỹ thuật (outbox/at-least-once, Debezium CDC WAL/binlog, partition key theo aggregate, inbox unique constraint, version vs message_id, commit offset sau DB commit… đều đúng), không lỗi markup (không backtick/`${` trong nội dung), không chữ nước ngoài lẫn ngoài quy ước thuật ngữ. `node scripts/validate.js` → OK. `node scripts/test-lessons.js` → 220/220 pass. Không cần sửa gì.
