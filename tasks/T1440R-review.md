# T1440R — Fact-check nội dung mới của T1440

Status: DONE
Agent: opencode
Owns: `js/data/q-english.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1440 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Không có lỗi. Nội dung mới thêm là các section "Lỗi người Việt hay mắc" và "Real-life example" cho 5 câu hỏi topic english (code review, layoff, salary/promotion, closing pitch, clarification). Đây là nội dung học tiếng Anh phỏng vấn (phát âm, ngữ pháp, kỹ năng giao tiếp) — không chứa API/flag/cơ chế Java/Kafka/Spring nên không có lỗi kỹ thuật. Markup hợp lệ, validator OK.
