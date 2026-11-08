# T1027 — Dịch sang tiếng Anh: lessons-security (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-security-8.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-security.js`: **lesson-security-009**.

Viết vào `js/i18n/lessons-security-8.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-security-8.en.js` và `node scripts/check-i18n.js lessons-security-8` → OK, rồi `Status: DONE`.

## Notes
- Created `js/i18n/lessons-security-8.en.js` with English overlay for `lesson-security-009` (SSRF) only: `title`, `goals`, `body`, `exercises[0].title/prompt/hints/explain`, `check[0..2].q/options/explain`. Kept `id` header list accurate; no `starter/tests/reference` copied.
- Preserved markup (`**`, `{{code}}`, `###`, lists, `>`, tables, `~~~text`/`~~~seq`/`~~~java` blocks), kept technical terms/IDs/numbers/URLs, mapped "**Tóm tắt:**" → "**Summary:**" and "### Liên hệ phỏng vấn" → "### Interview notes"; translated code comments inside fenced blocks; no backticks or `${` added.
- Checks: `node --check js/i18n/lessons-security-8.en.js` OK; `node scripts/check-i18n.js lessons-security-8` → `OK — 1 mục đã dịch.`.
- `node scripts/validate.js` still reports a pre-existing error outside this task: `q-banking.js: banking-014.a: sơ đồ ~~~seq lỗi: cần 2–6 actors (đang có 8)` (present before this run) plus existing warnings (`modern-033` short answer, 2 lessons not in PATH). No files outside `js/i18n/lessons-security-8.en.js` and this task file were modified.
Reviewed-by: check-i18n (translation, no LLM review)
