# T413 — Dịch sang tiếng Anh: quiz-claude (63 mục)

Status: TODO
Agent: opencode
Owns: `js/i18n/quiz-claude-1.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-claude.js`: **qz-claude-001, qz-claude-002, qz-claude-003, qz-claude-004, qz-claude-005, qz-claude-006, qz-claude-007, qz-claude-008, qz-claude-009, qz-claude-010, qz-claude-011, qz-claude-012, qz-claude-013, qz-claude-014, qz-claude-015, qz-claude-016, qz-claude-017, qz-claude-018, qz-claude-019, qz-claude-020, qz-claude-021, qz-claude-022, qz-claude-023, qz-claude-024, qz-claude-025, qz-claude-026, qz-claude-027, qz-claude-028, qz-claude-029, qz-claude-030, qz-claude-031, qz-claude-032, qz-claude-033, qz-claude-034, qz-claude-035, qz-claude-036, qz-claude-037, qz-claude-038, qz-claude-039, qz-claude-040, qz-claude-041, qz-claude-042, qz-claude-043, qz-claude-044, qz-claude-045, qz-claude-046, qz-claude-047, qz-claude-048, qz-claude-049, qz-claude-050, qz-claude-051, qz-claude-052, qz-claude-053, qz-claude-054, qz-claude-055, qz-claude-056, qz-claude-057, qz-claude-058, qz-claude-059, qz-claude-060, qz-claude-061, qz-claude-062, qz-claude-063**.

Viết vào `js/i18n/quiz-claude-1.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-claude-1.en.js` và `node scripts/check-i18n.js quiz-claude-1` → OK, rồi `Status: DONE`.

## Notes
