# T1519R — Fact-check nội dung mới của T1519

Status: DONE
Agent: opencode
Owns: `js/data/quiz-cca-4.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1519 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, defaulted sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỉ cần kiến thức ĐÚG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK (27 câu trắc nghiệm, không lỗi).

## Notes
- Đã review toàn bộ 27 câu (qz-ccat-001 … qz-ccat-027) trong `js/data/quiz-cca-4.js`.
- Không phát hiện lỗi kiến thức kỹ thuật: các tool_choice (auto/any/none/forced tool), JSON Schema validation, authorization backend, idempotent retry, prompt injection, MCP primitives (tools/resources/prompts), transports (stdio/Streamable HTTP), least privilege, scope (.mcp.json vs user scope) đều đúng so với Claude Developer Platform / Messages API hiện hành.
- Không phát hiện lỗi markup: không có backtick, không có ${, không có HTML thô, không có ký tự ngoại ngữ, không có {{ unmatched, không có ~~~ chưa đóng.
- Không phát hiện lỗi schema: 4 multi-answer questions (qz-ccat-021/022/023/024/025/026/027) đều có answer tăng dần, index trong range, q ghi "(Choose 2)" khớp answer.length.
- Không thay đổi nội dung đã có ở HEAD; file chỉ thêm 27 câu mới.
- Chạy `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo path.js lesson-design-007 không liên quan đến task này).
