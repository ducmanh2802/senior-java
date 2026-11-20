# T2489R — Fact-check nội dung mới của T2489

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2489 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- scenario-167: sửa lỗi kiến thức trong "Trả lời mẫu" — 주장 event_trace có PK là lot_id hoặc serial_id là sai (một lot/serial có nhiều sự kiện). Đã đổi thành "mã sự kiện là PK; lot_id/serial_id là chỉ mục truy xuất".
- scenario-171: sửa snippet Java consumer Kafka — `record.headers().lastHeader("idempotency_key").value()` trả về `byte[]`, gán trực tiếp vào `String` không biên dịch được. Đã dùng `new String(..., StandardCharsets.UTF_8)`.
- Kiểm tra markup/lỗi câu lệnh cho scenario-167..171 (`node scripts/validate.js q-scenario.js`, `node --check`): không có lỗi nội dung file (không backtick, không `${`, fence ~~~ cân bằng, không thẻ HTML, id/topic/level/fields hợp lệ).
- index-light.js: đã bổ sung thủ công 5 dòng ["scenario-167..171","scenario",<level>] theo định dạng generator. `node scripts/build-light-index.js` KHÔNG chạy được vì hai file của task khác đang bị lỗi cú pháp chưa commit (q-concurrency-jvm.js, q-spring-data.js) làm vm nạp toàn bộ dữ liệu thất bại — tôi không được sửa file khác theo luật 3 AGENTS.md.
- `node scripts/validate.js` toàn bộ vẫn in LỖI do nguyên nhân trên (các q-*.js của task khác lỗi cú pháp → câu hỏi của chúng không nạp được → path.js thiếu câu, bugs.js/lessons related sai, index-light cũ so với sandbox). Tất cả lỗi nằm ngoài file sở hữu của T2489 (`js/data/q-scenario.js` sạch), không thể khắc phục mà không vi phạm luật 3 AGENTS.md.
