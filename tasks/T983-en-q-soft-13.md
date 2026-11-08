# T983 — Dịch sang tiếng Anh: q-soft (7 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-soft-13.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-soft.js`: **testing-041, testing-042, testing-043, testing-044, testing-045, testing-046, testing-047**.

Viết vào `js/i18n/q-soft-13.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-soft-13.en.js` và `node scripts/check-i18n.js q-soft-13` → OK, rồi `Status: DONE`.

## Notes
- Dịch đầy đủ 7 mục: testing-041..047 (q, a, follow) trong `js/i18n/q-soft-13.en.js`, overlay theo `App.i18n.content`. Giữ nguyên markup, nhãn cố định (Summary/Senior tip/Interview notes), thuật ngữ kỹ thuật, code block (chỉ dịch comment), không backtick, không `${`.
- `node --check js/i18n/q-soft-13.en.js` OK; `node scripts/check-i18n.js q-soft-13` → "OK — 7 mục đã dịch." `node scripts/validate.js` → "OK — không có lỗi."
Reviewed-by: check-i18n (translation, no LLM review)
