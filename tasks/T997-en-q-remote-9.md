# T997 — Dịch sang tiếng Anh: q-remote (9 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-remote-9.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-remote.js`: **remote-038, remote-039, remote-040, remote-041, remote-042, remote-043, remote-044, remote-045, remote-046**.

Viết vào `js/i18n/q-remote-9.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-remote-9.en.js` và `node scripts/check-i18n.js q-remote-9` → OK, rồi `Status: DONE`.

## Notes
- 2026-11-08: Translated 9 items (remote-038..046) in `js/i18n/q-remote-9.en.js` with `q`, `a`, `follow` fields; preserved markup, code blocks, English templates, and `> Senior tip:` labels; mapped Vietnamese fixed labels to "**Summary:**" and "### Interview notes" (none of these headings appeared in the source text). `node --check` and `node scripts/check-i18n.js q-remote-9` passed; `node scripts/build-light-index.js` regenerated `js/data/index-light.js`; `node scripts/validate.js` reported OK (warnings only in `q-java.js`/`path.js`, not owned by this task).
Reviewed-by: check-i18n (translation, no LLM review)
