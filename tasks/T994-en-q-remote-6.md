# T994 — Dịch sang tiếng Anh: q-remote (4 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-remote-6.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-remote.js`: **remote-025, remote-026, remote-027, remote-028**.

Viết vào `js/i18n/q-remote-6.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-remote-6.en.js` và `node scripts/check-i18n.js q-remote-6` → OK, rồi `Status: DONE`.

## Notes
- Translated `remote-025`–`remote-028` (q, a, follow) into `js/i18n/q-remote-6.en.js` using `App.i18n.content` overlay; header lists all 4 ids. Preserved all markup (`**`, `{{code}}`, `###`, lists, tables, `>`, `~~~`), labels (`**Summary:**`, `> Senior tip:`, `### Interview notes` style not present in source), and code-block content/comments translated where Vietnamese appeared. No backticks, no `${`, template literals used for long strings.
- Checks: `node --check js/i18n/q-remote-6.en.js` (OK), `node scripts/check-i18n.js q-remote-6` → `OK — 4 mục đã dịch.`, `node scripts/validate.js` → `OK — không có lỗi.` (pre-existing warnings in q-java.js/path.js unchanged).
- Only owned files modified (`js/i18n/q-remote-6.en.js`, this task file). No git commit/push, no processes killed, no browser/npm install.
Reviewed-by: check-i18n (translation, no LLM review)
