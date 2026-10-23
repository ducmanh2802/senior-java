# T109R — Fact-check nội dung mới của T109

Status: DONE
Agent: opencode
Owns: `js/data/lessons-design.js`, `index.html`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T109 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- `lesson-design-003`: sửa test consistent hashing để so sánh ring ban đầu `{a,b}` với ring sau khi thêm `c`; trước đó biến `old` lại chứa đủ ba node nên test không xác nhận đúng thay đổi membership.
- Kiểm tra từng exercise `lesson-design-001` đến `lesson-design-005`: reference pass toàn bộ và starter không pass hết; chạy lại suite đầy đủ cùng `node scripts/validate.js`.
