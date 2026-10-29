# T414 — Dịch sang tiếng Anh: quiz-claude (30 mục)

Status: TODO
Agent: opencode
Owns: `js/i18n/quiz-claude-2.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-claude.js`: **qz-claude-064, qz-claude-065, qz-claude-066, qz-claude-067, qz-claude-068, qz-claude-069, qz-claude-070, qz-claude-071, qz-claude-072, qz-claude-073, qz-claude-074, qz-claude-075, qz-claude-076, qz-claude-077, qz-claude-078, qz-claude-079, qz-claude-080, qz-claude-081, qz-claude-082, qz-claude-083, qz-claude-084, qz-claude-085, qz-claude-086, qz-claude-087, qz-claude-088, qz-claude-089, qz-claude-090, qz-claude-091, qz-claude-092, qz-claude-093**.

Viết vào `js/i18n/quiz-claude-2.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-claude-2.en.js` và `node scripts/check-i18n.js quiz-claude-2` → OK, rồi `Status: DONE`.

## Notes
