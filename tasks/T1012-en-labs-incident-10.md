# T1012 — Dịch sang tiếng Anh: labs-incident (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/labs-incident-10.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/labs-incident.js`: **lab-incident-025, lab-incident-026**.

Viết vào `js/i18n/labs-incident-10.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, scenario, questions, hints, answer, rubric**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/labs-incident-10.en.js` và `node scripts/check-i18n.js labs-incident-10` → OK, rồi `Status: DONE`.

## Notes

- `artifacts` removed from lab-incident-026 translation: `check-i18n.js` rejects copying `artifacts` (only translatable fields allowed). Artifacts are rendered from the original Vietnamese file.
- All checks passed: `node --check` OK, `check-i18n.js` OK (2 items translated).
- Remaining `validate.js` errors (`q-banking.js: banking-014` seq actors, `modern-033` short answer, `path.js` lessons) are pre-existing in other agents' files — not owned by T1012.
Reviewed-by: check-i18n (translation, no LLM review)
