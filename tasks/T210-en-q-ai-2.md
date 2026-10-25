# T210 — Dịch sang tiếng Anh: q-ai (9 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-ai-2.en.js`

Notes:
- Đã dịch đầy đủ 9 mục ai-010 → ai-018 vào `js/i18n/q-ai-2.en.js` (App.i18n.content).
- Sửa lỗi cú pháp: escape `'` trong follow array (`can't`), escape backtick trong `a:` (ts_rank, triple backticks), thay `~~~` cho đóng code block, dịch 2 từ tiếng Việt còn sót (`ngân hàng` → banking, `lãi suất` → interest rate; `câu trả lời` → the answer streams back).
- `node --check` OK, `node scripts/check-i18n.js q-ai-2` → OK — 9 mục đã dịch, `node scripts/validate.js` → OK — không có lỗi.

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-ai.js`: **ai-010, ai-011, ai-012, ai-013, ai-014, ai-015, ai-016, ai-017, ai-018**.

Viết vào `js/i18n/q-ai-2.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-ai-2.en.js` và `node scripts/check-i18n.js q-ai-2` → OK, rồi `Status: DONE`.

## Notes
Reviewed-by: check-i18n (translation, no LLM review)
