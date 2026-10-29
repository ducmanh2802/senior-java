# T424 — Dịch sang tiếng Anh: quiz-spring (21 mục)

Status: TODO
Agent: opencode
Owns: `js/i18n/quiz-spring-2.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-spring.js`: **qz-jpa-013, qz-jpa-014, qz-jpa-015, qz-jpa-016, qz-jpa-017, qz-jpa-018, qz-jpa-019, qz-jpa-020, qz-db-007, qz-db-008, qz-db-009, qz-db-010, qz-db-011, qz-db-012, qz-db-013, qz-db-014, qz-db-015, qz-db-016, qz-db-017, qz-db-018, qz-db-019**.

Viết vào `js/i18n/quiz-spring-2.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-spring-2.en.js` và `node scripts/check-i18n.js quiz-spring-2` → OK, rồi `Status: DONE`.

## Notes
