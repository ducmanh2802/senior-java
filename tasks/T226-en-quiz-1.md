# T226 — Dịch sang tiếng Anh: quiz (20 mục)

Status: DONE
Note: Translated 20 quiz questions to English in `js/i18n/quiz-1.en.js`. Validation OK for i18n.
Agent: opencode
Owns: `js/i18n/quiz-1.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz.js`: **qz-devops-001, qz-devops-002, qz-kotlin-001, qz-kotlin-002, qz-collections-001, qz-collections-002, qz-collections-003, qz-collections-004, qz-collections-005, qz-collections-006, qz-core-001, qz-core-002, qz-core-003, qz-core-004, qz-core-005, qz-core-006, qz-modern-001, qz-modern-002, qz-modern-003, qz-modern-004**.

Viết vào `js/i18n/quiz-1.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-1.en.js` và `node scripts/check-i18n.js quiz-1` → OK, rồi `Status: DONE`.

## Notes
Reviewed-by: check-i18n (translation, no LLM review)
Reviewed-by: check-i18n (translation, no LLM review)
