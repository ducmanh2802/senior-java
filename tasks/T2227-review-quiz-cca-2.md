# T2227 — Rà soát chất lượng toàn bộ câu trong quiz-cca-2.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-cca-2.js`
After: T2183

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm toàn bộ câu (`node scripts/qtool.js list js/data/quiz-cca-2.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: tìm mọi câu nhắc temperature, top_p, top_k, budget_tokens, thinking enabled/disabled, tool_choice any/tool (ép gọi tool), assistant prefill, extended thinking, tên model cũ (Claude 3.x, Sonnet 4.5, Opus 4.x được nói như model mới nhất). Trên model hiện hành (Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.2): tham số sampling bị từ chối (400); thinking là adaptive, độ sâu chỉnh bằng output_config.effort, budget_tokens trả 400; Opus 5.5 không tắt được thinking; Sonnet 5.5 tắt bằng thinking type between_tools; tool_choice any/tool trả 400 trên Opus 5.5/Sonnet 5.5/Fable 5.1+ (dùng auto + prompt + strict: true hoặc structured outputs); prefill trả 400; model mạnh nhất là Fable 5.2 ($8/$40), Opus 5.5 $4/$20, Sonnet 5.5 $2/$10, Haiku 5.5 $0.10/$0.50. Câu nào dạy cách cũ như cách đúng thì VIẾT LẠI cho đúng (giữ id, giữ tag [Domain]); câu hỏi chung về khái niệm vẫn đúng thì giữ. Notes: bảng id .
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/quiz-cca-2.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

## Notes
- Rà soát 55 câu qz-ccaf-001..055: không có câu nào nhắc temperature/top_p/top_k/budget_tokens/thinking/prefill/tool_choice/model cũ. File là quiz Claude Code Configuration, không liên quan API sampling. Không sửa nội dung.
- node --check OK; build-light-index OK; validate OK.
