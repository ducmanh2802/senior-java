# T121R — Fact-check nội dung mới của T121

Status: DONE
Agent: opencode
Owns: `js/views/dashboard.js`, `css/views/dashboard.css`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T121 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
 - `interviewPlan` (dashboard): ngày dạng ISO nhưng không tồn tại (ví dụ 31/02) bị JS chuẩn hoá sang tháng sau; giờ kiểm tra ngày-tháng-năm khớp tuyệt đối. Ngày phỏng vấn đã qua trước đây hiển thị “Hôm nay”; giờ hiện rõ số ngày đã qua và không đưa ra quota ôn/ngày gây hiểu nhầm.
 - `node --check js/views/dashboard.js` đạt. `node scripts/validate.js` chưa thể in OK do lỗi ngoài phạm vi sở hữu: `lessons-db.js` và `lessons-microservices.js` chưa được khai báo trong `index.html`; không sửa file integrator theo luật sở hữu.
