# T2477R — Fact-check nội dung mới của T2477

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2477 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHÍNH SÓA: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Task T2477R: reviewed `js/data/q-spring-data.js`. File passes `node scripts/validate.js` with no errors related to owned file. Content follows AGENTS.md markup rules (no backtick in answers, no `${}` unescaped, template literals safe). All question/answer markup uses supported syntax (`**bold**`, `{{code}}`, `###`, `-`, `>`, `|...|`, `~~~java~~~`, `~~~seq~~~`). No technical API/flag errors found. Content quality meets standards: detailed explanations with **Tóm tắt:**, `###` sections, interview sample answers, `> Senior tip:` at end. Level distribution appropriate (mix of mid/senior/lead). No content addition or wording changes made – only validated existing content.

Status: DONE