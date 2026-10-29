# T420 — Dịch sang tiếng Anh: quiz-java (23 mục)

Status: TODO
Agent: opencode
Owns: `js/i18n/quiz-java-2.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-java.js`: **qz-collections-016, qz-collections-017, qz-collections-018, qz-collections-019, qz-collections-020, qz-modern-007, qz-modern-008, qz-modern-009, qz-modern-010, qz-modern-011, qz-modern-012, qz-modern-013, qz-modern-014, qz-modern-015, qz-modern-016, qz-modern-017, qz-modern-018, qz-modern-019, qz-modern-020, qz-concurrency-007, qz-concurrency-008, qz-concurrency-009, qz-concurrency-010**.

Viết vào `js/i18n/quiz-java-2.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-java-2.en.js` và `node scripts/check-i18n.js quiz-java-2` → OK, rồi `Status: DONE`.

## Notes
