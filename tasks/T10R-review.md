# T10R — Fact-check nội dung mới của T10

Status: DONE
Agent: opencode
Owns: `js/views/flash.js`, `js/views/quiz.js`, `css/views/flash.css`, `css/views/quiz.css`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T10 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Không có nội dung quiz/flash mới trong diff cần fact-check; quiz.js chỉ thêm link báo sai, dùng encodeURIComponent cho query, App.esc cho href và rel=noopener noreferrer.
- node --check js/views/quiz.js, node --check js/views/flash.js, node scripts/validate.js đều pass; validator in OK — không có lỗi.
