# T2786R — Fact-check nội dung mới của T2786

Status: DONE
Agent: opencode
Owns: `js/data/q-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2786 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Không có lỗi kiến thức trong nội dung mới (banking-094 → banking-099): quy tắc/rủi ro/gian lận, chargeback/representment + hạn (ví dụ), standing order/direct debit (modified following, năm nhuận, idempotency execution-id), lãi tiết kiệm (BigDecimal, làm tròn 1 lần cuối kỳ, phần dư sang kỳ sau, ngày nghỉ), cut-off/value date/posting date theo kênh, cascade timeout/circuit breaker/Kafka/DLQ/đối soát real-time — đều đúng chuẩn Java 17/21, Spring Boot 3.x, không bịa API. Không markup lỗi (không backtick, `${` trong template literal, ~~~java hợp lệ), IDs 094–099 tăng dần, topic banking hợp lệ.

Lỗi chữ nước ngoài / văn bản đã sửa trực tiếp trong q-banking.js:
- banking-095: `1. Chủ thẻ disputa giao dịch...` → `đối kháng` (từ ngoại ngữ lầm vào).
- banking-095: `...gửi bằng minh.` → `...gửi hồ sơ bằng minh chứng cho hội thẻ.` (câu bị cắt).
- banking-099: `Cascade timeout là_timeout lan từ...` → `Cascade timeout là sự việc timeout lan từ...` (lỗi gạch dưới).

validate.js: không báo lỗi nào thuộc q-banking.js. Cảnh báo `index-light.js` đã cũ không thể khắc phục vì `node scripts/build-light-index.js` bị chặn bởi lỗi cú pháp trước đó trong `q-security.js:8584` (file không thuộc task này, không được sửa theo AGENTS.md §3). Các lỗi còn lại trong validate (q-security.js, quiz-ops.js, lessons-*.js, path.js, projects.js) nằm ngoài file sở hữu, không động.
