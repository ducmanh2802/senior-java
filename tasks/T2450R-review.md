# T2450R — Fact-check nội dung mới của T2450

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2450 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 2 câu mới của T2450 (design-069 event sourcing audit trail, design-070 ingest pipeline). Nội dung kỹ thuật về cơ bản ĐÚNG (event store append-only, replay/snapshot/time travel, at-least-once + idempotent, DLQ, Kafka partition theo key, ack sau khi ghi bền). Đã sửa các lỗi sau (không đổi văn phong/bố cục/độ dài, không thêm/bớt mục):

- **design-069**:
  - "bản phe duyệt" → "bản chiếu (projection)" (sai thuật ngữ; projection mới đúng nghĩa).
  - "một sự nghiệp đã xảy ra" → "một sự việc đã xảy ra" (sự nghiệp = career, sai nghĩa event).
  - "mã hóa/trọn trước khi ghi" → "mã hóa/ẩn danh trước khi ghi" (chữ "trọn" vỡ nghĩa, không có nghĩa kỹ thuật).
- **design-070**:
  - Sơ đồ seq: sửa "Hàng đợi --> Gateway: 202 đã chấp nhận" (sai — 202 Accepted là HTTP status do Gateway trả về Nguồn, không phải hàng đợi trả cho Gateway) thành 2 dòng: "Hàng đợi --> Gateway: đã ghi bền" + "Gateway --> Nguồn: 202 đã chấp nhận".
  - "It nhất một lần" → "Ít nhất một lần" (sai chính tả thuật ngữ at-least-once).
  - Bảng trade-off: "Thấp, code ngắt" → "Thấp, code ngắn"; "cần tính cao độ" → "cần độ sẵn sàng cao" (garbled, sai nghĩa).
  - Trả lời mẫu: "nhận được tiếp nhận cao" → "đổi lại có thông lượng cao" (garbled, sai nghĩa throughput).

- **Không sửa**: các câu/đáp án cũ ở HEAD; nội dung lessons-spring.js (thuộc T2442) không phải file của task này.

- **Nghiệm thu**: `node --check js/data/q-system-design.js` → OK. `node scripts/validate.js` → không còn lỗi nào thuộc q-system-design.js (các lỗi LỖI còn lại đều nằm ở js/data/lessons-spring.js của task song song T2442, không thuộc phạm vi T2450R). Đã chạy `node scripts/build-light-index.js` sinh lại index-light.js (thêm design-069/070).
