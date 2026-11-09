# T1319R — Fact-check nội dung mới của T1319

Status: DONE
Agent: opencode
Owns: `js/data/q-remote.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1319 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Phạm vi review: nội dung MỚI trong `js/data/q-remote.js` (diff HEAD) — các mục `### Ví dụ đời thực` và `### Trả lời mẫu khi phỏng vấn` thêm cho remote-025..remote-030.
- Kiểm tra kỹ thuật/markup: không thấy API/flag bịa hay cơ chế nói ngược; số liệu trong ví dụ đều được gắn nhãn giả định/ẩn danh hợp lý; code Java ví dụ (log masking) đúng; dùng `{{...}}`/`~~~java` đúng markup, không backtick. Nội dung chủ yếu soft-skill/Upwork — không cần áp chuẩn Java/Spring/Hibernate/Postgres/Kafka ngoài các ví dụ minh hoạ.
- `remote-030`: sửa chữ lẫn/lỗi chính tả rõ ràng trong “Kết quả đo được”: `… quyết định rõ RẰNG RÔI TRƯỚC KHI CODE.` → `… quyết định rõ ràng trước khi code.` (giữ nội dung, chỉ sửa diễn đạt).
- `remote-030` (checklist): sửa thông tin phí Upwork không chính xác/cũ: `phí DV 0–15%/hợp đồng, cố định khi bắt đầu` → `phí dịch vụ freelancer 10%/hợp đồng; kiểm tra lại` (vẫn nhắc kiểm tra trang Upwork vì có thể thay đổi). Các mục remote-028/029 đã ghi đúng 10% và có disclaimer — giữ nguyên.
- Đã chạy `node scripts/build-light-index.js` (sửa data) và `node scripts/validate.js` → `OK — không có lỗi.` (còn warning sẵn có: `path.js` thiếu lesson-design-006/007, không thuộc task). `scripts/test-lessons.js` không chạy (không phải bài học). Chỉ sửa `js/data/q-remote.js` (+ task file) theo luật sở hữu.
