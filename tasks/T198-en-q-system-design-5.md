# T198 — Dịch sang tiếng Anh: q-system-design (7 mục)

Status: DONE
Ghi chú: Đã dịch đủ 7 mục (design-018/019/020/021, architecture-009/010/011) vào js/i18n/q-system-design-5.en.js. `node --check` và `node scripts/check-i18n.js q-system-design-5` đều OK. `node scripts/validate.js` in OK.
Agent: opencode
Owns: `js/i18n/q-system-design-5.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-system-design.js`: **design-018, design-019, design-020, design-021, architecture-009, architecture-010, architecture-011**.

Viết vào `js/i18n/q-system-design-5.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-system-design-5.en.js` và `node scripts/check-i18n.js q-system-design-5` → OK, rồi `Status: DONE`.

## Notes
Reviewed-by: check-i18n (translation, no LLM review)
