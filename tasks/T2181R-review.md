# T2181R — Fact-check nội dung mới của T2181

Status: DONE
Agent: opencode
Owns: `js/data/quiz-ccap-1.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2181 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `qz-ccap-152`: sửa `answer` từ `3` thành `2` để khớp đáp án đúng (thumbs up/down + review định kỳ + cập nhật knowledge source).
- `qz-ccap-152`: sửa lỗi gõ thuật ngữ "vòng tin nh phản hồi" → "vòng phản hồi".
- `qz-ccap-159`: thay cụm tiếng Anh lẫn "sudden increase in requests —" bằng giải thích tiếng Việt rõ nghĩa cho `Traffic spike`.
- `node --check js/data/quiz-ccap-1.js` → OK. `node scripts/validate.js` → OK (không có lỗi).
