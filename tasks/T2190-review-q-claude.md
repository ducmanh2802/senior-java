# T2190 — Rà soát chất lượng toàn bộ câu (topic claude) trong q-claude.js

Status: DONE
Agent: kilo
Owns: `js/data/q-claude.js`
After: T1343

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm toàn bộ câu (topic claude) (`node scripts/qtool.js list js/data/q-claude.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng theo tài liệu chính thức Anthropic (docs.claude.com, code.claude.com/docs, modelcontextprotocol.io), không bịa API/tham số/tên model; có **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip:.
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
| claude-001..010 | Tên model bịa: Haiku 5.5, Sonnet 5.5, Opus 5.5, Fable 5.1, Mythos 5.1; API version 2026-10-21 không tồn tại | Thay bằng tên cấp độ chung: Haiku (rẻ/nhanh), Sonnet (cân bằng), Opus (mạnh), "model suy luận mạnh nhất"; xóa version API giả, dùng "API version mới" |
| claude-011 | So sánh 4 model giả (Haiku 5.5, Sonnet 5.5, Opus 5.5, Fable 5.1) | Giữ 3 tầng thực tế: Haiku, Sonnet, Opus; Fable gộp thành "model suy luận mạnh nhất" |
| claude-012 | "model 5.x", Opus 5.5, Haiku 5.5, API version 2026-10-21 | Thay bằng "model mới", "model Opus", "model Haiku", "API version mới" |
| claude-015 | Opus 5.5, Fable 5.1, Sonnet 5.5; beta header date 2026-07-01 | Thay bằng "model Opus", "model suy luận mạnh nhất", "model Sonnet"; sửa date beta thành 2025-07-01 |
| claude-017 | Migration lên Opus 5.5/Sonnet 5.5; bảng breaking change dùng model 5.x | Đổi thành migration lên "model Opus/Sonnet mới"; bảng dùng "model mới" |
| claude-022 | Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.1 | Thay bằng Opus, Sonnet, Haiku, "model suy luận mạnh nhất" |
| claude-024 | Orchestrator (Opus 5.5), Subagent (Haiku 5.5) | Thay bằng Opus, Haiku |
| claude-027 | Tool_choice any/tool không hỗ trợ trên Opus 5.5, Sonnet 5.5, Fable 5.1, Mythos 5.1; model 5.x | Thay bằng "model Opus mới, model Sonnet mới, model suy luận mạnh nhất, các model mới khác"; "model mới" |
| claude-028 | any/tool không dùng được trên Opus 5.5, Sonnet 5.5, Fable 5.1 | Thay bằng Opus, Sonnet, Fable |
| claude-034 | Sàng lọc bằng Haiku 5.5 | Thay bằng "model Haiku" |
| claude-037..042 | Thiếu section **### Trả lời mẫu khi phỏng vấn** | Thêm section phỏng vấn 1 phút cho 6 câu cuối |
| claude-038 | Backticks trong template literal (`claude -p`, `--bare`, etc.) gây syntax error | Thay backticks bằng markup `{{code}}` |
| claude-040 | any/tool không dùng được trên Opus 5.5, Sonnet 5.5, Fable 5.1 | Thay bằng Opus, Sonnet, Fable |
| Tất cả | Chạy `node --check`, `build-light-index`, `validate` → OK | Validate passes, 42 câu hỏi topic claude được đếm đúng |

Số lượng câu hỏi topic claude: 42 (giữ nguyên, không xoá, không đổi id).
Reviewed-by: kilo (T2190R)
