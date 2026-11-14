# T2051R — Fact-check nội dung mới của T2051

Status: DONE
Agent: opencode
Owns: `js/data/quiz-spring.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2051 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- Fact-check 12 câu trắc nghiệm mới (qz-spring-042 → qz-spring-053) trong `js/data/quiz-spring.js`: không có lỗi kiến thức, markup hay cú pháp. Đáp án, explain, level, multi, options, answer index đều đúng so với chuẩn Spring Boot 3.x / Spring Framework 6.2.
- `node scripts/validate.js` đã chạy → không báo lỗi về quiz-spring.js (các lỗi khác ở q-spring-data.js, bugs.js, lessons-spring.js không thuộc quyền sở hữu của task này).
