# T218 — Dịch sang tiếng Anh: q-soft (8 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-soft-3.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-soft.js`: **behavioral-010, behavioral-011, behavioral-012, testing-011, testing-012, testing-013, testing-014, testing-015**.

Viết vào `js/i18n/q-soft-3.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-soft-3.en.js` và `node scripts/check-i18n.js q-soft-3` → OK, rồi `Status: DONE`.

## Notes
- Đã viết đầy đủ 8 mục vào `js/i18n/q-soft-3.en.js`: behavioral-010, 011, 012; testing-011, 012, 013, 014, 015.
- Dịch kỹ thuật tự nhiên, giữ nguyên markup (`**Summary:**`, `###`, `~~~java`, bảng, `> Senior tip:`), chỉ dịch comment trong code block.
- Không dùng backtick bên trong template literal, không có `${` thô; `node --check` và `node scripts/check-i18n.js q-soft-3` → OK.
- `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
