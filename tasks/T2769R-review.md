# T2769R — Fact-check nội dung mới của T2769

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2769 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Lỗi đã sửa (theo id):
- design-081: "- Retry seek parser đến checkpoint offset." và "Retry seek offset." trong trả lời mẫu — SẢI. SAX (XSSFReader) là forward-only, không thể seek/lùi lại checkpoint. Đã sửa thành: khi worker restart, parse lại SAX từ đầu và bỏ qua các row đã checkpoint theo processed_rows/checkpoint_offset. Cùng sửa câu trả lời mẫu tương ứng.

design-080, design-082: không có lỗi kỹ thuật (Redis lock critical section + optimistic lock + pg_cron + partial unique index; outbox + FOR UPDATE SKIP LOCKED + idempotency key + backoff/jitter + reconciliation đều đúng PostgreSQL/Redis). Không backtick, không `${`, markup hợp lệ, `node --check` OK.

Chặn validate `OK — không có lỗi.` hoàn toàn:
- `js/data/sd-problems.js:8968` lỗi cú pháp sẵn có tại HEAD (template literal chưa đóng backtick), file sở hữu integrator, không phải T2769 gây ra → theo Luật 3 AGENTS.md tôi không sửa. Lỗi này làm `build-light-index.js` và kiểm tra `index-light.js` trong validate báo "đã cũ".
- `index-light.js` đã chứa design-080/081/082 (dòng 1304–1306), nên nội dung mới đã được index.
- Các lỗi còn lại của validate (quiz-ops.js, lessons-*.js, sd-problems.js…) nằm file không sở hữu, không chạm.
