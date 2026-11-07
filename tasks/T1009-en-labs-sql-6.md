# T1009 — Dịch sang tiếng Anh: labs-sql (4 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/labs-sql-6.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/labs-sql.js`: **lab-sql-011, lab-sql-012, lab-sql-013, lab-sql-014**.

Viết vào `js/i18n/labs-sql-6.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, scenario, questions, hints, answer, rubric**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/labs-sql-6.en.js` và `node scripts/check-i18n.js labs-sql-6` → OK, rồi `Status: DONE`.

## Notes
- Translated lab-sql-011..014 into `js/i18n/labs-sql-6.en.js` using `App.i18n.content` overlay (fields: title, scenario, questions, hints, answer, rubric). Preserved markup, `{{code}}`, `~~~` blocks, code/artifact literals, and technical terms; translated Vietnamese comments in code blocks where present.
- Checks: `node --check js/i18n/labs-sql-6.en.js` OK; `node scripts/check-i18n.js labs-sql-6` → "OK — 4 mục đã dịch."
- `node scripts/validate.js` still reports pre-existing unrelated errors in `q-banking.js` (seq diagram actor counts for banking-005/010/014) and existing warnings (modern-033 short answer, PATH missing lesson-design-006/007). No files outside task ownership were modified.
Reviewed-by: check-i18n (translation, no LLM review)
