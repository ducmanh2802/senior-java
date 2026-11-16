# T2182R — Fact-check nội dung mới của T2182

Status: DONE
Agent: opencode
Owns: `js/data/quiz-cca-1.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2182 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Review file sở hữu: `js/data/quiz-cca-1.js` (diff HEAD có 2 câu: qz-cca-043, qz-cca-050).

- qz-cca-043 (Extended Thinking, Claude API): ĐÚNG. Bật bằng tham số `thinking: { type: "enabled" }`, model sinh thinking block trước câu trả lời cuối; max_tokens giới hạn độ dài output, temperature kiểm soát độ ngẫu nhiên, system prompt chỉ định hướng hành vi. Không có lỗi kỹ thuật/markup.
- qz-cca-050 (MCP Sampling): ĐÚNG sau sửa của model trước. Sampling cho phép server yêu cầu LLM completion từ client (client phải chấp thuận trước khi gọi model); Tools/Resources/Prompts đều do client khởi tạo, không có server push trong MCP spec. Câu trước ("push updates without being asked") sai kỹ thuật, đã được sửa đúng.

Không có lỗi kiến thức trong file tôi sở hữu → không sửa nội dung além diff đã có.

`node scripts/validate.js` KHÔNG in OK do lỗi ở FILE KHÔNG SỞ HỮU (tôi không được sửa theo AGENTS.md §3):
- `js/data/q-claude.js:2722`: lỗi cú pháp (backtick `` `claude -p` `` nằm trong template literal `a: \`...\``) — này cũng chặn `node scripts/build-light-index.js`, nên `index-light.js` báo cũ.
- `js/data/lessons-claude.js`, `js/data/projects.js`, `js/data/path.js`: tham chiếu id `claude-XXX` không tồn tại.
Tất cả lỗi trên nằm ngoài `quiz-cca-1.js`, đề xuất integrator xử lý. Không lỗi nào thuộc nội dung review của T2182R.

Status: DONE
