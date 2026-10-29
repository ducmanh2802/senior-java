# T415 — Dịch sang tiếng Anh: quiz-claude (28 mục)

Status: TODO
Agent: opencode
Owns: `js/i18n/quiz-claude-3.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-claude.js`: **qz-claude-094, qz-claude-095, qz-claude-096, qz-claude-097, qz-claude-098, qz-claude-099, qz-claude-100, qz-claude-101, qz-claude-102, qz-claude-103, qz-claude-104, qz-claude-105, qz-claude-106, qz-claude-107, qz-claude-108, qz-claude-109, qz-claude-110, qz-claude-111, qz-claude-112, qz-claude-113, qz-claude-114, qz-claude-115, qz-claude-116, qz-claude-117, qz-claude-118, qz-claude-119, qz-claude-120, qz-claude-121**.

Viết vào `js/i18n/quiz-claude-3.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-claude-3.en.js` và `node scripts/check-i18n.js quiz-claude-3` → OK, rồi `Status: DONE`.

## Notes
