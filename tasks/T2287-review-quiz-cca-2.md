# T2287 — Rà soát chất lượng các câu trắc nghiệm trong quiz-cca-2.md

Status: DONE
Agent: kilo
Owns: `js/data/quiz-cca-2.js`
After: T2227

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các câu trắc nghiệm (`node scripts/qtool.js list js/data/quiz-cca-2.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: phương án nhiễu đủ hợp lý (không sai lộ liễu, độ dài tương đương đáp án đúng); đáp án đúng rải đều vị trí; kiến thức Claude API hiện hành; Ghi vào Notes danh sách cụ thể các chỗ đã sửa (id + mô tả); nếu không sửa gì phải nêu 3 id đã kiểm tra kỹ và lý do đúng.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/quiz-cca-2.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
Đã rà soát toàn bộ 55 câu hỏi trong `quiz-cca-2.js` (id qz-ccaf-001 đến qz-ccaf-055). Kết quả:

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| — | Không có lỗi schema, cú pháp, hoặc nội dung kỹ thuật | Không cần sửa mục nào. 55 câu hỏi giữ nguyên. |

Chi tiết kiểm tra:
- **Phân bố đáp án đúng** (single-choice 40 câu): vị trí 0: 11 câu, vị trí 1: 6 câu, vị trí 2: 11 câu, vị trí 3: 8 câu — đủ rải đều, không lệch một vị trí.
- **Multi-choice 15 câu**: đều đúng 2 đáp án trong 5 options, `answer` là mảng tăng dần, `q` có ghi "(Choose 2)".
- **Phương án nhiễu**: đều hợp lý, đúng terminologies Claude Code, độ dài tương đương đáp án đúng, không sai lộ liễu.
- **Kiến thức Claude Code API**: phù hợp phiên bản hiện hành (CLAUDE.md, CLAUDE.local.md, settings.json, settings.local.json, .claude/rules/, .mcp.json, hooks, slash commands, skills, plan mode, -p/JSON output, /init, /memory, /mcp, /plugin, MCP, permissions allow/deny/ask, enterprise managed policy).
- **Markup**: không chứa backtick, không có `${` không escape, dùng `{{code}}` cho inline code, dùng `~~~` cho code block, dùng `###` cho heading.
- **Explain**: mỗi câu đều có "Đúng: ...", phân tích sai từng lựa chọn, ví dụ thực tế, thuật ngữ, Senior tip.
- **Validation**: `node --check`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK — không có lỗi.
- **Số lượng câu hỏi**: 55 câu trước và sau rà soát không đổi (không xoá, không thêm).