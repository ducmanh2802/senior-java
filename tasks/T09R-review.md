# T09R — Fact-check nội dung mới của T09

Status: DONE
Agent: opencode
Owns: `js/views/dashboard.js`, `js/views/bank.js`, `css/views/dashboard.css`, `css/views/bank.css`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T09 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `js/views/bank.js`: đã xử lý race khi AI grading hoàn tất sau khi rời view hoặc render lại danh sách; kết quả/lỗi chỉ cập nhật đúng view còn được gắn, tránh truy cập `rootEl` đã null.
- Không phát hiện API/markup sai trong phần luyện trả lời, ẩn đáp án, AI grading và speech; nội dung T09 mới được giữ nguyên ngoài sửa lỗi race nêu trên.
- `node --check js/views/bank.js` và `node scripts/validate.js` đều đạt; validator in `OK — không có lỗi.`
