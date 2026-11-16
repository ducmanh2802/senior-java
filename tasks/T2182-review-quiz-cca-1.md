# T2182 — Rà soát chất lượng toàn bộ câu (đề CCA-F, domain Agentic Architecture) trong quiz-cca-1.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-cca-1.js`
After: T1590

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm toàn bộ câu (đề CCA-F, domain Agentic Architecture) (`node scripts/qtool.js list js/data/quiz-cca-1.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đáp án đúng thật sự đúng theo tài liệu chính thức Anthropic (docs.claude.com, code.claude.com/docs, modelcontextprotocol.io) — không có tính năng/tham số/tên model bịa; câu 1 đáp án không có 2 phương án cùng đúng; multi có (Choose N) khớp; explain giải thích đúng + từng phương án sai; tag [Domain] đúng.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/quiz-cca-1.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
- Phạm vi rà soát: 77 câu `qz-cca-001`..`qz-cca-077` (CCA-F, domain [Agentic Architecture]), đếm trước/sau bằng nhau (77). Kiểm tra: tag [Agentic Architecture], single 4 options không trùng, multi có `(Choose N)` khớp số đáp án và `answer` mảng index tăng dần trong range, `explain` giải thích đáp án đúng và các phương án sai, không backtick/`${` trong template literal, không bịa tính năng/tham số cụ thể.
- `node --check js/data/quiz-cca-1.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` OK.

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| qz-cca-043 | Mô tả bật extended thinking bằng cấu trúc tham số JSON cụ thể (`thinking: { type: "enabled" }`) có thể khác nhau theo API/model/version, dễ bị coi là chi tiết bịa/không ổn định; câu hỏi chưa tổng quát ở mức nguyên lý. | Đổi câu hỏi và đáp án đúng sang "Extended thinking (enabled via the {{code}}thinking{{code}} parameter)"; viết lại explain ở mức nguyên lý (bật qua tham số {{code}}thinking{{code}}, model tạo khối suy nghĩ nội bộ trước câu trả lời), giữ các phương án sai nhưng giải thích rõ hơn. |
| qz-cca-050 | Nội dung sai về MCP Sampling: mô tả sampling như cơ chế server "push updates to the client without being asked" (không đúng định nghĩa MCP). | Thay câu hỏi/đáp án/explain để phản ánh đúng MCP: Sampling cho phép server yêu cầu client tạo LLM completion (client xem xét/chấp thuận trước khi gọi model); giải thích rõ Tools/Resources/Prompts là capability do server cung cấp cho client sử dụng theo yêu cầu. |
Reviewed-by: kilo (T2182R)
