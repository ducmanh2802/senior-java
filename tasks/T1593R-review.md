# T1593R — Fact-check nội dung mới của T1593

Status: DONE
Agent: opencode (kilo)
Owns: `js/data/quiz-cca-4.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1593 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- Review nội dung mới của T1593 trong `js/data/quiz-cca-4.js`: 10 câu `qz-ccat-042` … `qz-ccat-051` (topic `claude`, tag `[Tool Design & MCP]`), 7 câu một đáp án + 3 câu multi (Chọn 2).
- Kết quả fact-check: **không có lỗi kỹ thuật**. MCP error handling (`isError` trong CallToolResult chứ không phải JSON-RPC -32603), token passthrough/confused deputy + audience, localhost không phải ranh giới an toàn (DNS rebinding, Origin/127.0.0.1), namespacing `mcp__server__tool`, roots/list + roots/list_changed + chặn traversal/symlink, sampling cần human-in-the-loop, validate outputSchema/structuredContent, cancellation notify + checkpoint, managed-mcp allowlist (managed-mcp.json/allowManagedMcpServersOnly), `disable_parallel_tool_use` (giữ ý định trùng với quy ước đã có ở quiz-claude.js:574).
- Markup: không backtick, không `${`, `###` không thụt, `~~~` cân bằng; id dạng qz-<topic>-NNN, unique, nối tiếp id lớn nhất (041); multi answer tăng dần, `(Choose 2)` khớp answer.length.
- Không sửa nội dung đã có ở HEAD, không thêm/xoá mục, không sửa file khác.
- `node --check js/data/quiz-cca-4.js` OK; `node scripts/validate.js js/data/quiz-cca-4.js` → `OK — không có lỗi.` (lỗi còn lại của validate toàn repo nằm ở q-ai.js, file không thuộc task này). Không commit.