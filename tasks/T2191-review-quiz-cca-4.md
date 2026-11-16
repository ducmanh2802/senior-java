# T2191 — Rà soát chất lượng toàn bộ câu (đề CCA-F) trong quiz-cca-4.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-cca-4.js`
After: T1593

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm toàn bộ câu (đề CCA-F) (`node scripts/qtool.js list js/data/quiz-cca-4.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đáp án đúng thật sự đúng theo tài liệu chính thức Anthropic; không có tính năng/tham số/tên model bịa; câu 1 đáp án không có 2 phương án cùng đúng; multi có (Choose N) khớp; explain giải thích đúng + từng phương án sai; tag [Domain] đúng.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/quiz-cca-4.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

Kết quả rà soát 51 mục (qz-ccat-001 → qz-ccat-051, topic claude, domain [Tool Design & MCP]):

| id | lỗi tìm thấy | đã sửa gì |
|----|--------------|-----------|
| qz-ccat-001 … qz-ccat-051 | Không tìm lỗi: đáp án đúng theo tài liệu Anthropic (tool_choice auto/any/none/tool + disable_parallel_tool_use, tool_result/tool_use_id/is_error, JSON Schema input + additionalProperties false, MCP primitives tools/resources/prompts, stdio/Streamable HTTP, .mcp.json project vs user, least privilege, prompt injection, idempotency, readOnlyHint, init/capabilities, tools/list_changed, resource subscriptions, async job, telemetry redaction, concurrency + per-ID kết quả, phân trang, data minimization, migration/regression, isError không phải JSON-RPC -32603, token passthrough/confused deputy, localhost/DNS rebinding/Origin, namespacing mcp__server__tool, roots, sampling human-in-the-loop, outputSchema/structuredContent, notifications/cancelled, managed allowlist + audit); multi đều có (Choose 2) khớp mảng answer 2 phần tử tăng dần; single chỉ 1 đáp án đúng; explain giải thích từng phương án sai; tag [Domain] đúng; không backtick, không ${ trong template literal. | Giữ nguyên, không sửa (số mục 51 → 51, không xoá, không đổi id) |

Xác minh lại: `node --check js/data/quiz-cca-4.js` (OK), đếm id 51 mục (qz-ccat-001→qz-ccat-051), `node scripts/validate.js` → `OK — không có lỗi.` (toàn repo). Không chạy `build-light-index.js` vì không thay đổi nội dung câu hỏi/quiz. Không commit. Chỉ sửa file sở hữu (`js/data/quiz-cca-4.js` không cần chỉnh; cập nhật ghi chú task).

### Lần chạy sau (rà soát lại toàn bộ, xác nhận)
- Đọc lại toàn bộ 51 mục theo từng khối, đối chiếu tài liệu Anthropic/MCP: tool_choice (auto/any/none/tool + disable_parallel_tool_use), tool_result/tool_use_id/is_error, JSON Schema input + additionalProperties false, MCP primitives tools/resources/prompts, stdio/Streamable HTTP, .mcp.json project vs user scope, least privilege, prompt injection, idempotency, readOnlyHint, init/capabilities, tools/list_changed, resource subscriptions, async job, telemetry redaction, concurrency + per-ID kết quả, phân trang, data minimization, migration/regression, isError vs JSON-RPC -32603, token passthrough/confused deputy, localhost/DNS rebinding/Origin, namespacing mcp__server__tool, roots, sampling human-in-the-loop, outputSchema/structuredContent, notifications/cancelled, managed allowlist + audit.
- 14 câu multi đều có "(Choose 2)" khớp mảng answer 2 phần tử tăng dần; single chỉ 1 đáp án đúng; explain giải thích từng phương án sai; tag [Tool Design & MCP] đúng.
- Không có backtick nội bộ (102 backtick = 51 cặp template literal), không có `${`.
- `node --check` OK; `node scripts/validate.js` → `OK — không có lỗi.`; không thay đổi nội dung nên không cần build-light-index; không commit.
