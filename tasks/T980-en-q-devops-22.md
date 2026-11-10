# T980 — Dịch sang tiếng Anh: q-devops (5 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-devops-22.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-devops.js`: **devops-124, devops-125, devops-126, devops-127, devops-128**.

Viết vào `js/i18n/q-devops-22.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-devops-22.en.js` và `node scripts/check-i18n.js q-devops-22` → OK, rồi `Status: DONE`.

## Notes
- Translated devops-124 through devops-128 (q, a, follow) into `js/i18n/q-devops-22.en.js` via `App.i18n.content({...})`.
- Kept markup (`**`, `{{code}}`, `###`, tables, `~~~lang` blocks); code blocks translated comments only, code kept intact.
- Fixed label mappings: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" kept; no "### Lưu ý khi phỏng vấn" present in these answers.
- Verified: `node --check` OK, `node scripts/check-i18n.js q-devops-22` OK (5 mục đã dịch), `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
