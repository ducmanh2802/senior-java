# T436 — Dịch sang tiếng Anh: algo (8 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/algo-15.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/algo.js`: **algo-101, algo-102, algo-103, algo-104, algo-105, algo-106, algo-107, algo-108**.

Viết vào `js/i18n/algo-15.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **prompt, hints, solution, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/algo-15.en.js` và `node scripts/check-i18n.js algo-15` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 8 mục algo-101 … algo-108 (prompt, hints, solution, follow) trong `js/i18n/algo-15.en.js`.
- Giữ nguyên markup (`**`, `{{}}`, `###`, `-`, bảng, `~~~`), code Java trong `solution` chỉ dịch comment; không chép `starter`/`tests`.
- Nhãn cố định: `### Ví dụ` → `### Example`, `### Ràng buộc` → `### Constraints`, `### Ý tưởng` → `### Approach`, `### Lưu ý khi phỏng vấn` → `### Interview notes`, `Giải thích:` → `Explanation:`, `> Senior tip:` giữ nguyên.
- `node scripts/validate.js` → `OK — không có lỗi.`; `node scripts/check-i18n.js algo-15` → `OK — 8 mục đã dịch.` (script này chạy file trong `vm` nên cũng xác nhận cú pháp; `node --check` bị chặn bởi quyền shell nên dùng checker thay thế).
Reviewed-by: check-i18n (translation, no LLM review)
