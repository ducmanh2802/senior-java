# T642R — Fact-check nội dung mới của T642

Status: DONE
Agent: opencode
Owns: `js/data/lessons-autotest.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T642 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- lesson-autotest-012 line ~5321: `postgres:16-alpine` → `postgres:15-alpine` (đúng chuẩn PostgreSQL 15 theo AGENTS.md). Tất cả bài tập khác đã được kiểm tra kỹ (không có lỗi kỹ thuật/markup/từ nước ngoài khác nào phát hiện).
- validate.js: OK. test-lessons.js: 147/147 pass. index-light.js đã rebuild lại.
