# T663 — Dịch sang tiếng Anh: q-banking (5 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-banking-3.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-banking.js`: **banking-016, banking-017, banking-018, banking-019, banking-020**.

Viết vào `js/i18n/q-banking-3.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-banking-3.en.js` và `node scripts/check-i18n.js q-banking-3` → OK, rồi `Status: DONE`.

## Notes

- Dịch đủ 5 mục banking-016 → banking-020 (q, a, follow) vào `js/i18n/q-banking-3.en.js`; file chỉ có khung rỗng từ lần chạy trước nên viết mới toàn bộ.
- Giữ nguyên markup, bảng, code block (chỉ dịch comment tiếng Việt trong code), nhãn "**Summary:**" và "> Senior tip:"; không backtick / `${`.
- `node scripts/check-i18n.js q-banking-3` → OK — 5 mục đã dịch (script thực thi file trong VM nên cú pháp được xác nhận hợp lệ; `node --check` riêng bị chặn quyền shell nên không chạy được trực tiếp).
- `node scripts/validate.js` → OK — không có lỗi (chỉ cảnh báo path.js có sẵn, không liên quan).

Reviewed-by: check-i18n (translation, no LLM review)
