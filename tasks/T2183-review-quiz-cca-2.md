# T2183 — Rà soát chất lượng toàn bộ câu (đề CCA-F) trong quiz-cca-2.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-cca-2.js`
After: T1591

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm toàn bộ câu (đề CCA-F) (`node scripts/qtool.js list js/data/quiz-cca-2.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đáp án đúng thật sự đúng theo tài liệu chính thức Anthropic (docs.claude.com, code.claude.com/docs, modelcontextprotocol.io) — không có tính năng/tham số/tên model bịa; câu 1 đáp án không có 2 phương án cùng đúng; multi có (Choose N) khớp; explain giải thích đúng + từng phương án sai; tag [Domain] đúng.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/quiz-cca-2.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|----|--------------|-----------|
| qz-ccaf-001 → qz-ccaf-055 (tất cả 55 câu) | Không có lỗi fact/schema nào phát hiện sau khi chéo với docs.claude.com, code.claude.com docs (CLAUDE.md user/project/local, settings.local.json, .claude/rules/ path scope, .mcp.json, @path import, disable-model-invocation, /init /memory /mcp /plugin /plan, claude -p --output-format json, fail-closed hook, least privilege, deny đè allow, CLAUDE.md không phải ranh giới bảo mật, Messages API không đọc CLAUDE.md local…). multi đều có `(Choose 2)` khớp answer, index tăng dần; explain đều giải thích đúng + từng sai; không backtick/`${` trong template literal. | Không sửa gì, giữ nguyên 55 mục, không đổi id. |
| validate.js | — | `node --check js/data/quiz-cca-2.js` OK; `node scripts/validate.js` → OK — không có lỗi. |
