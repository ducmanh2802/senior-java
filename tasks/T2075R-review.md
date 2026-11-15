# T2075R — Fact-check nội dung mới của T2075

Status: DONE
Agent: opencode
Owns: `js/data/q-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2075 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Review nội dung mới của T2075 trong js/data/q-banking.js (banking-008 … banking-013, thay thế toàn bộ nội dung cũ của các id này):
- banking-008 (ISO 8583 vs ISO 20022): đúng kỹ thuật, không sửa.
- banking-009 (tích hợp Core qua API/ESB vs Message Queue): đúng, không sửa.
- banking-010 (vòng đời giao dịch INIT/PENDING/SUCCESS-FAILED): đúng, không sửa.
- banking-011 (Pessimistic vs Optimistic Locking, Core Banking): đúng, không sửa.
- banking-012 (Observability, Correlation ID, MDC): đúng, không sửa.
- banking-013 (Middleware: Circuit Breaker, DLQ, Retry chỉ khi idempotent): đúng, không sửa.

Không phát hiện lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup (không backtick, không `${` trong đáp án), hay chữ nước ngoài lạ trong 6 câu mới → không có lỗi cần sửa theo từng id.

node scripts/validate.js: không báo lỗi nào thuộc js/data/q-banking.js. Các LỖI còn lại của validate là ở file không sở hữu (new-questions.js, q-concurrency-jvm.js, bugs.js, lessons-banking.js, toeic.js) — không được sửa theo quy tắc chỉ sửa file sở hữu. Đã chạy node scripts/build-light-index.js để đồng bộ js/data/index-light.js sau khi dữ liệu câu hỏi thay đổi; validate không còn báo index-light.js cũ.
