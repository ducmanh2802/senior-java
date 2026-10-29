# T418 — Dịch sang tiếng Anh: quiz-claude (22 mục)

Status: TODO
Agent: opencode
Owns: `js/i18n/quiz-claude-6.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-claude.js`: **qz-claude-179, qz-claude-180, qz-claude-181, qz-claude-182, qz-claude-183, qz-claude-184, qz-claude-185, qz-claude-186, qz-claude-187, qz-claude-188, qz-claude-189, qz-claude-190, qz-claude-191, qz-claude-192, qz-claude-193, qz-claude-194, qz-claude-195, qz-claude-196, qz-claude-197, qz-claude-198, qz-claude-199, qz-claude-200**.

Viết vào `js/i18n/quiz-claude-6.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-claude-6.en.js` và `node scripts/check-i18n.js quiz-claude-6` → OK, rồi `Status: DONE`.

## Notes
