# T421 — Dịch sang tiếng Anh: quiz-java (22 mục)

Status: TODO
Agent: opencode
Owns: `js/i18n/quiz-java-3.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-java.js`: **qz-concurrency-011, qz-concurrency-012, qz-concurrency-013, qz-concurrency-014, qz-concurrency-015, qz-concurrency-016, qz-concurrency-017, qz-concurrency-018, qz-concurrency-019, qz-concurrency-020, qz-jvm-007, qz-jvm-008, qz-jvm-009, qz-jvm-010, qz-jvm-011, qz-jvm-012, qz-jvm-013, qz-jvm-014, qz-jvm-015, qz-jvm-016, qz-jvm-017, qz-jvm-018**.

Viết vào `js/i18n/quiz-java-3.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-java-3.en.js` và `node scripts/check-i18n.js quiz-java-3` → OK, rồi `Status: DONE`.

## Notes
