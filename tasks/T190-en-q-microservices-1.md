# T190 — Dịch sang tiếng Anh: q-microservices (10 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-microservices-1.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-microservices.js`: **microservices-001, microservices-002, microservices-003, microservices-004, microservices-005, microservices-006, microservices-007, microservices-008, microservices-009, microservices-010**.

Viết vào `js/i18n/q-microservices-1.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-microservices-1.en.js` và `node scripts/check-i18n.js q-microservices-1` → OK, rồi `Status: DONE`.

## Notes

- Dịch đủ 10 mục microservices-001..010 vào `js/i18n/q-microservices-1.en.js` (field q, a, follow; giữ nguyên markup, code block, bảng, `{{code}}`, `> Senior tip:`, refs không dịch trong file này).
- Đã chạy `node --check`, `node scripts/check-i18n.js q-microservices-1` (OK — 10 mục đã dịch) và `node scripts/validate.js` (OK — không có lỗi; các cảnh báo q-english.js thuộc file của task khác).
Reviewed-by: check-i18n (translation, no LLM review)
