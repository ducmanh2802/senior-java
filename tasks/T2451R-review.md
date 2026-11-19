# T2451R — Fact-check nội dung mới của T2451

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2451 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Lỗi đã sửa (chỉ nội dung mới của T2451, các id testing-062..065):
- testing-063: "bảng không phetamine vĩnh viễn" → "phình to"; "Côté server" (từ ngoại lai) → "Ở phía server".
- testing-065: "chiatura vào sửa lỗi" → "chi trả vào sửa lỗi"; "chuyển từ cảm tính thành fact" → "thành sự thật".
- Kiểm tra kỹ thuật (Testcontainers singleton + reuse, PostgreSQL 15/@ServiceConnection, Kafka 3.x/@DynamicPropertySource, orderId/consumer group duy nhất, unique constraint idempotency, CyclicBarrier race test, Pact consumer-driven): không sai kiến thức, giữ nguyên.
- `node --check js/data/q-soft.js`: OK. `node scripts/build-light-index.js` + `node scripts/validate.js`: q-soft.js không có lỗi/cảnh báo nào.
- Các lỗi còn lại của validate.js (lessons-spring.js: {{ }} không khớp, inline code{lồng}, body ngắn…; q-concurrency-jvm.js/q-sql.js: đáp án ngắn) nằm trong file KHÔNG sở hữu bởi task này và đã tồn tại trước — không được sửa theo quy tắc 3 AGENTS.md.
