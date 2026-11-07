# T662 — Dịch sang tiếng Anh: q-banking (7 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-banking-2.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-banking.js`: **banking-009, banking-010, banking-011, banking-012, banking-013, banking-014, banking-015**.

Viết vào `js/i18n/q-banking-2.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-banking-2.en.js` và `node scripts/check-i18n.js q-banking-2` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ 7 mục banking-009..015 vào `js/i18n/q-banking-2.en.js` (chỉ field q/a/follow; markup, seq/java/sql/text code blocks giữ nguyên cấu trúc; comment và seq dịch sang tiếng Anh, không còn dấu tiếng Việt).
- `node scripts/check-i18n.js q-banking-2` → OK — 7 mục đã dịch; `node scripts/validate.js` → OK — không có lỗi. (`node --check` bị chặn theo quyền chạy lệnh; file đã được parse thành công qua vm trong check-i18n nên cú pháp hợp lệ.)
Reviewed-by: check-i18n (translation, no LLM review)
