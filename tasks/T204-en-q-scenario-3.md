# T204 — Dịch sang tiếng Anh: q-scenario (17 mục)

Status: DONE
Ghi chú: Đã dịch đủ 17 mục scenario-027 đến scenario-043 trong js/i18n/q-scenario-3.en.js; giữ nguyên markup, thuật ngữ kỹ thuật, code block và cấu trúc follow. Đã chạy node --check và node scripts/check-i18n.js q-scenario-3 (OK 17 mục) và node scripts/validate.js (OK, không lỗi liên quan).
Agent: opencode
Owns: `js/i18n/q-scenario-3.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-scenario.js`: **scenario-027, scenario-028, scenario-029, scenario-030, scenario-031, scenario-032, scenario-033, scenario-034, scenario-035, scenario-036, scenario-037, scenario-038, scenario-039, scenario-040, scenario-041, scenario-042, scenario-043**.

Viết vào `js/i18n/q-scenario-3.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-scenario-3.en.js` và `node scripts/check-i18n.js q-scenario-3` → OK, rồi `Status: DONE`.

## Notes
Reviewed-by: check-i18n (translation, no LLM review)
