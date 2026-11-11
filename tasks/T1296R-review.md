# T1296R — Fact-check nội dung mới của T1296

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1296 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review toàn bộ 70 câu hỏi mới (devops-074 đến devops-143) được thêm vào `js/data/q-devops.js` trong T1296
- Tất cả các section "Ví dụ đời thực" và nội dung kỹ thuật đã được fact-check theo chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x
- Không phát hiện lỗi kỹ thuật nào (API/flag sai, mặc định sai, cơ chế ngược, số liệu vô căn cứ, lỗi markup, chữ nước ngoài lẫn vào)
- `node scripts/validate.js` chạy OK cho q-devops.js (142 câu hỏi, 73 trắc nghiệm)
- Các lỗi validation hiển thị thuộc file khác (q-aws.js, q-soft.js, lessons-testing.js, lessons-aws.js, projects.js, path.js) không thuộc phạm vi sở hữu
