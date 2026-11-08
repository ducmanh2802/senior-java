# T1017 — Dịch sang tiếng Anh: lessons-jpa (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-jpa-3.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-jpa.js`: **lesson-jpa-008, lesson-jpa-009**.

Viết vào `js/i18n/lessons-jpa-3.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-jpa-3.en.js` và `node scripts/check-i18n.js lessons-jpa-3` → OK, rồi `Status: DONE`.

## Notes
- Translated `lesson-jpa-008` (Dirty checking: snapshot, @DynamicUpdate, and the cost) and `lesson-jpa-009` (Flush order and the ActionQueue) into `js/i18n/lessons-jpa-3.en.js`, covering: title, goals, body, exercises[].title/prompt/hints/explain, check[].q/options/explain. Starter/tests/reference code was not copied (per spec).
- Preserved all markup (`**`, `{{...}}`, `###`, lists, `>`, tables, `~~~` code fences) and kept terminology, numbers, labels (`**Summary:**` style preserved as in source where present; `> Senior tip:` kept), no backticks, no `${`.
- Fixed a previously truncated/broken state of `js/i18n/lessons-jpa-3.en.js` (file had `Unexpected end of input`); rewrote to a complete, parseable overlay.
- Checks: `node --check js/i18n/lessons-jpa-3.en.js` OK; `node scripts/check-i18n.js lessons-jpa-3` → `OK — 2 mục đã dịch.`; `node scripts/validate.js` still reports pre-existing unrelated errors in `q-banking.js` (~~~seq actor-count: banking-005/010/014) — not owned by this task, not modified. Warnings (modern-033 short answer, PATH missing lesson-design-006/007) also pre-existing.
Reviewed-by: check-i18n (translation, no LLM review)
