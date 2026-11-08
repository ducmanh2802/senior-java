# T1025 — Dịch sang tiếng Anh: lessons-sql (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-sql-4.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-sql.js`: **lesson-sql-006, lesson-sql-007**.

Viết vào `js/i18n/lessons-sql-4.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-sql-4.en.js` và `node scripts/check-i18n.js lessons-sql-4` → OK, rồi `Status: DONE`.

## Notes
- Added English translations for `lesson-sql-006` (MVCC and transaction isolation: snapshots, phantom reads, and deadlocks) and `lesson-sql-007` (B-tree indexes and covering indexes: why indexes are fast and when they do not help) into `js/i18n/lessons-sql-4.en.js` via `App.i18n.content(...)`.
- Translated required fields only: `title`, `goals`, `body`, `exercises[].title/prompt/hints/explain`, `check[].q/options/explain`. Kept starter/tests/reference code unchanged; preserved markup/`{{code}}`/template-literal safety (no backticks, no `${`).
- Checks: `node --check js/i18n/lessons-sql-4.en.js` OK; `node scripts/check-i18n.js lessons-sql-4` → `OK — 2 mục đã dịch`.
- `node scripts/validate.js` still reports a pre-existing unrelated error I did not touch: `q-banking.js: banking-014.a: sơ đồ ~~~seq lỗi: cần 2–6 actors (đang có 8)` plus existing warnings (`q-java.js modern-033` short answer; `path.js` lessons not in PATH). No files outside owned scope were modified.
Reviewed-by: check-i18n (translation, no LLM review)
