# T2788R — Fact-check nội dung mới của T2788

Status: DONE
Agent: opencode
Owns: `js/data/sd-problems.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2788 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- sd-064 (line ~9696): thay chỗ trống "$X / $Y" (số liệu vô căn cứ) bằng mô tả định tính "hot 12TB SSD và cold 10TB S3 (cold rẻ hơn hot khoảng 10 lần)".
- sd-065 (line ~9757): sửa ký tự kết hợp U+0300 lẫn chữ hỏng "m bảo" → "cần đảm bảo dashboard" (lỗi markup/văn bản hỏng).
- sd-062, sd-063, sd-066: kiểm tra kỹ thuật (API, công thức, cơ chế, số liệu) và markup (`~~~`, bảng, `{{code}}`, không có backtick/`${`) — không tìm thấy lỗi.
- validate.js: 0 lỗi, 0 cảnh báo thuộc js/data/sd-problems.js. Các lỗi còn lại trong quiz-ops.js, lessons-*.js là file không sở hữu (quy tắc 3 AGENTS.md), không được sửa.
