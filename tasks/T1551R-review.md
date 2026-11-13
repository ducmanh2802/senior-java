# T1551R — Fact-check nội dung mới của T1551

Status: DONE
Agent: opencode
Owns: `js/data/quiz-cca-2.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1551 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 15 câu hỏi mới (qz-ccaf-031 đến qz-ccaf-045). Tất cả đều đúng kỹ thuật về tính năng Claude Code: lệnh `/init`, `/mcp`, `/memory`, `/plugin`, file `.mcp.json`, scope user/project/local/enterprise, nested CLAUDE.md, cú pháp import `@path`, hook trong `.claude/settings.json`, project trust prompt, phân biệt Claude Code vs Messages API. Markup hợp lệ. `node scripts/validate.js` → OK. Không có lỗi cần sửa.
