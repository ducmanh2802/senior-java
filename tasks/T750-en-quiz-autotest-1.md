# T750 — Dịch sang tiếng Anh: quiz-autotest (28 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-autotest-1.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-autotest.js`: **qz-autotest-001, qz-autotest-002, qz-autotest-003, qz-autotest-004, qz-autotest-005, qz-autotest-006, qz-autotest-007, qz-autotest-008, qz-autotest-009, qz-autotest-010, qz-autotest-011, qz-autotest-012, qz-autotest-013, qz-autotest-014, qz-autotest-015, qz-autotest-016, qz-autotest-017, qz-autotest-018, qz-autotest-019, qz-autotest-020, qz-autotest-021, qz-autotest-022, qz-autotest-023, qz-autotest-024, qz-autotest-025, qz-autotest-026, qz-autotest-027, qz-autotest-028**.

Viết vào `js/i18n/quiz-autotest-1.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-autotest-1.en.js` và `node scripts/check-i18n.js quiz-autotest-1` → OK, rồi `Status: DONE`.

## Notes
Reviewed-by: check-i18n (translation, no LLM review)
