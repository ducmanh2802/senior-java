# T2668R — Fact-check nội dung mới của T2668

Status: DONE
Agent: opencode
Owns: `js/data/quiz-spring.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2668 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- qz-testing-038: sửa lỗi kỹ thuật — @Testcontainers/@Container chỉ quản lý vòng đời container, KHÔNG tự động ghi đè spring.datasource.url/username/password. Cập nhật đáp án giải thích và ví dụ code: phải ánh xạ thuộc tính qua @DynamicPropertySource (Spring Boot < 3.1) hoặc @ServiceConnection (Spring Boot 3.1+).
- qz-testing-031, 032, 033, 034, 035, 036, 037, 039, 040: đúng kỹ thuật, markup hợp lệ (không backtick, không ${, fences ~~~ đóng, id qz-testing-NNN không trùng).
- Đã chạy node scripts/build-light-index.js rồi node scripts/validate.js js/data/quiz-spring.js → OK — không có lỗi.