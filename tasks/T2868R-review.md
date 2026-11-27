# T2868R — Fact-check nội dung mới của T2868

Status: DONE
Agent: opencode
Owns: `js/data/quiz-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2868 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 2 câu hỏi trắc nghiệm có lỗi logic thiết kế:

1. **qz-modern-065**: Câu hỏi gốc hỏi "Code nào **không** biên dịch được?" nhưng TẤT CẢ options đều biên dịch được (B biên dịch với raw type warning). Đã sửa thành hỏi "Code nào dẫn tới **raw type warning** khi biên dịch?" với đáp án B, giải thích chính xác về raw type vs không biên dịch.

2. **qz-modern-068**: Câu hỏi multi-select "Chọn 2" nhưng có 4 đáp án đúng (B, C, D, E đều không tạo Optional<Optional<String>>). Đã thiết kế lại options: thay D, E bằng 2 option tạo nested Optional (`opt.map(Optional::of)`, `opt.map(s -> Optional.of(s.toUpperCase()))`), giờ chỉ B và C là đúng.

Chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → OK (quiz-java.js không còn lỗi).
