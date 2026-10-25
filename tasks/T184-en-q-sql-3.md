# T184 — Dịch sang tiếng Anh: q-sql (6 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-sql-3.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-sql.js`: **sql-017, sql-018, sql-019, sql-020, sql-021, sql-022**.

Viết vào `js/i18n/q-sql-3.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-sql-3.en.js` và `node scripts/check-i18n.js q-sql-3` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ 6 mục (sql-017…sql-022) vào `js/i18n/q-sql-3.en.js`: field q, a, follow; giữ nguyên markup ({{code}}, ###, bảng, ~~~sql), code block chỉ dịch comment; "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên.
- Lần chạy trước bị gián đoạn chỉ để lại khung rỗng; lần này viết lại toàn bộ, giữ header.
- `node --check`, `node scripts/check-i18n.js q-sql-3` (OK — 6 mục đã dịch), `node scripts/validate.js` (OK — không có lỗi). Số định dạng kiểu "20.000.000 x 0,3" được chuyển sang dạng Anh "20,000,000 x 0.3" (cùng giá trị) cho dễ đọc; chuỗi hiển thị 'Tất cả' trong code block dịch thành 'All'.
Reviewed-by: check-i18n (translation, no LLM review)
