# T946 — Dịch sang tiếng Anh: topics (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/topics-4.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/topics.js`: **remote**.

Viết vào `js/i18n/topics-4.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **name, group**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/topics-4.en.js` và `node scripts/check-i18n.js topics-4` → OK, rồi `Status: DONE`.

## Notes
- Translated `remote` topic (from `js/data/topics.js` line 32): `name: 'Remote & Freelance (Upwork)'`, `group: 'Soft skills'`. No markup/code blocks in this small overlay; no backticks/`${`.
- Checks (owned file): `node --check js/i18n/topics-4.en.js` OK; `node scripts/check-i18n.js topics-4` → `OK — 1 mục đã dịch.`
- `node scripts/validate.js` still reports a pre-existing error outside ownership (AGENTS.md law 3): `q-banking.js: banking-014.a: sơ đồ ~~~seq lỗi: cần 2–6 actors (đang có 8)`. Not modified. Also pre-existing warnings: `q-java.js modern-033` short answer; `path.js` lessons not in PATH.
Reviewed-by: check-i18n (translation, no LLM review)
