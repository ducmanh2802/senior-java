# T2915R — Fact-check nội dung mới của T2915

Status: DONE
Agent: opencode
Owns: `js/data/quiz-gaps.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2915 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Không có lỗi trong 10 câu hỏi behavioral mới (qz-behavioral-030 đến qz-behavioral-039). Kiểm tra: id duy nhất tăng dần, topic 'behavioral' hợp lệ, single-choice 4 options answer 0-3, multi-choice 4 options answer array sorted unique kèm "(Chọn 2)", markup đúng (không backtick, không ${), tiếng Việt kèm thuật ngữ Anh, explain đầy đủ đúng/sai + Senior tip. Các lỗi validate.js là lỗi có sẵn ở file khác (q-spring-data.js, q-english.js, bugs.js, lessons-*.js, projects.js, path.js) không thuộc sở hữu task này.
