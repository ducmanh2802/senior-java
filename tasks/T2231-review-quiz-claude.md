# T2231 — Rà soát chất lượng toàn bộ câu trong quiz-claude.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-claude.js`
After: T2185

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm toàn bộ câu (`node scripts/qtool.js list js/data/quiz-claude.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: tìm mọi câu nhắc temperature, top_p, top_k, budget_tokens, thinking enabled/disabled, tool_choice any/tool (ép gọi tool), assistant prefill, extended thinking, tên model cũ (Claude 3.x, Sonnet 4.5, Opus 4.x được nói như model mới nhất). Trên model hiện hành (Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.2): tham số sampling bị từ chối (400); thinking là adaptive, độ sâu chỉnh bằng output_config.effort, budget_tokens trả 400; Opus 5.5 không tắt được thinking; Sonnet 5.5 tắt bằng thinking type between_tools; tool_choice any/tool trả 400 trên Opus 5.5/Sonnet 5.5/Fable 5.1+ (dùng auto + prompt + strict: true hoặc structured outputs); prefill trả 400; model mạnh nhất là Fable 5.2 ($8/$40), Opus 5.5 $4/$20, Sonnet 5.5 $2/$10, Haiku 5.5 $0.10/$0.50. Câu nào dạy cách cũ như cách đúng thì VIẾT LẠI cho đúng (giữ id, giữ tag [Domain]); câu hỏi chung về khái niệm vẫn đúng thì giữ. Notes: bảng id .
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/quiz-claude.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| qz-claude-021, 022, 023, 024, 026, 027, 029, 030, 041, 042, 043, 050, 052, 084, 085, 089, 090, 091, 093, 094, 095, 133, 136, 137, 141, 144, 147, 152, 153, 155, 157, 158, 159, 160, 161, 162, 163, 164, 165, 170, 175, 192, 193, 196, 197, 201, 205, 219, 220 | Tên model cũ `Fable 5.1` được dùng như model mới nhất | Đổi thành `Fable 5.2` (model hiện hành, $8/$40) everywhere |
| qz-claude-157 | Giá Fable 5.1 ($10/$50) còn sai | Cập nhật thành $8/$40 input/output |
| qz-claude-152 | Ghi `Haiku 3.5` là ngoại lệ không tính cache vào ITPM | Sửa thành mô tả đúng hiện hành: một số model như Haiku 5.5 có giới hạn prompt trên 100K token |

Các câu còn lại: đã kiểm tra temperature/top_p/top_k/budget_tokens/prefill/thinking/tool_choice — tất cả đều được dùng trong ngữ cảnh "cách cũ bị lỗi 400" (đúng), không có câu nào dạy cách cũ như cách đúng. Số mục: 220 trước, 220 sau.
Reviewed-by: verify-only (review task)
