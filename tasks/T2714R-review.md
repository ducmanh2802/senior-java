# T2714R — Fact-check nội dung mới của T2714

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2714 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- spring-108: Sửa lỗi kỹ thuật về @ConditionalOnMissingBean — nó kiểm tra theo **type** (kiểu bean) mặc định, không phải theo tên. Cập nhật mô tả từ "Bean cùng tên đã có" thành "Bean cùng kiểu đã có (kiểm tra theo type, có thể dùng name để kiểm tra theo tên)". Cũng sửa lỗi markup: thay backtick `name` trong template literal bằng {{name}}.
- spring-109: Không có lỗi kỹ thuật, markup hợp lệ.
- spring-110: Không có lỗi kỹ thuật, markup hợp lệ.
- Validator: q-spring-data.js pass (chỉ warning db-069 là câu hỏi cũ). Các lỗi khác (quiz-java.js, lessons-jpa.js, lessons-jvm.js) thuộc file không sở hữu, không liên quan task này.
