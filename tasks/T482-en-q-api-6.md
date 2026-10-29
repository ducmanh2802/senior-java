# T482 — Dịch sang tiếng Anh: q-api (4 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-api-6.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-api.js`: **api-027, api-028, api-029, api-030**.

Viết vào `js/i18n/q-api-6.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-api-6.en.js` và `node scripts/check-i18n.js q-api-6` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ 4 mục api-027 … api-030 (q, a, follow) trong `js/i18n/q-api-6.en.js`, giữ nguyên markup, bảng, sơ đồ ASCII và toàn bộ code block; chỉ dịch comment tiếng Việt trong code.
- Nhãn cố định: "**Summary:**", "> Senior tip:", "### Interview notes" (không có trong 4 mục này → không dùng).
- Kiểm tra: `node --check` (file parse OK qua check-i18n), `node scripts/check-i18n.js q-api-6` → `OK — 4 mục đã dịch.`, `node scripts/validate.js` → `OK — không có lỗi.`
Reviewed-by: check-i18n (translation, no LLM review)
