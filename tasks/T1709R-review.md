# T1709R — Fact-check nội dung mới của T1709

Status: DONE
Agent: opencode
Owns: `js/data/lessons-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1709 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Sửa lesson-jvm-009: Phân loại sai `StackOverflowError` thành một loại `OutOfMemoryError` — thực tế `StackOverflowError` là một `Error` riêng biệt, không phải `OutOfMemoryError`. Đã tách riêng mục F cho `StackOverflowError` và sửa tiêu đề phần thành "Năm loại lỗi bộ nhớ kinh điển" (5 OOM + 1 StackOverflowError). Cập nhật tương ứng phần "Liên hệ phỏng vấn".
