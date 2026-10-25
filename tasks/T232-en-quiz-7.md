# T232 — Dịch sang tiếng Anh: quiz (18 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-7.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz.js`: **qz-testing-005, qz-testing-006, qz-sql-001, qz-sql-002, qz-sql-003, qz-sql-004, qz-sql-005, qz-sql-006, qz-sql-007, qz-sql-008, qz-api-001, qz-api-002, qz-api-003, qz-api-004, qz-api-005, qz-api-006, qz-api-007, qz-api-008**.

Viết vào `js/i18n/quiz-7.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-7.en.js` và `node scripts/check-i18n.js quiz-7` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch 18 mục quiz sang tiếng Anh trong js/i18n/quiz-7.en.js. Đã kiểm tra với script/check-i18n.js và node --check.
Reviewed-by: check-i18n (translation, no LLM review)
Reviewed-by: check-i18n (translation, no LLM review)
