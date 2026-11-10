# T998 — Dịch sang tiếng Anh: q-remote (12 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-remote-10.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-remote.js`: **remote-047, remote-048, remote-049, remote-050, remote-051, remote-052, remote-053, remote-054, remote-055, remote-056, remote-057, remote-058**.

Viết vào `js/i18n/q-remote-10.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-remote-10.en.js` và `node scripts/check-i18n.js q-remote-10` → OK, rồi `Status: DONE`.

## Notes
- Translated 12 items (remote-047..remote-058) into `js/i18n/q-remote-10.en.js` with `q`, `a`, `follow` overlays; preserved markup, code blocks (comments translated where Vietnamese), and `> Senior tip:` labels.
- `node --check js/i18n/q-remote-10.en.js` OK.
- `node scripts/check-i18n.js q-remote-10` → `OK — 12 mục đã dịch.`
- `node scripts/validate.js` → `OK — không có lỗi.` (2 pre-existing warnings unrelated).
Reviewed-by: check-i18n (translation, no LLM review)
