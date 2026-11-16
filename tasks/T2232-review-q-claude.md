# T2232 — Rà soát chất lượng toàn bộ câu trong q-claude.js

Status: DONE
Agent: kilo
Owns: `js/data/q-claude.js`
After: T2190

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm toàn bộ câu (`node scripts/qtool.js list js/data/q-claude.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: tìm mọi câu nhắc temperature, top_p, top_k, budget_tokens, thinking enabled/disabled, tool_choice any/tool (ép gọi tool), assistant prefill, extended thinking, tên model cũ (Claude 3.x, Sonnet 4.5, Opus 4.x được nói như model mới nhất). Trên model hiện hành (Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.2): tham số sampling bị từ chối (400); thinking là adaptive, độ sâu chỉnh bằng output_config.effort, budget_tokens trả 400; Opus 5.5 không tắt được thinking; Sonnet 5.5 tắt bằng thinking type between_tools; tool_choice any/tool trả 400 trên Opus 5.5/Sonnet 5.5/Fable 5.1+ (dùng auto + prompt + strict: true hoặc structured outputs); prefill trả 400; model mạnh nhất là Fable 5.2 ($8/$40), Opus 5.5 $4/$20, Sonnet 5.5 $2/$10, Haiku 5.5 $0.10/$0.50. Câu nào dạy cách cũ như cách đúng thì VIẾT LẠI cho đúng (giữ id, giữ tag [Domain]); câu hỏi chung về khái niệm vẫn đúng thì giữ. Notes: bảng id .
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-claude.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| claude-017 | Bảng breaking changes viết "thinking disabled để tiết kiệm: 400 trên Opus (và Sonnet)", mâu thuẫn với quy tắc Sonnet dùng type "between_tools" để tắt thinking | Sửa ô: 400 trên Opus; trên Sonnet dùng type "between_tools", hạ effort |
| claude-031 | Án prefill không hỗ trợ "từ Claude 4.6 trở đi" — phiên bản này chưa xác thực, dễ sai | Viết lại: prefill ở lượt assistant cuối không hỗ trợ trên các model hiện hành (5.x), gửi lên lỗi 400 |
| claude-010, claude-011 | Bảng giá và bảng tính năng chỉ liệt kê Haiku/Sonnet/Opus, thiếu Fable (model mạnh nhất $8/$40 theo spec) | Bổ sung dòng Fable vào bảng giá claude-010; đổi "Model suy luận mạnh nhất" → Fable, cập nhật tóm tắt "Bốn tầng" và trả lời miệng 1 phút |

Số câu giữ nguyên 42 (không xoá, không đổi id). Các mục khác đã review (claude-012 thinking/effort/budget_tokens/temperature, claude-027 tool_choice any/tool, claude-039 breaking changes, claude-031 prefill) đã dạy đúng theo model hiện hành (Opus 5.5/Sonnet 5.5/Haiku 5.5/Fable 5.2): sampling + budget_tokens + prefill + forced tool_choice bị 400, thinking adaptive qua output_config.effort, Opus không tắt thinking, Sonnet tắt bằng between_tools.
Reviewed-by: verify-only (review task)
