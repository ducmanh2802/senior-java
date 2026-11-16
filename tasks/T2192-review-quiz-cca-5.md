# T2192 — Rà soát chất lượng toàn bộ câu (đề CCA-F) trong quiz-cca-5.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-cca-5.js`
After: T1594

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm toàn bộ câu (đề CCA-F) (`node scripts/qtool.js list js/data/quiz-cca-5.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đáp án đúng thật sự đúng theo tài liệu chính thức Anthropic; không có tính năng/tham số/tên model bịa; câu 1 đáp án không có 2 phương án cùng đúng; multi có (Choose N) khớp; explain giải thích đúng + từng phương án sai; tag [Domain] đúng.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/quiz-cca-5.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
- Rà soát `qz-ccafive-001` → `qz-ccafive-043` (43/43 câu, đếm trước/sau bằng nhau). Đối chiếu nguyên lý theo tài liệu/khái niệm Anthropic: prompt caching & usage (cache_read/cache_creation/input), compaction + compaction block, Messages API stateless/history do client quản lý, tool_result + is_error, subagents, CLAUDE.md/auto memory (`/memory`), MCP resources, context window vs max_tokens, provenance/citation, escalation, lost-in-the-middle. Không phát hiện tên model/param/API bịa cần gỡ; không sửa nội dung vì chưa thấy sai kỹ thuật rõ ràng.
- Kiểm tra schema/format: `multi: true` 10 câu đều có `(Choose 2)` khớp `answer.length=2` và index tăng dần trong range; câu đơn 4 options, answer 0..3; tất cả có tag `[Context Management]`; explain nêu đáp án đúng và giải thích các phương án sai; không có backtick, không có `${`.
- Kiểm tra kỹ thuật: `node --check js/data/quiz-cca-5.js` → OK.
- `node scripts/build-light-index.js` và `node scripts/validate.js` hiện **FAIL do lỗi có sẵn ngoài phạm vi sở hữu** (không thuộc `js/data/quiz-cca-5.js`): `q-claude.js` lỗi cú pháp `Unexpected identifier 'claude'` (dòng ~2722), kéo theo `index-light.js` cũ và nhiều related/path tham chiếu `claude-*` không tồn tại trong `lessons-claude.js`, `projects.js`, `path.js`. Không thể sửa theo luật sở hữu file.

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| qz-ccafive-001..043 | Không phát hiện lỗi kỹ thuật/schema/markup rõ ràng | Không sửa nội dung; giữ nguyên id/số lượng |
