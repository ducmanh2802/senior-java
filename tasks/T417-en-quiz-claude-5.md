# T417 — Dịch sang tiếng Anh: quiz-claude (29 mục)

Status: TODO
Agent: opencode
Owns: `js/i18n/quiz-claude-5.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-claude.js`: **qz-claude-150, qz-claude-151, qz-claude-152, qz-claude-153, qz-claude-154, qz-claude-155, qz-claude-156, qz-claude-157, qz-claude-158, qz-claude-159, qz-claude-160, qz-claude-161, qz-claude-162, qz-claude-163, qz-claude-164, qz-claude-165, qz-claude-166, qz-claude-167, qz-claude-168, qz-claude-169, qz-claude-170, qz-claude-171, qz-claude-172, qz-claude-173, qz-claude-174, qz-claude-175, qz-claude-176, qz-claude-177, qz-claude-178**.

Viết vào `js/i18n/quiz-claude-5.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-claude-5.en.js` và `node scripts/check-i18n.js quiz-claude-5` → OK, rồi `Status: DONE`.

## Notes
