# T974 — Dịch sang tiếng Anh: q-devops (7 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-devops-16.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-devops.js`: **devops-080, devops-081, devops-082, devops-083, devops-084, devops-085, devops-086**.

Viết vào `js/i18n/q-devops-16.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-devops-16.en.js` và `node scripts/check-i18n.js q-devops-16` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ 7 mục `devops-080`–`devops-086` (q, a, follow) trong `js/i18n/q-devops-16.en.js` theo đúng format overlay `App.i18n.content`.
- Giữ nguyên markup, code blocks, {{inline code}}, bảng, seq diagram; thuật ngữ kỹ thuật giữ nguyên; "Tóm tắt:" → "Summary:".
- Gỡ `tags` khỏi bản dịch (field không được phép trong overlay). `node --check` OK, `node scripts/check-i18n.js q-devops-16` → OK (7 mục), `node scripts/validate.js` → OK.
Reviewed-by: check-i18n (translation, no LLM review)
