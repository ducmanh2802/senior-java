# T975 — Dịch sang tiếng Anh: q-devops (6 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-devops-17.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-devops.js`: **devops-087, devops-088, devops-089, devops-090, devops-091, devops-092**.

Viết vào `js/i18n/q-devops-17.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-devops-17.en.js` và `node scripts/check-i18n.js q-devops-17` → OK, rồi `Status: DONE`.

## Notes
- Translated 6 items: devops-087, devops-088, devops-089, devops-090, devops-091, devops-092 (q, a, follow). Preserved all markup ({{code}}, tables, ~~~seq/bash/text/yaml~~~ blocks), numeric values, and technical terms. Translated Vietnamese headings/labels: "**Tóm tắt:**" → "**Summary:**", "### Thuật ngữ..." → "### Terms...", "### Cách làm từng bước" → "### Step-by-step approach", "### Trên production" → "### In production", "### Bảng so sánh" → "### Comparison table", "### Ví dụ..." → "### Example...", "### Vì sao..." → "### Why...", "### Câu trả lời sai phổ biến" → "### Common wrong answers", "### Lỗi hay gặp" → "### Common pitfalls", "### Trả lời phỏng vấn" → "### Interview answer"; kept "> Senior tip:" as-is.
- Checks: `node --check js/i18n/q-devops-17.en.js` OK; `node scripts/check-i18n.js q-devops-17` → "OK — 6 mục đã dịch."; `node scripts/validate.js` → "OK — không có lỗi." (existing unrelated warnings unchanged).
- Did not run `node scripts/build-light-index.js` (it modifies `js/data/index-light.js`, outside task ownership); validator did not flag it stale. Integrator may run it if required. Removed temporary helper scripts created during generation. No git commands run.
Reviewed-by: check-i18n (translation, no LLM review)
