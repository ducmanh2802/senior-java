# T990 — Dịch sang tiếng Anh: q-remote (5 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-remote-2.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-remote.js`: **remote-006, remote-007, remote-008, remote-009, remote-010**.

Viết vào `js/i18n/q-remote-2.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-remote-2.en.js` và `node scripts/check-i18n.js q-remote-2` → OK, rồi `Status: DONE`.

## Notes
- Translated 5 items: `remote-006..010` (q, a, follow) into `js/i18n/q-remote-2.en.js` using `App.i18n.content`.
- Preserved full detail/structure, markup, tables, `~~~seq` diagrams, and code blocks; translated Vietnamese comments in code blocks; kept "**Summary:**", "> Senior tip:", "### Interview notes" labels and technical terms/numbers.
- Verified: `node --check js/i18n/q-remote-2.en.js` OK; `node scripts/check-i18n.js q-remote-2` → "OK — 5 mục đã dịch."; `node scripts/validate.js` → "OK — không có lỗi." (only pre-existing warnings: `q-java.js modern-033` short answer, 2 lessons not in PATH). No git commands run, no other files changed.
Reviewed-by: check-i18n (translation, no LLM review)
