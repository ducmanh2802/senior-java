# T1485R — Fact-check nội dung mới của T1485

Status: DONE
Agent: opencode
Owns: `js/data/quiz-spring.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1485 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Review 15 câu mới của T1485 (qz-api-026 → qz-api-040, topic api) trong js/data/quiz-spring.js: không tìm thấy lỗi kỹ thuật (API/flag, mặc định, cơ chế, số liệu), không lỗi markup (backtick/`${`/cú pháp sequence), không có từ nước ngoài lẫn vào. Tất cả đáp án multi có "(Chọn 2)" khớp answer.length. node scripts/validate.js → OK, node --check → OK. Ghi chú: không có lỗi, xong ngay.
