# T2523R — Fact-check nội dung mới của T2523

Status: DONE
Agent: opencode
Owns: `js/data/q-english.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2523 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 3 lỗi markup/language mixing trong file q-english.js (câu hỏi mới từ T2523):
- english-224: "### Trả lời mẫu khi phỏng interviews" → "### Trả lời mẫu khi phỏng vấn"
- english-225: "### Trả lời mẫu khi phỏng interviews" → "### Trả lời mẫu khi phỏng vấn"
- english-226: "### Trả lời mẫu khi phỏng interviews" → "### Trả lời mẫu khi phỏng vấn"

english-223 đã đúng ("### Trả lời mẫu khi phỏng vấn"). Không có lỗi kỹ thuật (API, flag, cơ chế, số liệu) trong 4 câu hỏi mới. Validation OK.
