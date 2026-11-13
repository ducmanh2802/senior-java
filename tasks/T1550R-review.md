# T1550R — Fact-check nội dung mới của T1550

Status: DONE
Agent: opencode
Owns: `js/data/quiz-cca-1.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1550 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 2 lỗi kỹ thuật trong nội dung mới (questions qz-cca-041 đến qz-cca-065):

1. **qz-cca-059**: Sửa tên field từ `allowed_tools` → `tools` (field thực tế trong Claude Code subagent definition `.claude/agents/*.md` là `tools` array, không phải `allowed_tools`).
2. **qz-cca-062**: Sửa câu hỏi multi-select từ "Choose 2" → "Choose 3" và answer từ `[0, 1]` → `[0, 1, 2]` vì MCP spec định nghĩa 3 capability chính cho client interaction: Tools, Resources, Prompts (cả 3 đều valid). Cập nhật explain tương ứng.

Validation: `node scripts/validate.js` → OK — không có lỗi.
