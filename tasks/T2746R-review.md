# T2746R — Fact-check nội dung mới của T2746

Status: DONE
Agent: opencode
Owns: `js/data/q-aws.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2746 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- aws-096.a (dòng 6641): sửa ký tự lạ "정책" (tiếng Hàn) thành "chính sách endpoint giới hạn principal ARN và action".
- Đã fix xong, node --check js/data/q-aws.js → SYNTAX_OK; node scripts/build-light-index.js OK; node scripts/validate.js không còn báo lỗi nào thuộc q-aws.js.
- Lỗi validate còn lại (quiz-ops.js qz-ai-051..060, lessons-modern.js lesson-modern-011, lessons-jpa.js lesson-jpa-020) nằm ngoài quyền sở hữu task (task chỉ sở hữu js/data/q-aws.js, AGENTS.md mục 3) nên không được sửa.