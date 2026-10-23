# T112R — Fact-check nội dung mới của T112

Status: DONE
Agent: opencode
Owns: `js/views/bank.js`, `js/views/quiz.js`, `js/views/learn.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T112 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- No Java/Spring/SQL content IDs were added by T112. Fixed the issue report body in bank.js, quiz.js (answer explanation and wrong-answer summary), and learn.js: the source used double-escaped newline markers, so the issue form showed literal backslash-n text. It now uses real line breaks before URL encoding.
- node --check passed for all three owned views. node scripts/test-lessons.js: 41/41. node scripts/validate.js: OK.
