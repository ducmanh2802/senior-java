# T202 — Dịch sang tiếng Anh: q-scenario (14 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-scenario-1.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-scenario.js`: **scenario-001, scenario-002, scenario-003, scenario-004, scenario-005, scenario-006, scenario-007, scenario-008, scenario-009, scenario-010, scenario-011, scenario-012, scenario-013, scenario-014**.

Viết vào `js/i18n/q-scenario-1.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-scenario-1.en.js` và `node scripts/check-i18n.js q-scenario-1` → OK, rồi `Status: DONE`.

## Notes

Hoàn thành dịch 14 mục scenario-001 đến scenario-014. `node --check` và `node scripts/check-i18n.js q-scenario-1` đều OK (`OK — 14 mục đã dịch.`). `node scripts/validate.js` in `OK — không có lỗi.` Giữ nguyên markup, code block, thuật ngữ chuyên ngành; chỉ dịch `q`, `a`, `follow`; không thêm `tags` hay các field khác; `**Tóm tắt:**` → `**Summary:**`; `### Làm rõ yêu cầu` → `### Clarify requirements`; `### Điều tra / Phân tích` → `### Investigate / Analyze`; `### Giải pháp` → `### Solution`; `### Trade-off & pitfall` → `### Trade-off & pitfall`; `> Senior tip:` giữ nguyên.
Reviewed-by: check-i18n (translation, no LLM review)
