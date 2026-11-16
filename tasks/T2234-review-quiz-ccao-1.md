# T2234 — Rà soát chất lượng toàn bộ câu (đề Associate: thêm kiểm tra phương án sai không được sai quá lộ liễu — viết lại distractor cho hợp lý, gần đúng như đề thật) trong quiz-ccao-1.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-ccao-1.js`
After: T2177

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| qz-ccao-002 | Distractor "Ask Claude to make the statement even more confident so it reads better" quá hài hước, không plausibility | Viết lại: "Ask Claude to repeat the deadline with no surrounding context to double-check it"; đồng bộ explain |
| qz-ccao-030 | Distractor "That the department will forget how to type" hài hước | Viết lại: "That the detailed notes and shortcuts one expert developed will not transfer to other people without training and a shared reference" |
| qz-ccao-049 | Distractor 'Say "please" twice so the answer feels more polite' hài hước | Viết lại: "Mention the deadline by which the list is needed, so Claude can prioritise and keep it short"; đồng bộ explain |
| qz-ccao-067 | Distractor "Any task at all → the mobile voice assistant and nothing else" hài hước | Viết lại: "Any task at all → a single shared chat that everyone writes into, regardless of data sensitivity"; đồng bộ explain |
| qz-ccao-069 | Distractor "Share a single paid login across the whole neighbourhood to split the cost" hài hước | Viết lại: "Share a single paid login across several family members to split the cost"; đồng bộ explain |
| qz-ccao-071 | Distractor "Whether the interface offers a dark theme" không plausibility | Viết lại: "Whether the agent can be tested in a sandbox or staging environment before it is allowed to act on real data"; đồng bộ explain |
| qz-ccao-097 | Distractor "Convert the PDF into a video so it becomes smaller" hài hước | Viết lại: "Convert the PDF to a plain-text file with only the pages that matter, or copy the key text into the chat"; đồng bộ explain |

- Không tìm thấy đề cập temperature/top_p/top_k/budget_tokens/thinking/tool_choice/prefill/tên model cũ nào → không cần viết lại theo mục 2.
- Đã chạy: `node --check js/data/quiz-ccao-1.js` → SYNTAX OK; `node scripts/build-light-index.js` → OK; `node scripts/validate.js` → OK — không có lỗi.
- Không commit, không đổi file khác.

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm toàn bộ câu (đề Associate: thêm kiểm tra phương án sai không được sai quá lộ liễu — viết lại distractor cho hợp lý, gần đúng như đề thật) (`node scripts/qtool.js list js/data/quiz-ccao-1.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: tìm mọi câu nhắc temperature, top_p, top_k, budget_tokens, thinking enabled/disabled, tool_choice any/tool (ép gọi tool), assistant prefill, extended thinking, tên model cũ (Claude 3.x, Sonnet 4.5, Opus 4.x được nói như model mới nhất). Trên model hiện hành (Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.2): tham số sampling bị từ chối (400); thinking là adaptive, độ sâu chỉnh bằng output_config.effort, budget_tokens trả 400; Opus 5.5 không tắt được thinking; Sonnet 5.5 tắt bằng thinking type between_tools; tool_choice any/tool trả 400 trên Opus 5.5/Sonnet 5.5/Fable 5.1+ (dùng auto + prompt + strict: true hoặc structured outputs); prefill trả 400; model mạnh nhất là Fable 5.2 ($8/$40), Opus 5.5 $4/$20, Sonnet 5.5 $2/$10, Haiku 5.5 $0.10/$0.50. Câu nào dạy cách cũ như cách đúng thì VIẾT LẠI cho đúng (giữ id, giữ tag [Domain]); câu hỏi chung về khái niệm vẫn đúng thì giữ. Notes: bảng id .
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/quiz-ccao-1.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
Reviewed-by: verify-only (review task)
