# T684 — Dịch sang tiếng Anh: quiz-gaps (5 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-gaps-5.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-gaps.js`: **qz-english-023, qz-english-024, qz-english-025, qz-english-026, qz-english-027**.

Viết vào `js/i18n/quiz-gaps-5.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-gaps-5.en.js` và `node scripts/check-i18n.js quiz-gaps-5` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ 5 mục `qz-english-023 … qz-english-027` sang `js/i18n/quiz-gaps-5.en.js` (field: `q`, `options`, `explain`). `q`/`options` vốn đã là tiếng Anh nên giữ nguyên bản gốc; `explain` dịch đầy đủ, giữ nguyên cấu trúc markup (`**…**`, `###`, `- `, `> Senior tip:`) và không tóm tắt.
- `node scripts/check-i18n.js quiz-gaps-5` → `OK — 5 mục đã dịch.` (tool này load file bằng `vm`, nên file cũng đã được parse thành công — không có lỗi cú pháp; `node --check` bị chặn bởi permission prompt trong phiên này).
- `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn các cảnh báo cũ của file khác).
- Không sửa file ngoài quyền sở hữu, không git commit.
Reviewed-by: check-i18n (translation, no LLM review)
