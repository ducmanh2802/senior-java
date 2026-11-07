# T1006 — Dịch sang tiếng Anh: labs-thread (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/labs-thread-12.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/labs-thread.js`: **lab-thread-012**.

Viết vào `js/i18n/labs-thread-12.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, scenario, questions, hints, answer, rubric**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/labs-thread-12.en.js` và `node scripts/check-i18n.js labs-thread-12` → OK, rồi `Status: DONE`.

## Notes
- Translated `lab-thread-012` (thread starvation deadlock: parent tasks waiting for child tasks on the same fixed 8-thread pool) into `js/i18n/labs-thread-12.en.js` via `App.i18n.content` overlay.
- Fields translated: `title`, `scenario`, `questions`, `hints`, `answer`, `rubric`. All markup preserved (`**`, `{{code}}`, `###`, lists, table, `~~~seq`/`~~~java` blocks). Technical terms and identifiers kept as-is. No backticks or `${` inside template literals.
- Checks: `node --check js/i18n/labs-thread-12.en.js` OK; `node scripts/check-i18n.js labs-thread-12` → `OK — 1 mục đã dịch.` `node scripts/validate.js` reports 3 pre-existing `~~~seq` errors in `q-banking.js` (unrelated to owned files); no errors from i18n changes. No git commit, no browsers/process kills.
Reviewed-by: check-i18n (translation, no LLM review)
