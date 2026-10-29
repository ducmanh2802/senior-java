# T400 — Dịch sang tiếng Anh: q-primer (7 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-primer-1.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-primer.js`: **primer-001, primer-002, primer-003, primer-004, primer-005, primer-006, primer-007**.

Viết vào `js/i18n/q-primer-1.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-primer-1.en.js` và `node scripts/check-i18n.js q-primer-1` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ primer-001..007 (q, a, follow), giữ nguyên markup, code, số liệu và độ chi tiết.
- `node scripts/check-i18n.js q-primer-1`: OK — 7 mục đã dịch. `node scripts/validate.js`: OK — không có lỗi.
- Lệnh `node --check js/i18n/q-primer-1.en.js` bị chặn bởi quyền shell; file đã được `check-i18n.js` nạp và parse thành công.
Reviewed-by: check-i18n (translation, no LLM review)
