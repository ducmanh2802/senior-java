# T1434R — Fact-check nội dung mới của T1434

Status: DONE
Agent: opencode
Owns: `js/data/q-english.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1434 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã chạy validate: OK — không có lỗi.
Kiểm tra kỹ thuật các câu hỏi mới/cập nhật (english-007, 009, 010, 011, 012, 013, 014, 015, 016, 017, 018) - không phát hiện lỗi kiến thức kỹ thuật (API Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x). Nội dung bổ sung: giải thích chi tiết hơn, thêm cụm từ hữu ích, phần "Lỗi người Việt hay mắc", Senior tip - đều đúng kỹ thuật. Không sửa markup, không có backtick hay ${ trong template literal.
