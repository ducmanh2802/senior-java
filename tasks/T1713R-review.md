# T1713R — Fact-check nội dung mới của T1713

Status: DONE
Agent: opencode
Owns: `js/data/quiz-spring.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1713 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- **qz-jpa-037**: Sửa sai số câu SELECT trong đáp án và giải thích. Code gọi `findById` cho 200 book (200 câu) + `getAuthors().size()` trigger lazy load authors cho 200 book (200 câu) = **400 câu**, không phải 201. Đã sửa option đúng thành "400 câu SELECT: mỗi book chạy 1 câu findById + 1 câu nạp authors (N+1 nhân đôi)" và cập nhật phần giải thích tương ứng.
- Các câu hỏi còn lại (từ qz-spring-021 đến qz-api-040, qz-jpa-030 đến qz-jpa-041, qz-db-021 đến qz-db-029) đều đúng kỹ thuật, không cần sửa.
- node scripts/validate.js chạy OK cho js/data/quiz-spring.js (lỗi validate nằm ở file khác không thuộc sở hữu).
